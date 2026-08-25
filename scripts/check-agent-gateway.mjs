import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import gateway, { isAllowedApiRoute } from "../deploy/cloudflare-agent-gateway.mjs";

const schema = JSON.parse(await readFile(new URL("../schemas/brainapi-v2.openapi.json", import.meta.url), "utf8"));
const methods = new Set(["get", "put", "post", "delete", "patch", "head", "options", "trace"]);

function examplePath(template) {
  return template.replaceAll(/\{[^}]+\}/g, "example-id");
}

for (const [path, item] of Object.entries(schema.paths)) {
  for (const method of Object.keys(item).filter((key) => methods.has(key))) {
    assert.equal(
      isAllowedApiRoute(method.toUpperCase(), examplePath(path)),
      true,
      `Gateway blocks documented operation ${method.toUpperCase()} ${path}`,
    );
  }
}

for (const [method, path] of [
  ["POST", "/demo/search"],
  ["POST", "/demo/ingest"],
  ["DELETE", "/system/brains/example-id/delete"],
  ["POST", "/system/brains/example-id/reset"],
  ["GET", "/not-documented"],
]) {
  assert.equal(isAllowedApiRoute(method, path), false, `Gateway unexpectedly allows ${method} ${path}`);
}

const originalFetch = globalThis.fetch;
const upstreamCalls = [];
globalThis.fetch = async (request) => {
  upstreamCalls.push({
    url: request.url,
    method: request.method,
    brainpat: request.headers.get("BrainPAT"),
    body: request.method === "GET" || request.method === "HEAD" ? null : await request.text(),
  });
  return Response.json({ proxied: true }, { headers: { "Cache-Control": "public, max-age=300" } });
};

try {
  const env = { DEMO_RATE_LIMITER: { limit: async () => ({ success: true }) } };
  const health = await gateway.fetch(new Request("https://brain-api.dev/api/health?probe=1", {
    headers: { BrainPAT: "preserved-token" },
  }), env);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(upstreamCalls.at(-1), {
    url: "https://api.brain-api.dev/health?probe=1",
    method: "GET",
    brainpat: "preserved-token",
    body: null,
  });

  const methodDenied = await gateway.fetch(new Request("https://brain-api.dev/api/demo/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"query":"write"}',
  }), env);
  assert.equal(methodDenied.status, 405);
  assert.equal((await methodDenied.json()).error.code, "METHOD_NOT_ALLOWED");

  const rateLimited = await gateway.fetch(
    new Request("https://brain-api.dev/api/demo/search?query=memory"),
    { DEMO_RATE_LIMITER: { limit: async () => ({ success: false }) } },
  );
  assert.equal(rateLimited.status, 429);
  assert.equal(rateLimited.headers.get("Retry-After"), "60");
  assert.equal((await rateLimited.json()).error.code, "RATE_LIMITED");

  const mcp = await gateway.fetch(new Request("https://brain-api.dev/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"jsonrpc":"2.0"}',
  }), env);
  assert.equal(mcp.headers.get("Cache-Control"), "no-store");
  assert.equal(upstreamCalls.at(-1).url, "https://brainapi.lumen-labs.ai/docs/mcp");
  assert.equal(upstreamCalls.at(-1).body, '{"jsonrpc":"2.0"}');

  const developers = await gateway.fetch(new Request("https://brain-api.dev/developers?source=agent"), env);
  assert.equal(developers.status, 308);
  assert.equal(developers.headers.get("Location"), "https://brainapi.lumen-labs.ai/docs/v2/developers?source=agent");
} finally {
  globalThis.fetch = originalFetch;
}

console.log(`Validated Cloudflare allowlist parity for ${Object.keys(schema.paths).length} OpenAPI paths, proxy semantics, rate limiting, and public mutation denial.`);
