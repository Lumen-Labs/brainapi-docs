import { createHash } from "node:crypto";
import schema from "../../../schemas/brainapi-v2.openapi.json";

export const runtime = "nodejs";
export const revalidate = false;

const body = `${JSON.stringify(schema, null, 2)}\n`;
const etag = `"${createHash("sha256").update(body).digest("hex")}"`;

export function GET(request: Request) {
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag },
    });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
