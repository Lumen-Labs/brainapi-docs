import { sourceV2 } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";
import { DOCS_BASE } from "@/lib/site";

export const revalidate = false;

export async function GET() {
  const pages = sourceV2
    .getPages()
    .slice()
    .sort((a, b) => a.url.localeCompare(b.url));
  const scanned = await Promise.all(pages.map(getLLMText));
  const header = `# BrainAPI V2 — full markdown feed\n\n> Index: ${DOCS_BASE}/llms.txt\n\n`;
  return new Response(`${header}${scanned.join("\n\n---\n\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
