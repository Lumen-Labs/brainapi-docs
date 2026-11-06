"""Exercise deployment safety gates without contacting AWS."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from botocore.exceptions import ClientError

spec = importlib.util.spec_from_file_location("deploy_aws", Path(__file__).with_name("deploy-aws.py"))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.archive = Path(self.temp.name) / "runtime.tgz"
        self.archive.write_bytes(b"test artifact")
        self.clients = {name: MagicMock() for name in ["cloudformation", "s3", "autoscaling", "elbv2", "ssm", "cloudwatch"]}
        self.cfn = self.clients["cloudformation"]
        self.s3 = self.clients["s3"]
        self.asg = self.clients["autoscaling"]
        self.ssm = self.clients["ssm"]
        self.release = "previous123"
        self.clients["cloudwatch"].describe_alarms.return_value = {"MetricAlarms": [{"StateValue": "OK"}, {"StateValue": "OK"}]}
        self.cfn.describe_stacks.side_effect = lambda **_: {"Stacks": [{
            "StackStatus": "UPDATE_COMPLETE",
            "Parameters": [{"ParameterKey": "ReleaseId", "ParameterValue": self.release}],
            "Outputs": [{"OutputKey": name + "TargetGroup", "OutputValue": name} for name in ["Web", "Docs", "Queue"]],
        }]}
        self.asg.describe_instance_refreshes.return_value = {"InstanceRefreshes": []}
        self.clients["elbv2"].describe_target_health.return_value = {"TargetHealthDescriptions": [
            {"TargetHealth": {"State": "healthy"}}, {"TargetHealth": {"State": "healthy"}},
        ]}
        self.ssm.get_parameter.return_value = {"Parameter": {"Value": json.dumps({"owner": "test-owner"})}}
        self.s3.exceptions.ClientError = ClientError

    def run_deployment(self):
        session = MagicMock()
        session.client.side_effect = self.clients.__getitem__
        with patch.object(deploy.boto3, "Session", return_value=session), \
             patch.object(deploy.uuid, "uuid4", return_value="test-owner"), \
             patch("sys.argv", ["deploy-aws.py", "--component", "maas", "--archive", str(self.archive), "--release", "candidate123"]):
            deploy.main()

    def test_existing_release_cannot_be_overwritten(self):
        self.s3.put_object.side_effect = ClientError(
            {"Error": {"Code": "PreconditionFailed"}}, "PutObject"
        )
        with self.assertRaisesRegex(RuntimeError, "Release already exists"):
            self.run_deployment()
        self.s3.copy_object.assert_not_called()
        self.s3.upload_file.assert_not_called()
        self.cfn.update_stack.assert_not_called()

    def test_overlapping_refresh_cannot_publish_or_update_capacity(self):
        self.asg.describe_instance_refreshes.return_value = {"InstanceRefreshes": [{"Status": "InProgress"}]}
        with self.assertRaisesRegex(RuntimeError, "already active"):
            self.run_deployment()
        self.s3.upload_file.assert_not_called()
        self.cfn.update_stack.assert_not_called()
        self.ssm.delete_parameter.assert_called_once()

    def test_one_healthy_target_blocks_release_before_upload(self):
        self.clients["elbv2"].describe_target_health.return_value = {"TargetHealthDescriptions": [{"TargetHealth": {"State": "healthy"}}]}
        with self.assertRaisesRegex(RuntimeError, "fewer than two"):
            self.run_deployment()
        self.s3.upload_file.assert_not_called()
        self.cfn.update_stack.assert_not_called()

    def test_failed_rollback_keeps_global_deployment_lock(self):
        def update(**kwargs):
            release = next(p["ParameterValue"] for p in kwargs["Parameters"] if p["ParameterKey"] == "ReleaseId")
            if release == "previous123":
                raise RuntimeError("rollback failed")
            self.release = release
            return {}
        self.cfn.update_stack.side_effect = update
        self.cfn.get_waiter.return_value.wait.side_effect = RuntimeError("candidate failed")
        with self.assertRaisesRegex(RuntimeError, "rollback failed"):
            self.run_deployment()
        self.assertEqual(self.cfn.update_stack.call_count, 2)
        self.ssm.delete_parameter.assert_not_called()

    def test_existing_error_alarm_blocks_deployment_before_upload(self):
        self.clients["cloudwatch"].describe_alarms.return_value = {"MetricAlarms": [{"StateValue": "ALARM"}, {"StateValue": "OK"}]}
        with self.assertRaisesRegex(RuntimeError, "already in ALARM"):
            self.run_deployment()
        self.s3.upload_file.assert_not_called()
        self.cfn.update_stack.assert_not_called()

    def test_alarm_failed_refresh_restores_previous_release(self):
        latest = []
        def update(**kwargs):
            self.release = next(p["ParameterValue"] for p in kwargs["Parameters"] if p["ParameterKey"] == "ReleaseId")
            return {}
        def start(**kwargs):
            latest.append("candidate" if not latest else "rollback")
            return {"InstanceRefreshId": latest[-1]}
        def describe(**kwargs):
            if "InstanceRefreshIds" in kwargs:
                failed = kwargs["InstanceRefreshIds"][0] == "candidate"
                return {"InstanceRefreshes": [{"Status": "Failed" if failed else "Successful", "StatusReason": "ALB error alarm triggered", "PercentageComplete": 0 if failed else 100}]}
            return {"InstanceRefreshes": [{"InstanceRefreshId": "candidate", "Status": "Failed"}] if latest else []}
        self.cfn.update_stack.side_effect = update
        self.asg.start_instance_refresh.side_effect = start
        self.asg.describe_instance_refreshes.side_effect = describe
        with self.assertRaisesRegex(RuntimeError, "ALB error alarm triggered"):
            self.run_deployment()
        self.assertEqual(self.release, "previous123")
        self.assertEqual(latest, ["candidate", "rollback"])
        self.ssm.delete_parameter.assert_called_once()


if __name__ == "__main__":
    unittest.main()
