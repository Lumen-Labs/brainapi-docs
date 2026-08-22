import { getPublishedV2Pages, source } from "@/lib/source";
import { absoluteDocsUrl, DOCS_BASE } from "@/lib/site";
import { pageIndexLineClean } from "@/lib/get-llm-text";

export function buildRootLlmsTxt(): string {
  return `# BrainAPI Documentation

> Memory and knowledge-graph API for agents and apps. Prefer **V2** for new work.

Machine surfaces:
- Index (this file): ${DOCS_BASE}/llms.txt
- V2 page list: ${DOCS_BASE}/llms/v2.txt
- V1 page list: ${DOCS_BASE}/llms/v1.txt
- Full V2 markdown feed: ${DOCS_BASE}/llms-full.txt
- Docs MCP: ${DOCS_BASE}/mcp
- Search API: ${DOCS_BASE}/api/search?query=
- Per-page markdown: append \`.md\` to any docs URL under ${DOCS_BASE}

## Task-shaped entry points

- [Choose a path](${absoluteDocsUrl("/v2/use-cases")}): Start as an app developer, operator, or extension author
- [Quickstart](${absoluteDocsUrl("/v2/quickstart")}): Install, select a brain, ingest text, poll the task, and retrieve it
- [Authentication and brains](${absoluteDocsUrl("/v2/brains-and-auth")}): BrainPAT, system PAT, and brain-resolution precedence
- [Ingest text](${absoluteDocsUrl("/v2/ingestion/text")}): POST /ingest/ → 202 + task_id
- [Choose an ingestion path](${absoluteDocsUrl("/v2/ingestion")}): Text, file, structured, deterministic, hybrid, or enrich
- [Poll tasks](${absoluteDocsUrl("/v2/ingestion/tasks")}): GET /tasks/{id}; 404 ≠ pending
- [Choose a retrieval surface](${absoluteDocsUrl("/v2/retrieval")}): Context, Search, Recommendations, graph APIs, or MCP
- [API reference](${absoluteDocsUrl("/v2/reference")}): Grouped current core HTTP operations
- [Troubleshoot BrainAPI](${absoluteDocsUrl("/v2/troubleshooting")}): Startup, auth, databases, tasks, Search, plugins, and MCP
- [Docs MCP](${absoluteDocsUrl("/v2/agentic/docs-mcp")}): search_docs / get_page for coding agents

## Area indexes

- [V2 docs](${DOCS_BASE}/llms/v2.txt): Current BrainAPI v2 documentation
- [V1 docs](${DOCS_BASE}/llms/v1.txt): Legacy BrainAPI v1 documentation
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
