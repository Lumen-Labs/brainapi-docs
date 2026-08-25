const DOCS_ORIGIN = "https://brainapi.lumen-labs.ai/docs";
const API_ORIGIN = "https://api.brain-api.dev";

const API_ROUTES = [
  ["GET", /^\/health$/],
  ["GET", /^\/demo\/search$/],
  ["POST", /^\/ingest\/$/],
  ["POST", /^\/ingest\/(file|structured)$/],
  ["GET", /^\/meta\/(entity-labels|entity-properties|login-info|relationships-properties)$/],
  ["POST", /^\/model\/(entity|relationship)$/],
  ["PUT", /^\/model\/(entity|relationship)$/],
  ["GET", /^\/retrieve\/$/],
  ["GET", /^\/retrieve\/changelogs(\/types|\/[^/]+)?$/],
  ["POST", /^\/retrieve\/context$/],
  ["GET", /^\/retrieve\/entities$/],
  ["GET", /^\/retrieve\/entities\/neighbors$/],
  ["POST", /^\/retrieve\/entities\/neighbors$/],
  ["POST", /^\/retrieve\/entities\/neighbors\/ai-mode$/],
  ["GET", /^\/retrieve\/entity\/(context|info|status|synergies)$/],
  ["GET", /^\/retrieve\/(hops|relationships)$/],
  ["GET", /^\/retrieve\/observations(\/labels|\/[^/]+)?$/],
  ["GET", /^\/retrieve\/recommend$/],
  ["POST", /^\/retrieve\/recommend$/],
  ["GET", /^\/retrieve\/search$/],
  ["POST", /^\/retrieve\/search$/],
  ["GET", /^\/retrieve\/structured-data(\/types|\/[^/]+)?$/],
  ["GET", /^\/retrieve\/text-chunks$/],
  ["GET", /^\/retrieve\/vectors\/(stores|[^/]+)$/],
  ["POST", /^\/system\/brains$/],
  ["GET", /^\/system\/brains-list$/],
  ["GET", /^\/tasks\/$/],
  ["GET", /^\/tasks\/[^/]+$/],
];

export function isAllowedApiRoute(method, pathname) {
  if (method === "OPTIONS") return API_ROUTES.some(([, pattern]) => pattern.test(pathname));
  return API_ROUTES.some(([allowedMethod, pattern]) => allowedMethod === method && pattern.test(pathname));
}

function requestId(request) {
  return request.headers.get("X-Request-ID") || request.headers.get("cf-ray") || crypto.randomUUID();
}

function jsonError(request, status, code, message, resolution, detail = message) {
  const id = requestId(request);
  return Response.json(
    { detail, error: { code, message, resolution, request_id: id } },
    {
      status,
      headers: {
        "X-Request-ID": id,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-Request-ID, Retry-After",
        "X-Content-Type-Options": "nosniff",
        ...(status === 429 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}

function upstreamRequest(request, target) {
  return new Request(target, request);
}

async function proxy(request, target, cacheable) {
  let response;
  try {
    response = await fetch(upstreamRequest(request, target), {
      cf: cacheable ? { cacheEverything: true, cacheTtl: 300 } : { cacheTtl: 0 },
    });
  } catch {
    return jsonError(
      request,
      503,
      "SERVICE_UNAVAILABLE",
      "A required service is temporarily unavailable.",
      "Retry with bounded exponential backoff after the dependency recovers.",
    );
  }

  const headers = new Headers(response.headers);
  if (!cacheable) headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handleApi(request, env, url) {
  const upstreamPath = url.pathname.slice("/api".length) || "/";
  const isDemo = upstreamPath === "/demo/search";

  if (isDemo && request.method !== "GET" && request.method !== "OPTIONS") {
    return jsonError(
      request,
      405,
      "METHOD_NOT_ALLOWED",
      "The HTTP method is not allowed for this resource.",
      "Use GET for the read-only public demo.",
    );
  }
  if (!isAllowedApiRoute(request.method, upstreamPath)) {
    return jsonError(
      request,
      404,
      "RESOURCE_NOT_FOUND",
      "The requested API route was not found.",
      "Use an operation published in the BrainAPI OpenAPI specification.",
    );
  }

  if (isDemo && request.method === "GET") {
    const key = request.headers.get("CF-Connecting-IP") || "unknown-client";
    const result = await env.DEMO_RATE_LIMITER.limit({ key });
    if (!result.success) {
      return jsonError(
        request,
        429,
        "RATE_LIMITED",
        "The public demo rate limit was exceeded.",
        "Wait 60 seconds before retrying and use bounded exponential backoff.",
      );
    }
  }

  const target = new URL(`${API_ORIGIN}${upstreamPath}`);
  target.search = url.search;
  return proxy(request, target, false);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (url.pathname === "/developers" || url.pathname === "/developers/") {
      return Response.redirect(`${DOCS_ORIGIN}/v2/developers${url.search}`, 308);
    }
    if (url.pathname === "/llms.txt") return proxy(request, `${DOCS_ORIGIN}/llms.txt`, true);
    if (url.pathname === "/openapi.json") return proxy(request, `${DOCS_ORIGIN}/openapi.json`, true);
    if (url.pathname === "/.well-known/mcp.json") {
      return proxy(request, `${DOCS_ORIGIN}/.well-known/mcp.json`, true);
    }
    if (url.pathname === "/mcp") return proxy(request, `${DOCS_ORIGIN}/mcp${url.search}`, false);

    return jsonError(
      request,
      404,
      "RESOURCE_NOT_FOUND",
      "The requested gateway route was not found.",
      "Use /developers, /llms.txt, /openapi.json, /mcp, or a documented /api route.",
    );
  },
};
