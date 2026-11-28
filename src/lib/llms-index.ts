import { getPublishedV2Pages, source } from "@/lib/source";
import { DOCS_BASE, markdownDocsUrl } from "@/lib/site";
import { pageIndexLineClean } from "@/lib/get-llm-text";

export function buildRootLlmsTxt(): string {
  return `# BrainAPI

> Memory and knowledge-graph infrastructure for applications and agents, with typed REST and MCP interfaces. Prefer V2 for new work.

**When to use BrainAPI:** Use it when an application or agent needs durable, brain-scoped memory; asynchronous ingestion of text, files, or structured events; hybrid passage search; graph context; entity relationships; or recommendations grounded in stored knowledge.

**When not to use BrainAPI:** Do not use it as a general web search engine, a transactional system of record, or a replacement for short-lived prompt context.

**Preferred call pattern:** For REST, follow the Quickstart, inspect the OpenAPI document, then use BrainPAT or Bearer authentication and an X-Brain-ID header for customer data. For agent-native graph work, use the Product MCP. For documentation lookup, use the unauthenticated Docs MCP.

**Tasks and recovery:** Ingest operations return HTTP 202 with a task_id; poll the task endpoint until a terminal state. Treat non-2xx responses as JSON and use error.code, error.resolution, and X-Request-ID to recover.

## Start here

- [Quickstart](${markdownDocsUrl("/v2/quickstart")}): Install, select a brain, ingest text, poll the task, and retrieve it
- [BrainAPI Developer Portal](${markdownDocsUrl("/v2/developers")}): Authentication, quickstarts, API contracts, MCP, CLI, pricing (Ask $29, Build $99, Team $299, Studio $899; overage $0.000003/char), and support
- [BrainAPI API documentation](${markdownDocsUrl("/v2/reference")}): Authored guidance and generated operation reference
- [BrainAPI OpenAPI 3.1 specification](${DOCS_BASE}/openapi.json): Machine-readable REST contract for tools and function calling
- [Regional API hosts](${markdownDocsUrl("/v2/reference/regional-hosts")}): Managed REST at https://system.us-east1.brainapi.lumen-labs.ai and https://system.europe-central2.brainapi.lumen-labs.ai. Public hosts may lag 2.21.0.
- [BrainAPI authentication documentation](${markdownDocsUrl("/v2/brains-and-auth")}): BrainPAT, Bearer authentication, and brain selection
- [BrainAPI CLI](${markdownDocsUrl("/v2/tui")}): Install the official brainapi-tui npm package and brainapi binary

## Task-shaped entry points

- [Choose a path](${markdownDocsUrl("/v2/use-cases")}): Start as an app developer, operator, or extension author
- [Quickstart](${markdownDocsUrl("/v2/quickstart")}): Install, select a brain, ingest text, poll the task, and retrieve it
- [Ingest text](${markdownDocsUrl("/v2/ingestion/text")}): POST /ingest/ → 202 + task_id
- [Choose an ingestion path](${markdownDocsUrl("/v2/ingestion")}): Text, file, structured, deterministic, hybrid, or enrich
- [Poll tasks](${markdownDocsUrl("/v2/ingestion/tasks")}): GET /tasks/{id}; cancel supported runs with POST /tasks/{id}/cancel
- [Choose a retrieval surface](${markdownDocsUrl("/v2/retrieval")}): Context, Search, Recommendations, graph APIs, or MCP
- [Fact verification](${markdownDocsUrl("/v2/retrieval/verification")}): Verify or reject facts; verification scope is not default
- [Conflicts](${markdownDocsUrl("/v2/retrieval/conflicts")}): Scan and resolve cross-source contradictions
- [As-of retrieve](${markdownDocsUrl("/v2/retrieval/as-of")}): Fail-closed valid-time reads and changelog windows
- [Install BrainAPI](${markdownDocsUrl("/v2/installation")}): TUI, source checkout, or light/heavy Compose self-host (BUSL-1.1 non-production use, upgrade, backup)
- [Self-host the dashboard](${markdownDocsUrl("/v2/self-host-dashboard")}): Join brainapi_appnet, point at http://brainapi:8000, and share USAGE_CONTEXT_SECRET
- [Troubleshoot BrainAPI](${markdownDocsUrl("/v2/troubleshooting")}): Startup, auth, databases, tasks, Search, plugins, and MCP

## Agent interfaces

- [Product MCP](${markdownDocsUrl("/v2/agentic/MCP")}): Authenticated tools for working with BrainAPI knowledge graphs
- [Docs MCP](${DOCS_BASE}/mcp): Unauthenticated Streamable HTTP MCP for searching and reading documentation
- [Docs MCP discovery](${DOCS_BASE}/.well-known/mcp.json): Machine-readable Docs MCP endpoint metadata
- [Structured error handling](${markdownDocsUrl("/v2/developers")}#error-handling): Stable error codes, resolution hints, and request IDs

## Area indexes

- [This agent index](https://brain-api.dev/llms.txt): Product-level discovery and usage guidance
- [V2 docs](${DOCS_BASE}/llms/v2.txt): Current BrainAPI v2 documentation
- [V1 docs](${DOCS_BASE}/llms/v1.txt): Legacy BrainAPI v1 documentation
- [Full V2 markdown feed](${DOCS_BASE}/llms-full.txt): Consolidated public documentation for indexing
`;
}

export function buildVersionLlmsTxt(
  version: "v1" | "v2",
): string {
  const pages =
    version === "v2" ? getPublishedV2Pages() : source.getPages();
  const lines = pages
    .slice()
    .sort((a, b) => a.url.localeCompare(b.url))
    .map(pageIndexLineClean);

  return `# BrainAPI ${version.toUpperCase()} Documentation

> Full index: ${DOCS_BASE}/llms.txt · Markdown: append .md to any URL below

${lines.join("\n")}
`;
}
