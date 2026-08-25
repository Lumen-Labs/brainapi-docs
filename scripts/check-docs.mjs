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

const schema = JSON.parse(await readFile(path.join(root, "schemas", "brainapi-v2.openapi.json"), "utf8"));
if (!String(schema.openapi).startsWith("3.1.")) errors.push(`OpenAPI version must be 3.1.x, received ${schema.openapi}`);

const expectedServers = [
  "https://brain-api.dev/api",
  "https://api.brain-api.dev",
  "http://localhost:8000",
];
if (JSON.stringify(schema.servers?.map((server) => server.url)) !== JSON.stringify(expectedServers)) {
  errors.push("OpenAPI servers must list the root gateway, direct API host, and localhost in canonical order");
}

const operationIds = new Set();
const operationMethods = new Set(["get", "put", "post", "delete", "patch", "head", "options", "trace"]);
const publicPaths = new Set(["/health", "/demo/search"]);

function isEmptySchema(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0;
}

for (const [route, pathItem] of Object.entries(schema.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!operationMethods.has(method) || !operation || typeof operation !== "object") continue;
    const label = `${method.toUpperCase()} ${route}`;
    const operationId = operation.operationId;
    if (typeof operationId !== "string" || !/^[a-z][a-z0-9_]*$/.test(operationId)) {
      errors.push(`${label}: operationId must be stable lower_snake_case`);
    } else {
      if (operationId.length > 64) errors.push(`${label}: operationId exceeds 64 characters`);
      if (operationIds.has(operationId)) errors.push(`${label}: duplicate operationId ${operationId}`);
      operationIds.add(operationId);
    }
    if (typeof operation.description !== "string" || !operation.description.trim()) {
      errors.push(`${label}: missing operation description`);
    }
    for (const parameter of operation.parameters ?? []) {
      if (!parameter.$ref && !parameter.schema && !parameter.content) {
        errors.push(`${label}: parameter ${parameter.name ?? "<unknown>"} has no schema or content`);
      }
    }
    if (operation.requestBody && !operation.requestBody.$ref && !operation.requestBody.content) {
      errors.push(`${label}: requestBody is not typed`);
    }
    const successResponses = Object.entries(operation.responses ?? {})
      .filter(([status]) => /^2\d\d$/.test(status));
    if (successResponses.length === 0) errors.push(`${label}: missing 2xx response`);
    for (const [status, response] of successResponses) {
      if (response.$ref) continue;
      const media = Object.values(response.content ?? {});
      if (media.length === 0 || media.some((entry) => !entry.schema || isEmptySchema(entry.schema))) {
        errors.push(`${label}: ${status} response has an empty or missing schema`);
      }
    }
    const expectedSecurity = publicPaths.has(route) ? [] : [{ BrainPAT: [] }, { BearerAuth: [] }];
    if (JSON.stringify(operation.security) !== JSON.stringify(expectedSecurity)) {
      errors.push(`${label}: incorrect explicit security declaration`);
    }
    for (const status of publicPaths.has(route) ? [404, 405, 422, 429, 500, 503] : [400, 401, 403, 404, 405, 406, 422, 429, 500, 503]) {
      const response = operation.responses?.[String(status)];
      if (!response) continue;
      const responseSchema = response.content?.["application/json"]?.schema;
      if (responseSchema?.$ref !== "#/components/schemas/ErrorResponse") {
        errors.push(`${label}: ${status} must reference ErrorResponse`);
      }
    }
  }
}

for (const requiredPath of publicPaths) {
  if (!schema.paths?.[requiredPath]) errors.push(`OpenAPI is missing public path ${requiredPath}`);
}
for (const hiddenPath of [
  "/system/brains/{brain_id}/reset",
  "/system/brains/{brain_id}/delete",
  "/system/brains/{brain_id}/create-backup",
]) {
  if (schema.paths?.[hiddenPath]) errors.push(`Unimplemented operation must not be published: ${hiddenPath}`);
}

const llmsSource = await readFile(path.join(root, "src", "lib", "llms-index.ts"), "utf8");
const rootBuilder = llmsSource.slice(
  llmsSource.indexOf("export function buildRootLlmsTxt"),
  llmsSource.indexOf("export function buildVersionLlmsTxt"),
);
const firstH1 = rootBuilder.indexOf("# BrainAPI");
const summary = rootBuilder.indexOf("\n> ");
const guidance = rootBuilder.indexOf("**When to use BrainAPI:**");
const firstH2 = rootBuilder.indexOf("\n## ");
if (firstH1 < 0 || summary < firstH1 || guidance < summary || firstH2 < guidance) {
  errors.push("Root llms.txt must contain one H1, a blockquote summary, non-heading usage guidance, then H2 link sections");
}
if ((rootBuilder.match(/# BrainAPI/g) ?? []).length !== 1 || /\n#{3,6}\s/.test(rootBuilder)) {
  errors.push("Root llms.txt must contain exactly one H1 and only H2 link sections after guidance");
}
for (const label of [
  "BrainAPI Developer Portal",
  "BrainAPI API documentation",
  "BrainAPI OpenAPI 3.1 specification",
  "BrainAPI authentication documentation",
  "BrainAPI CLI",
  "Product MCP",
  "Docs MCP",
]) {
  if (!rootBuilder.includes(`[${label}]`)) errors.push(`Root llms.txt is missing named link: ${label}`);
}

const mcpDiscovery = JSON.parse(
  await readFile(path.join(root, "public", ".well-known", "mcp.json"), "utf8"),
);
if (mcpDiscovery.url !== "https://brain-api.dev/mcp" || mcpDiscovery.transport !== "streamable-http") {
  errors.push("Docs MCP discovery must identify the root Streamable HTTP alias");
}
if (mcpDiscovery.authentication?.required !== false || mcpDiscovery.capabilities?.tools !== true) {
  errors.push("Docs MCP discovery must declare unauthenticated tool capability");
}

if (errors.length) {
  console.error(`Documentation validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${routeFiles.size} published V2 routes, navigation, links, JSON fences, llms.txt structure, and ${operationIds.size} OpenAPI operations.`);
