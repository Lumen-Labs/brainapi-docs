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
