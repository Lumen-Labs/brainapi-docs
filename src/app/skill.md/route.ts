import { DOCS_BASE } from "@/lib/site";

export const revalidate = false;

const skill = `---
name: brainapi-docs
description: Use BrainAPI public documentation and the docs MCP to integrate correctly.
license: BUSL-1.1
compatibility: BrainAPI >= 2.13
metadata:
  docs: ${DOCS_BASE}/llms.txt
  mcp: ${DOCS_BASE}/mcp
allowed-tools: search_docs get_page list_sections get_code_example
---

# BrainAPI docs skill

## When to use BrainAPI

Use BrainAPI for durable, brain-scoped memory; asynchronous ingestion; passage or graph retrieval; entity relationships; recommendations; and grounded agent context. Use this docs skill when you need to choose an endpoint, construct a typed request, diagnose an error, or verify current BrainAPI behavior.

## When not to use BrainAPI

Do not use BrainAPI as general web search, as a transactional source of truth, or for context that should disappear with the current model turn. The anonymous demo searches only public BrainAPI documentation and has no mutation tools.

## Calling guidance

1. Prefer **V2** docs unless the user is on a V1 deployment.
2. Discover pages via \`${DOCS_BASE}/llms.txt\` or MCP \`search_docs\` / \`list_sections\`.
3. Fetch markdown with MCP \`get_page\` or by appending \`.md\` to a docs URL. Inspect \`https://brain-api.dev/openapi.json\` before generating REST tools.
4. Evaluate retrieval with \`GET https://brain-api.dev/api/demo/search\`; it is read-only, documentation-only, capped at 500 query characters and 10 results, and limited to 30 requests per minute per client.
5. Authenticate customer API calls with \`BrainPAT\` or Bearer auth and prefer \`X-Brain-ID\` for brain scope. Never send a customer token to the anonymous demo.
6. Ingest APIs return **202** + \`task_id\`. Poll \`GET /tasks/{id}\`. **404** means the task is unknown — not still pending.
7. On failure, read \`error.code\`, \`error.resolution\`, and \`error.request_id\`; retain \`detail\` compatibility and report the matching \`X-Request-ID\` when escalating.
8. Structured ingest uses event-centric \`IngestionTripleSet\` (not the old \`json_data\` element schema).
9. Product MCP (graph tools) is separate from this **docs** MCP — see ${DOCS_BASE}/v2/agentic/MCP and ${DOCS_BASE}/v2/agentic/docs-mcp.
`;

export function GET() {
  return new Response(skill, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
