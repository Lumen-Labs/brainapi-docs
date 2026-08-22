<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/images/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="public/images/logo-light.png">
    <img alt="BrainAPI" src="public/images/logo-light.png" width="420">
  </picture>
</p>

<h1 align="center">BrainAPI documentation</h1>

<p align="center">
  The source of the public, versioned documentation for BrainAPI.
</p>

<p align="center">
  <a href="https://brainapi.lumen-labs.ai/docs">Read the documentation</a>
  ·
  <a href="CONTRIBUTING.md">Contribute</a>
  ·
  <a href="SECURITY.md">Report a vulnerability</a>
</p>

## About this repository

This repository builds the BrainAPI documentation portal with Next.js 16 and Fumadocs. It contains task-oriented guides, conceptual explanations, a generated API reference, versioned documentation, searchable Markdown, and interfaces designed for both people and AI tools.

Use this repository to:

- improve the public BrainAPI guides and reference material;
- preview documentation changes locally;
- review the OpenAPI contract used to generate the V2 reference;
- verify that navigation, links, examples, and publication rules remain consistent;
- maintain the documentation search, LLM indexes, sitemap, and Docs MCP endpoint.

This repository contains documentation only. BrainAPI runtime behavior is implemented in the separate `brainapi2` source repository.

## Documentation sets

| Set | Status | Purpose |
| --- | --- | --- |
| V2 | Current | The default documentation for the actively developed BrainAPI API |
| V1 | Legacy | Documentation for integrations that have not migrated to V2 |

Some source pages—such as benchmarks and incomplete placeholders—are intentionally kept in Git for public review but are not published. A shared predicate in [`src/lib/source.ts`](src/lib/source.ts) excludes them from HTML pages, Markdown mirrors, search, LLM feeds, the sitemap, and Docs MCP. Public source availability does not imply that a page is part of the supported documentation surface.

## Start locally

### Requirements

- Node.js 22 (see [`.nvmrc`](.nvmrc))
- npm 10 or later

### Run the site

```bash
nvm use
npm ci
npm run dev
```

Open [http://localhost:3000/docs](http://localhost:3000/docs).

No environment file is required for local development. [`.env.example`](.env.example) documents the optional `NEXT_PUBLIC_DOCS_ORIGIN` setting used to generate canonical metadata and the sitemap for a non-default deployment. Copy it to an untracked local file only when you need to override that origin.

## Make a documentation change

1. Find the relevant MDX page under `content/v2` or `content/v1`.
2. Edit the page and its nearest `meta.json` if navigation must change.
3. Run the focused documentation checks.
4. Build the complete production site before opening a pull request.

```bash
npm run docs:check
npm run public:check
npm run build
```

For writing conventions, review expectations, and the pull-request workflow, see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Quality checks

| Command | What it verifies |
| --- | --- |
| `npm run dev` | Starts the local documentation server with live reload |
| `npm run docs:check` | Checks the visible V2 route tree, internal links, anchors, JSON examples, and OpenAPI snapshot |
| `npm run public:check` | Scans tracked public-repository content for unsafe or private material |
| `npm run api:check` | Verifies that the checked-in OpenAPI snapshot matches the configured BrainAPI source |
| `npm run api:generate` | Regenerates reference MDX from the checked-in OpenAPI snapshot |
| `npm run build` | Produces and validates the complete production site |
| `npm start` | Serves a completed production build |

Run `npm run docs:check` while writing and `npm run build` before submitting a change. The build generates more than the browser-facing pages, so a successful development preview alone is not sufficient validation.

## Repository map

| Path | Contents |
| --- | --- |
| [`content/v2`](content/v2) | Current task-first guides, concepts, and reference pages |
| [`content/v1`](content/v1) | Legacy V1 documentation |
| [`schemas`](schemas) | Reviewable OpenAPI snapshots used by the generated reference |
| [`scripts`](scripts) | Route, link, publication, and schema validation tools |
| [`src/app`](src/app) | HTML, Markdown, search, LLM, sitemap, and MCP routes |
| [`src/lib`](src/lib) | Shared source loading and publication policy |
| [`public`](public) | Images and other public static assets |
| [`.github`](.github) | CI, dependency updates, and contribution templates |
| [`deploy`](deploy) | Deployment-policy handoff files |

The V2 sidebar uses route-neutral Fumadocs groups. Moving a page between those groups can improve navigation without changing its public URL. Before renaming a file or directory that contributes to a URL, check inbound links and preserve established routes with a redirect where necessary.

## Synchronize the API reference

The V2 API reference is generated from a checked-in OpenAPI 3.1 snapshot. By default, synchronization expects `brainapi2` to be a sibling of this repository. Override the source and Python interpreter when your checkout uses a different layout:

```bash
BRAINAPI_SOURCE=/path/to/brainapi2 \
BRAINAPI_PYTHON=/path/to/brainapi2/.venv/bin/python \
npm run api:check
```

When an intentional BrainAPI contract change makes the check fail, synchronize and regenerate the reference:

```bash
BRAINAPI_SOURCE=/path/to/brainapi2 \
BRAINAPI_PYTHON=/path/to/brainapi2/.venv/bin/python \
npm run api:sync

npm run api:generate
npm run docs:check
npm run build
```

Review the schema and generated MDX changes together. Generated pages should describe only shipped core operations; dynamic plugin APIs remain documented on their plugin pages.

## Machine-readable documentation

The production site exposes the same published content through several interfaces:

- `/docs/llms.txt` — documentation index for language models;
- `/docs/llms/v2.txt` — V2-only index;
- `/docs/llms-full.txt` — consolidated published documentation;
- a `.md` mirror for each published page;
- `/docs/api/search` — documentation search;
- `/docs/mcp` — Docs MCP transport;
- `/docs/sitemap.xml` — canonical published HTML routes.

All of these interfaces must use the publication policy in `src/lib/source.ts`. If a page is hidden or published, verify every surface rather than updating only the sidebar.

## Deployment and security

Pull requests run validation without production deployment secrets. Deployment is restricted to the `main` branch or a manual workflow dispatch and uses the protected `production` environment.

Do not commit credentials, personal deployment configuration, populated `.env` files, private screenshots, or generated build output. If you discover a vulnerability or accidentally exposed secret, follow [`SECURITY.md`](SECURITY.md) and use GitHub private vulnerability reporting instead of opening a public issue.

## License

Copyright © Lumen Labs contributors.

Licensed under the [Apache License 2.0](LICENSE). Product names and third-party trademarks remain the property of their respective owners; see [`NOTICE`](NOTICE).
