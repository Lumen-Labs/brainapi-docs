import { getPublishedV2Pages, source } from "@/lib/source";
import { DOCS_BASE, markdownDocsUrl } from "@/lib/site";
import { pageIndexLineClean } from "@/lib/get-llm-text";

export function buildRootLlmsTxt(): string {
  return `# BrainAPI

> Memory and knowledge-graph infrastructure for applications and agents, with typed REST and MCP interfaces. Prefer V2 for new work.

**When to use BrainAPI:** Use it when an application or agent needs durable, brain-scoped memory; asynchronous ingestion of text, files, or structured events; hybrid passage search; graph context; entity relationships; or recommendations grounded in stored knowledge.

**When not to use BrainAPI:** Do not use it as a general web search engine, a transactional system of record, or a replacement for short-lived prompt context. The anonymous sandbox contains public BrainAPI documentation only and cannot ingest or mutate data.

**Preferred call pattern:** For REST, inspect the OpenAPI document, call the anonymous demo for evaluation, then use BrainPAT or Bearer authentication and an X-Brain-ID header for customer data. For agent-native graph work, use the Product MCP. For documentation lookup, use the unauthenticated Docs MCP.

**Tasks and recovery:** Ingest operations return HTTP 202 with a task_id; poll the task endpoint until a terminal state. Treat non-2xx responses as JSON and use error.code, error.resolution, and X-Request-ID to recover. The public demo is limited to 30 requests per minute per client, queries up to 500 characters, and at most 10 results.

## Start here

- [BrainAPI Developer Portal](https://brain-api.dev/developers): Authentication, sandbox, quickstarts, API contracts, MCP, CLI, and support
- [BrainAPI API documentation](${markdownDocsUrl("/v2/reference")}): Authored guidance and generated operation reference
- [BrainAPI OpenAPI 3.1 specification](https://brain-api.dev/openapi.json): Machine-readable REST contract for tools and function calling
- [BrainAPI authentication documentation](${markdownDocsUrl("/v2/brains-and-auth")}): BrainPAT, Bearer authentication, and brain selection
- [BrainAPI CLI](${markdownDocsUrl("/v2/tui")}): Install the official brainapi-tui npm package and brainapi binary

## Task-shaped entry points

- [Choose a path](${markdownDocsUrl("/v2/use-cases")}): Start as an app developer, operator, or extension author
- [Quickstart](${markdownDocsUrl("/v2/quickstart")}): Install, select a brain, ingest text, poll the task, and retrieve it
- [Ingest text](${markdownDocsUrl("/v2/ingestion/text")}): POST /ingest/ → 202 + task_id
- [Choose an ingestion path](${markdownDocsUrl("/v2/ingestion")}): Text, file, structured, deterministic, hybrid, or enrich
- [Poll tasks](${markdownDocsUrl("/v2/ingestion/tasks")}): GET /tasks/{id}; 404 ≠ pending
- [Choose a retrieval surface](${markdownDocsUrl("/v2/retrieval")}): Context, Search, Recommendations, graph APIs, or MCP
- [Troubleshoot BrainAPI](${markdownDocsUrl("/v2/troubleshooting")}): Startup, auth, databases, tasks, Search, plugins, and MCP

## Agent interfaces

- [Anonymous Search sandbox](https://brain-api.dev/api/demo/search?query=How%20does%20BrainAPI%20ingest%20text%3F&k=5): Read-only BM25 search over public V2 documentation
- [Product MCP](${markdownDocsUrl("/v2/agentic/MCP")}): Authenticated tools for working with BrainAPI knowledge graphs
- [Docs MCP](https://brain-api.dev/mcp): Unauthenticated Streamable HTTP MCP for searching and reading documentation
- [Docs MCP discovery](https://brain-api.dev/.well-known/mcp.json): Machine-readable Docs MCP endpoint metadata
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
