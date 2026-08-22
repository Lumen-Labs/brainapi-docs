import { getLLMText } from "@/lib/get-llm-text";
import {
  generatePublishedV2Params,
  getPublishedV2Page,
} from "@/lib/source";
import { notFound } from "next/navigation";
import { absoluteDocsUrl } from "@/lib/site";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const page = getPublishedV2Page(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      Link: `<${absoluteDocsUrl(page.url)}>; rel="canonical"`,
    },
  });
}

export function generateStaticParams() {
  return generatePublishedV2Params();
}
