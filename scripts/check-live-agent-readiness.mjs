import assert from "node:assert/strict";

const base = (process.env.BRAINAPI_SITE_ORIGIN ?? "https://brain-api.dev").replace(/\/$/, "");
const docs = (process.env.BRAINAPI_DOCS_ORIGIN ?? "https://brainapi.lumen-labs.ai/docs").replace(/\/$/, "");
const failures = [];
const passes = [];

async function check(name, fn) {
  try {
    await fn();
    passes.push(name);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

async function get(path, init) {
  return fetch(`${base}${path}`, { redirect: "follow", ...init });
}

function operationEntries(schema) {
  const methods = new Set(["get", "put", "post", "delete", "patch", "head", "options", "trace"]);
  return Object.entries(schema.paths ?? {}).flatMap(([path, item]) =>
    Object.entries(item)
      .filter(([method]) => methods.has(method))
      .map(([method, operation]) => ({ path, method, operation })),
  );
}

function visibleText(html) {
  return html
    .replaceAll(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replaceAll(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replaceAll(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/&(?:nbsp|amp|quot|#39);/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

await check("homepage raw HTML semantics", async () => {
  const response = await get("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) => Number(match[1]));
  assert.equal(headings.filter((level) => level === 1).length, 1, "expected exactly one H1");
  for (let index = 1; index < headings.length; index += 1) {
    assert.ok(headings[index] <= headings[index - 1] + 1, `heading level skips from H${headings[index - 1]} to H${headings[index]}`);
  }
  assert.ok(visibleText(html).length > 500, "expected more than 500 visible raw-HTML characters");
});

await check("homepage organization structured data", async () => {
  const html = await (await get("/")).text();
  const documents = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => {
      try { return JSON.parse(match[1]); } catch { return null; }
    })
    .filter(Boolean);
  const nodes = documents.flatMap((document) => document["@graph"] ?? [document]);
  const types = new Set(nodes.flatMap((node) => Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]));
  for (const type of ["Organization", "WebSite", "SoftwareApplication", "FAQPage"]) assert.ok(types.has(type), `missing ${type}`);
  const organization = nodes.find((node) => node["@type"] === "Organization");
  assert.ok(organization?.address?.["@type"] === "PostalAddress", "missing PostalAddress");
  const contacts = Array.isArray(organization?.contactPoint) ? organization.contactPoint : [organization?.contactPoint];
  const support = contacts.find((contact) => contact?.contactType === "customer support");
  assert.equal(support?.email, "info@lumen-labs.ai");
  assert.equal(support?.telephone, "+1-408-479-1979");
  assert.ok(support?.availableLanguage?.includes("English"));
});

let rootSchema;
await check("OpenAPI publication and schema parity", async () => {
  const [rootResponse, docsResponse] = await Promise.all([get("/openapi.json"), fetch(`${docs}/openapi.json`)]);
  assert.equal(rootResponse.status, 200);
  assert.match(rootResponse.headers.get("content-type") ?? "", /^application\/json/);
  assert.ok(rootResponse.headers.get("etag"), "missing ETag");
  rootSchema = await rootResponse.json();
  const docsSchema = await docsResponse.json();
  assert.deepEqual(rootSchema, docsSchema);
  assert.match(rootSchema.openapi, /^3\.1\./);
  const operations = operationEntries(rootSchema);
  assert.ok(operations.length > 0);
  const ids = operations.map(({ operation }) => operation.operationId);
  assert.equal(new Set(ids).size, ids.length);
  for (const { path, method, operation } of operations) {
    assert.match(operation.operationId, /^[a-z][a-z0-9_]{0,63}$/, `${method} ${path}`);
    assert.ok(operation.description, `${method} ${path} missing description`);
  }
  const conditional = await get("/openapi.json", { headers: { "If-None-Match": rootResponse.headers.get("etag") } });
  assert.equal(conditional.status, 304);
});

await check("llms.txt v2 structure and discovery links", async () => {
  const response = await get("/llms.txt");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/plain/);
  const text = await response.text();
  const lines = text.split(/\r?\n/);
  assert.match(lines[0], /^# [^#]/);
  assert.match(lines[2], /^> /);
  assert.equal(lines.filter((line) => /^# [^#]/.test(line)).length, 1);
  assert.ok(text.indexOf("When to use BrainAPI") < text.indexOf("\n## "));
  for (const label of ["Developer Portal", "API documentation", "OpenAPI", "authentication", "CLI", "Product MCP", "Docs MCP"]) {
    assert.match(text, new RegExp(`\\[[^\\]]*${label}[^\\]]*\\]`, "i"), `missing ${label} link`);
  }
});

await check("developer portal SSR", async () => {
  const response = await get("/developers");
  assert.equal(response.status, 200);
  assert.ok(response.url.includes("/docs/v2/developers"));
  const html = await response.text();
  assert.match(html, /<title>[^<]*BrainAPI Developer Portal/i);
  assert.match(html, /<h1\b[^>]*>[^<]*BrainAPI Developer Portal/i);
});

await check("public health and JSON failure envelope", async () => {
  const health = await get("/api/health");
  assert.equal(health.status, 200);
  assert.match(health.headers.get("content-type") ?? "", /^application\/json/);
  assert.equal((await health.json()).status, "ok");
  assert.equal(health.headers.get("access-control-allow-origin"), "*");

  const requestId = `live-check-${Date.now()}`;
  const protectedResponse = await get("/api/tasks/", { headers: { "X-Request-ID": requestId } });
  assert.equal(protectedResponse.status, 401);
  const error = await protectedResponse.json();
  assert.equal(error.error.code, "AUTH_INVALID");
  assert.equal(error.error.request_id, requestId);
  assert.equal(protectedResponse.headers.get("x-request-id"), requestId);
});

await check("public demo success and mutation denial", async () => {
  const demo = await get("/api/demo/search?query=How%20does%20ingestion%20work%3F&k=3");
  assert.equal(demo.status, 200);
  const body = await demo.json();
  assert.ok(Array.isArray(body.hits));
  assert.ok(body.hits.length > 0, "seeded demo returned no hits");

  const mutation = await get("/api/demo/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"query":"x"}' });
  assert.equal(mutation.status, 405);
  assert.equal((await mutation.json()).error.code, "METHOD_NOT_ALLOWED");
});

await check("Docs MCP discovery and initialize", async () => {
  const discovery = await get("/.well-known/mcp.json");
  assert.equal(discovery.status, 200);
  const metadata = await discovery.json();
  assert.equal(metadata.transport, "streamable-http");
  assert.equal(metadata.url, `${base}/mcp`);
  assert.equal(metadata.authentication.required, false);

  const initialized = await get("/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "brainapi-live-check", version: "1.0.0" } } }),
  });
  assert.equal(initialized.status, 200);
  assert.match(initialized.headers.get("content-type") ?? "", /application\/json|text\/event-stream/);
});

await check("official CLI registry metadata", async () => {
  const response = await fetch("https://registry.npmjs.org/brainapi-tui/0.4.0");
  assert.equal(response.status, 200);
  const metadata = await response.json();
  assert.equal(metadata.version, "0.4.0");
  assert.ok(metadata.bin?.brainapi, "brainapi binary is missing");
});

if (process.env.BRAINAPI_TEST_PAT && process.env.BRAINAPI_TEST_BRAIN_ID) {
  await check("authenticated managed API", async () => {
    const response = await get("/api/tasks/", {
      headers: {
        BrainPAT: process.env.BRAINAPI_TEST_PAT,
        "X-Brain-ID": process.env.BRAINAPI_TEST_BRAIN_ID,
      },
    });
    assert.equal(response.status, 200);
  });
}

console.log(`Live agent-readiness checks: ${passes.length} passed, ${failures.length} failed.`);
for (const name of passes) console.log(`PASS ${name}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exit(1);
