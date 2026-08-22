# BrainAPI documentation

This repository contains the source for the public [BrainAPI documentation](https://brainapi.lumen-labs.ai/docs). It is a Next.js 15 and Fumadocs application with versioned documentation, generated API reference pages, searchable Markdown mirrors, and a documentation MCP endpoint.

## What is published

- BrainAPI V2 is the current documentation set.
- BrainAPI V1 remains available as legacy documentation.
- Search, LLM indexes, Markdown mirrors, the sitemap, and Docs MCP share the same publication rules.
- Benchmark sources and incomplete placeholder pages remain in the repository for review, but are intentionally excluded from every published surface.

The publication predicate is implemented in `src/lib/source.ts`. Update it whenever a page is added to or removed from the public site.

## Prerequisites

- Node.js 22
- npm 10 or later

The repository includes `.nvmrc` for compatible Node version managers.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000/docs](http://localhost:3000/docs).

## Validate a change

```bash
npm run docs:check
npm run build
```

`docs:check` validates the visible V2 navigation, internal links, anchors, JSON examples, and the checked-in OpenAPI snapshot. The production build also generates the HTML, Markdown, search, sitemap, and LLM surfaces.

## Synchronize the V2 API reference

The checked-in schema is generated from the BrainAPI source repository. Configure its location and Python environment when they are not in the default sibling layout:

```bash
BRAINAPI_SOURCE=/path/to/brainapi2 \
BRAINAPI_PYTHON=/path/to/brainapi2/.venv/bin/python \
npm run api:sync
```

Verify that the snapshot is current without changing it:

```bash
BRAINAPI_SOURCE=/path/to/brainapi2 \
BRAINAPI_PYTHON=/path/to/brainapi2/.venv/bin/python \
npm run api:check
```

Then regenerate the MDX reference pages when the schema changes:

```bash
npm run api:generate
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `content/v1` | Legacy BrainAPI documentation |
| `content/v2` | Current task-first documentation |
| `schemas` | Reviewable OpenAPI snapshots |
| `scripts` | Documentation, link, and schema validation |
| `src/app` | HTML, Markdown, LLM, search, sitemap, and MCP routes |
| `src/lib` | Shared source and publication logic |
| `public` | Public static assets |
| `deploy` | Deployment-policy handoff files |

## Contributions and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report suspected vulnerabilities using GitHub private vulnerability reporting as described in [SECURITY.md](SECURITY.md); do not open a public security issue.

Pull requests never receive production deployment secrets. Deployment runs only from `main` or a manual dispatch and is attached to the protected `production` environment.

## License

The repository is licensed under the [Apache License 2.0](LICENSE). Product names and third-party trademarks remain the property of their respective owners; see [NOTICE](NOTICE).
