import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "content", "v2");
const hidden = [
  "/v2/benchmarks",
  "/v2/ingestion/backups",
  "/v2/retrieval/export-backups",
  "/v2/agentic/streaming-client",
];
const redirects = new Set([
  "/v2/retrieval/search-theory",
  "/v2/retrieval/search-plugins",
  "/v2/retrieval/catalog-search",
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return nested.flat();
}

function pageRoute(file) {
  const relative = path.relative(contentRoot, file).split(path.sep)
    .filter((segment) => !/^\(.+\)$/.test(segment));
  const last = relative.pop().replace(/\.mdx$/, "");
  if (last !== "index") relative.push(last);
  return `/v2${relative.length ? `/${relative.join("/")}` : ""}`;
}

function isPublished(route) {
  return !hidden.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

function headingSlug(heading) {
  return heading.toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

const mdxFiles = (await walk(contentRoot)).filter((file) => file.endsWith(".mdx"));
const routeFiles = new Map();
const sources = new Map();
const errors = [];
const navigationRoutes = new Map();

for (const file of mdxFiles) {
  const route = pageRoute(file);
  if (!isPublished(route)) continue;
  if (routeFiles.has(route)) errors.push(`Duplicate route ${route}: ${routeFiles.get(route)} and ${file}`);
  routeFiles.set(route, file);
  sources.set(route, await readFile(file, "utf8"));
}

const validRoutes = new Set([...routeFiles.keys(), ...redirects]);
const markdownLink = /\]\((\/v2[^)\s]*)\)|href=["'](\/v2[^"']*)["']/g;

async function inspectNavigation(directory) {
  const metaPath = path.join(directory, "meta.json");
  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, "utf8"));
  } catch (error) {
    errors.push(`Navigation group is missing or invalid: ${metaPath} (${error.message})`);
    return;
  }

  for (const item of meta.pages ?? []) {
    const linked = typeof item === "string" ? item.match(/^\[[^\]]+\]\((\/v2[^)]*)\)$/) : null;
    if (linked) {
      const route = linked[1].replace(/\/$/, "") || "/v2";
      if (!routeFiles.has(route)) errors.push(`${metaPath}: navigation points to unpublished or missing route ${route}`);
      if (navigationRoutes.has(route)) errors.push(`Duplicate navigation route ${route}: ${navigationRoutes.get(route)} and ${metaPath}`);
      navigationRoutes.set(route, metaPath);
      continue;
    }
    if (typeof item === "string" && item !== "---" && item !== "..." && !item.startsWith("!")) {
      await inspectNavigation(path.join(directory, item));
    }
  }
}

await inspectNavigation(contentRoot);

for (const route of routeFiles.keys()) {
  if (!navigationRoutes.has(route)) errors.push(`Published route is not reachable from V2 navigation: ${route}`);
}

for (const [sourceRoute, body] of sources) {
  for (const match of body.matchAll(markdownLink)) {
    const raw = match[1] ?? match[2];
    const [target, fragment] = raw.split("#", 2);
    const cleanTarget = target.replace(/[?].*$/, "").replace(/\/$/, "") || "/v2";
    if (!validRoutes.has(cleanTarget)) {
      errors.push(`${sourceRoute}: broken internal link ${raw}`);
      continue;
    }
    if (!fragment || !sources.has(cleanTarget)) continue;
    const targetBody = sources.get(cleanTarget);
    const headings = new Set([...targetBody.matchAll(/^#{1,6}\s+(.+)$/gm)].map((item) => headingSlug(item[1])));
    if (!headings.has(decodeURIComponent(fragment))) {
      errors.push(`${sourceRoute}: missing anchor ${raw}`);
    }
  }

  for (const fence of body.matchAll(/```json\s*\n([\s\S]*?)```/g)) {
    try {
      JSON.parse(fence[1]);
    } catch (error) {
      errors.push(`${sourceRoute}: invalid JSON fence (${error.message})`);
    }
  }
}

JSON.parse(await readFile(path.join(root, "schemas", "brainapi-v2.openapi.json"), "utf8"));

if (errors.length) {
  console.error(`Documentation validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${routeFiles.size} published V2 routes, the complete navigation tree, internal links, JSON fences, and the OpenAPI snapshot.`);
