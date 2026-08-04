import { source, sourceV2 } from "@/lib/source";
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

- [Install BrainAPI](${absoluteDocsUrl("/v2/installation")}): Local and Docker setup, DeepSeek, pipeline env
- [Ingest text](${absoluteDocsUrl("/v2/ingestion/text")}): POST /ingest/ → 202 + task_id
- [Structured triples](${absoluteDocsUrl("/v2/ingestion/structured-data")}): POST /ingest/structured event hubs
- [Poll tasks](${absoluteDocsUrl("/v2/ingestion/tasks")}): GET /tasks/{id}; 404 ≠ pending
- [Retrieve context](${absoluteDocsUrl("/v2/retrieval/context")}): Hybrid graph + passages
- [Chatbot plugin](${absoluteDocsUrl("/v2/chatbot")}): POST /chatbot/inference
- [Chatbot memory](${absoluteDocsUrl("/v2/chatbot-memory")}): Conversation isolation
- [Docs MCP](${absoluteDocsUrl("/v2/agentic/docs-mcp")}): search_docs / get_page for coding agents
- [Benchmarks](${absoluteDocsUrl("/v2/benchmarks")}): LoCoMo, LongMemEval, BEAM

## Area indexes

- [V2 docs](${DOCS_BASE}/llms/v2.txt): Current BrainAPI v2 documentation
- [V1 docs](${DOCS_BASE}/llms/v1.txt): Legacy BrainAPI v1 documentation
`;
}

export function buildVersionLlmsTxt(
  version: "v1" | "v2",
): string {
  const pages =
    version === "v2" ? sourceV2.getPages() : source.getPages();
  const lines = pages
    .slice()
    .sort((a, b) => a.url.localeCompare(b.url))
    .map(pageIndexLineClean);

  return `# BrainAPI ${version.toUpperCase()} Documentation

> Full index: ${DOCS_BASE}/llms.txt · Markdown: append .md to any URL below

${lines.join("\n")}
`;
}
