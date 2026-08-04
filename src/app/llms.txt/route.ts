import { buildRootLlmsTxt } from "@/lib/llms-index";

export const revalidate = false;

export function GET() {
  return new Response(buildRootLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
