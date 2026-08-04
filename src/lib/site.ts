export const DOCS_ORIGIN =
  process.env.NEXT_PUBLIC_DOCS_ORIGIN ?? "https://brainapi.lumen-labs.ai";

/** Public docs base including Next basePath */
export const DOCS_BASE = `${DOCS_ORIGIN}/docs`;

export function absoluteDocsUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${DOCS_BASE}${normalized}`;
}

export function markdownDocsUrl(path: string): string {
  const base = absoluteDocsUrl(path);
  if (base.endsWith(".md")) return base;
  if (base.endsWith("/")) return `${base}index.md`;
  return `${base}.md`;
}
