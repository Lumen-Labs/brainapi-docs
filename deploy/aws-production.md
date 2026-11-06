# Documentation production on the shared AWS fleet

The documentation site moved from the IONOS PM2 host to the MaaS AWS fleet on 2026-11-05. It is served at `https://brainapi.lumen-labs.ai/docs` by two application servers in separate availability zones behind an HTTPS Application Load Balancer.

Both servers run `brainapi-docs` under PM2, using Node 22.22.3 and port 3877. The runtime sets Next.js `basePath` to `/docs`. The fleet's `/docs/v2/quickstart` health check must return 200 before a replacement server can take over.

The updated `.github/workflows/deploy.yaml` packages the built documentation and calls `scripts/operations/deploy-aws.py --component docs`. AWS access uses GitHub OIDC. The deployment preserves the MaaS artifact from the previous release, then rolls the shared fleet while retaining at least two healthy targets. It uses the same deployment lock as the MaaS repository, so simultaneous updates from the two repositories cannot overlap.

Production deployments use the AWS workflow on `main`. The migration disabled the old IONOS workflow. The first AWS workflow run publishes a docs artifact and rolls the fleet with the current MaaS artifact.

The detailed infrastructure, rollback instructions, migration evidence and capacity settings are maintained in the sibling `brainapi-maas-nextjs` repository:

- `docs/operations/aws-production.md`: operations and deployment runbook.
- `docs/operations/aws-migration-2026-11-05.md`: migration and rolling-replacement evidence.
- `infra/production-aws/`: CloudFormation and bootstrap sources.

Do not restart both documentation processes simultaneously or update the active `.next` directory in place. Use an immutable artifact and an instance refresh. The old IONOS documentation release is retained as part of the rollback path; it is no longer the production deployment destination.

## First GitHub production releases

On 2026-11-06, GitHub Actions completed the [MaaS release](https://github.com/Lumen-Labs/brainapi-maas-nextjs/actions/runs/42200699031) and then the [documentation release](https://github.com/Lumen-Labs/brainapi-docs/actions/runs/42199622120). The documentation release reused the MaaS runtime from commit `eff8550` and deployed the docs runtime from commit `d764462`.

Early attempts rolled back while the GitHub role lacked permissions CloudFormation needed to inspect production resources. The permissions are managed in the MaaS stack template. A concurrent deployment attempt stopped at the shared lock, and the docs release succeeded after MaaS released it. The docs build also upgraded Next.js from 16.3.2 to 16.4.5 and refreshed the dependency lockfile to clear high and critical audit findings.

After the second rollout, both nodes were healthy in each of the web, queue, and docs target groups. The public sign-in page and docs quickstart returned HTTP 200. CloudWatch recorded no load-balancer or target HTTP 502 or 503 responses from 11:11 to 12:02 Europe/Rome, covering both successful workflow runs.
