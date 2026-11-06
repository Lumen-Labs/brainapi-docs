#!/usr/bin/env python3
"""Publish one component and roll the fleet while retaining two healthy targets.

Requires boto3 and AWS credentials (GitHub OIDC in CI). The SSM lock serializes
deployments across both repositories; a stale lock must be inspected manually.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import time
import uuid

import boto3

STACK = "brainapi-maas-prod"
BUCKET = "brainapi-maas-prod-515310961483-eu-central-1"
LOCK = "/brainapi/maas/production/deployment-lock"
ERROR_ALARMS = ["brainapi-maas-prod-elb-502", "brainapi-maas-prod-elb-503"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--component", choices=["maas", "docs"], required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--release", required=True)
    parser.add_argument("--region", default="eu-central-1")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{5,100}", args.release):
        parser.error("release must be a unique safe artifact identifier")
    if not args.archive.is_file():
        parser.error("archive does not exist")

    session = boto3.Session(region_name=args.region)
    cfn, s3, asg, elb, ssm, cloudwatch = [session.client(s) for s in ["cloudformation", "s3", "autoscaling", "elbv2", "ssm", "cloudwatch"]]
    owner = str(uuid.uuid4())
    # No overwrite: a crashed deployment fails closed instead of overlapping.
    ssm.put_parameter(Name=LOCK, Type="String", Value=json.dumps({"owner": owner, "release": args.release, "started": time.time()}), Overwrite=False)
    previous = None
    changed = False
    safe_unlock = True

    def stack():
        return cfn.describe_stacks(StackName=STACK)["Stacks"][0]

    def targets():
        outputs = {item["OutputKey"]: item["OutputValue"] for item in stack()["Outputs"]}
        return [outputs[name + "TargetGroup"] for name in ["Web", "Queue", "Docs"]]

    def require_capacity(groups):
        for group in groups:
            descriptions = elb.describe_target_health(TargetGroupArn=group)["TargetHealthDescriptions"]
            healthy = [item for item in descriptions if item["TargetHealth"]["State"] == "healthy"]
            if len(healthy) < 2:
                raise RuntimeError("Deployment halted: fewer than two healthy targets in " + group)

    def set_release(release):
        params = [{"ParameterKey": p["ParameterKey"], **({"ParameterValue": release} if p["ParameterKey"] == "ReleaseId" else {"UsePreviousValue": True})} for p in stack()["Parameters"]]
        cfn.update_stack(StackName=STACK, UsePreviousTemplate=True, Parameters=params, Capabilities=["CAPABILITY_NAMED_IAM"])
        cfn.get_waiter("stack_update_complete").wait(StackName=STACK, WaiterConfig={"Delay": 15, "MaxAttempts": 120})

    def refresh(groups, watch_errors=True):
        preferences = {"MinHealthyPercentage": 100, "MaxHealthyPercentage": 150, "InstanceWarmup": 60, "SkipMatching": True}
        if watch_errors:
            preferences["AlarmSpecification"] = {"Alarms": ERROR_ALARMS}
        refresh_id = asg.start_instance_refresh(AutoScalingGroupName=STACK, Preferences=preferences)["InstanceRefreshId"]
        deadline = time.monotonic() + 2700
        last = None
        while time.monotonic() < deadline:
            status = asg.describe_instance_refreshes(AutoScalingGroupName=STACK, InstanceRefreshIds=[refresh_id])["InstanceRefreshes"][0]
            summary = (status["Status"], status.get("PercentageComplete", 0))
            if summary != last:
                print("Instance refresh:", *summary, flush=True)
                last = summary
            require_capacity(groups)
            if status["Status"] == "Successful":
                return
            if status["Status"] in ["Failed", "Cancelled", "RollbackFailed", "RollbackSuccessful"]:
                raise RuntimeError(status.get("StatusReason", status["Status"]))
            time.sleep(15)
        raise TimeoutError("Instance refresh did not finish in 45 minutes")

    try:
        current = stack()
        if current["StackStatus"] not in ["CREATE_COMPLETE", "UPDATE_COMPLETE", "UPDATE_ROLLBACK_COMPLETE"]:
            raise RuntimeError("CloudFormation stack is not stable")
        previous = next(p["ParameterValue"] for p in current["Parameters"] if p["ParameterKey"] == "ReleaseId")
        if args.release == previous:
            raise RuntimeError("Use a fresh release identifier; artifacts are immutable")
        active = asg.describe_instance_refreshes(AutoScalingGroupName=STACK, MaxRecords=1)["InstanceRefreshes"]
        if active and active[0]["Status"] in ["Pending", "InProgress", "Baking", "Cancelling", "RollbackInProgress"]:
            raise RuntimeError("An instance refresh is already active")
        groups = targets()
        require_capacity(groups)
        alarms = cloudwatch.describe_alarms(AlarmNames=ERROR_ALARMS)["MetricAlarms"]
        if len(alarms) != len(ERROR_ALARMS) or any(alarm["StateValue"] == "ALARM" for alarm in alarms):
            raise RuntimeError("Deployment error alarms are missing or already in ALARM")
        # Reserve the release before uploading. A missing-key HEAD requires ListBucket.
        manifest_key = f"releases/{args.release}/manifest.json"
        try:
            s3.put_object(
                Bucket=BUCKET,
                Key=manifest_key,
                Body=json.dumps({"release": args.release, "status": "reserved"}),
                ServerSideEncryption="AES256",
                ContentType="application/json",
                IfNoneMatch="*",
            )
        except s3.exceptions.ClientError as error:
            if error.response["Error"]["Code"] in ("412", "PreconditionFailed"):
                raise RuntimeError("Release already exists") from error
            raise
        unchanged = "docs" if args.component == "maas" else "maas"
        s3.copy_object(Bucket=BUCKET, Key=f"releases/{args.release}/{unchanged}-runtime.tgz", CopySource={"Bucket": BUCKET, "Key": f"releases/{previous}/{unchanged}-runtime.tgz"}, ServerSideEncryption="AES256")
        s3.upload_file(str(args.archive), BUCKET, f"releases/{args.release}/{args.component}-runtime.tgz", ExtraArgs={"ServerSideEncryption": "AES256"})
        with args.archive.open("rb") as artifact:
            digest = hashlib.file_digest(artifact, "sha256").hexdigest()
        s3.put_object(Bucket=BUCKET, Key=manifest_key, Body=json.dumps({"release": args.release, "previous": previous, "component": args.component, "sha256": digest}), ServerSideEncryption="AES256", ContentType="application/json")
        changed = True
        safe_unlock = False
        set_release(args.release)
        refresh(groups)
        safe_unlock = True
        print("Deployment complete:", args.release, flush=True)
    except BaseException:
        if changed and previous:
            print("Deployment interrupted; restoring previous release:", previous, flush=True)
            active = asg.describe_instance_refreshes(AutoScalingGroupName=STACK, MaxRecords=1)["InstanceRefreshes"]
            if active and active[0]["Status"] in ["Pending", "InProgress", "Baking"]:
                asg.cancel_instance_refresh(AutoScalingGroupName=STACK)
                while asg.describe_instance_refreshes(AutoScalingGroupName=STACK, InstanceRefreshIds=[active[0]["InstanceRefreshId"]])["InstanceRefreshes"][0]["Status"] == "Cancelling":
                    time.sleep(10)
            state = stack()
            if state["StackStatus"] == "UPDATE_IN_PROGRESS":
                cfn.get_waiter("stack_update_complete").wait(StackName=STACK)
            current_release = next(p["ParameterValue"] for p in stack()["Parameters"] if p["ParameterKey"] == "ReleaseId")
            if current_release != previous:
                set_release(previous)
                refresh(targets(), watch_errors=False)
            safe_unlock = True
        raise
    finally:
        lock = json.loads(ssm.get_parameter(Name=LOCK)["Parameter"]["Value"])
        if safe_unlock and lock.get("owner") == owner:
            ssm.delete_parameter(Name=LOCK)


if __name__ == "__main__":
    main()
