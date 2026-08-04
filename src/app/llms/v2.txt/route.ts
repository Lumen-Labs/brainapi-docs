import { buildVersionLlmsTxt } from "@/lib/llms-index";

export const revalidate = false;

export function GET() {
  return new Response(buildVersionLlmsTxt("v2"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
