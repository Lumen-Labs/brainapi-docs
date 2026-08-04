import { DOCS_BASE } from "@/lib/site";

export const revalidate = false;

const skill = `---
name: brainapi-docs
description: Use BrainAPI public documentation and the docs MCP to integrate correctly.
license: PolyForm-Small-Business
compatibility: BrainAPI >= 2.13
metadata:
  docs: ${DOCS_BASE}/llms.txt
  mcp: ${DOCS_BASE}/mcp
allowed-tools: search_docs get_page list_sections get_code_example
---

# BrainAPI docs skill

1. Prefer **V2** docs unless the user is on a V1 deployment.
2. Discover pages via \`${DOCS_BASE}/llms.txt\` or MCP \`search_docs\` / \`list_sections\`.
3. Fetch markdown with MCP \`get_page\` or by appending \`.md\` to a docs URL.
4. Ingest APIs return **202** + \`task_id\`. Poll \`GET /tasks/{id}\`. **404** means the task is unknown — not still pending.
5. Structured ingest uses event-centric \`IngestionTripleSet\` (not the old \`json_data\` element schema).
6. Authenticate API calls with \`BrainPAT\` (and brain scoping headers as configured).
7. Product MCP (graph tools) is separate from this **docs** MCP — see ${DOCS_BASE}/v2/agentic/MCP and ${DOCS_BASE}/v2/agentic/docs-mcp.
`;

export function GET() {
  return new Response(skill, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
