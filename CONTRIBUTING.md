# Contributing to the BrainAPI documentation

Thank you for improving the BrainAPI documentation. Contributions may fix an error, clarify a workflow, add an example, or update documentation after a shipped BrainAPI change.

## Before you start

1. Search existing issues and pull requests.
2. Use an issue for a substantial information-architecture or API-reference change.
3. Base behavior claims on shipped BrainAPI code, tests, manifests, ADRs, or release notes.
4. Do not include credentials, customer information, production screenshots, private hostnames, or local absolute paths.

## Local setup

Use Node.js 22 and npm:

```bash
npm ci
npm run dev
```

The documentation is served at `http://localhost:3000/docs`.

## Writing guidance

- Write for a reader task and state the expected outcome early.
- Distinguish shipped behavior from rationale and experimental ideas.
- Use fictional, domain-neutral data unless a domain is essential to the feature.
- Use `BrainPAT` and `X-Brain-ID` consistently in examples.
- Never publish real tokens, account identifiers, user data, or internal deployment information.
- Preserve established V1 and V2 routes unless a permanent redirect is added.
- Keep benchmark and placeholder sources unpublished unless maintainers explicitly change the shared publication predicate.

## Validation

Run before opening a pull request:

```bash
npm run docs:check
npm run build
```

If your change modifies the BrainAPI HTTP contract, also synchronize and review the OpenAPI snapshot using the commands in the README.

## Pull requests

Describe:

- the reader problem being solved;
- the source used to verify technical behavior;
- the routes or publication surfaces affected;
- the validation performed;
- whether screenshots or other binary assets were added.

By submitting a contribution, you agree that it is licensed under Apache-2.0 and that you have the right to submit it.
