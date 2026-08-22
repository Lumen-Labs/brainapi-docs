import { promises as fs } from "fs";
import type { InferPageType } from "fumadocs-core/source";
import { absoluteDocsUrl, DOCS_BASE, markdownDocsUrl } from "@/lib/site";
import type { source, sourceV2 } from "@/lib/source";

type AnyPage =
  | InferPageType<typeof source>
  | InferPageType<typeof sourceV2>;

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw;
  return raw.slice(end + 4).replace(/^\s+/, "");
}

function absolutizeMarkdownLinks(body: string): string {
  return body.replace(
    /\]\((\/(?:v1|v2)[^)#\s]*)(#[^)]*)?\)/g,
    (_m, path: string, hash: string = "") =>
      `](${absoluteDocsUrl(path)}${hash})`,
  );
}

async function readPageSource(page: AnyPage): Promise<string> {
  const absolutePath =
    "absolutePath" in page ? page.absolutePath : undefined;
  if (absolutePath) {
    return fs.readFile(absolutePath, "utf8");
  }
  const path = page.path;
  const roots = ["content/v2", "content/v1"];
  for (const root of roots) {
    try {
      return await fs.readFile(`${root}/${path}`, "utf8");
    } catch {
      /* try next */
    }
  }
  throw new Error(`Cannot read source for ${page.url}`);
}

export async function getLLMText(page: AnyPage): Promise<string> {
  const raw = await readPageSource(page);
  const body = absolutizeMarkdownLinks(stripFrontmatter(raw));
  const title = page.data.title ?? page.url;
  const description =
    "description" in page.data && page.data.description
      ? String(page.data.description)
      : "";

  return [
    `# ${title} (${absoluteDocsUrl(page.url)})`,
    "",
    `> For the complete BrainAPI documentation index, see [llms.txt](${DOCS_BASE}/llms.txt). A markdown version of any docs page is available by appending \`.md\` to its URL (e.g. ${markdownDocsUrl(page.url)}).`,
    "",
    description ? `${description}\n` : "",
    body.trim(),
    "",
  ].join("\n");
}

export function pageIndexLineClean(page: AnyPage): string {
  const title = page.data.title ?? page.url;
  const desc =
    "description" in page.data && page.data.description
      ? String(page.data.description)
      : "";
  const suffix = desc ? `: ${desc}` : "";
  return `- [${title}](${absoluteDocsUrl(page.url)})${suffix}`;
}
