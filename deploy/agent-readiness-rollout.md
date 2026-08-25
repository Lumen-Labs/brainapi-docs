# BrainAPI agent-readiness rollout

The repositories now contain the runtime, documentation, public route, and
gateway artifacts. The following operations require account credentials and
must be applied in this dependency order.

## 1. Deploy the API sandbox

1. Build and publish the current `brainapi2` image.
2. Deploy `deploy/docker-compose.light.yaml` at `api.brain-api.dev` using the
   public-demo overrides from `brainapi2/deploy/env.public-demo.example`.
3. Keep `BRAINPAT_TOKEN` private and do not create any anonymous write token.
4. Run `python scripts/seed_public_demo.py --api-url http://localhost:8000`
   inside the API container.
5. Confirm `/health` and `/demo/search` locally before changing DNS.

## 2. Deploy the documentation

Deploy the current Next application. Confirm these docs-host routes before the
root gateway is activated:

- `/docs/openapi.json`
- `/docs/llms.txt`
- `/docs/v2/developers`
- `/docs/mcp`
- `/docs/.well-known/mcp.json`

## 3. Activate Cloudflare routing

Copy `wrangler.agent-readiness.jsonc.example` to the deployment configuration,
replace the rate-limit namespace with an unused positive integer in the
Cloudflare account, and deploy `cloudflare-agent-gateway.mjs`. The checked-in
route list preserves PAT and Bearer headers, strips the root `/api` prefix,
never caches API or MCP traffic, caches only machine-readable documentation,
and rejects undocumented API paths with the standard JSON envelope.

Create the proxied DNS record for `api.brain-api.dev` before enabling the Worker
routes. Configure the origin firewall to accept traffic only from Cloudflare or
another approved ingress. The rate-limit binding is 30 calls per 60 seconds;
the Worker returns `RATE_LIMITED` JSON with `Retry-After: 60`.

## 4. Apply the Framer semantic patch

Keep the existing components, layout, breakpoints, colors, and spacing. Change
only semantic tags and linked metadata:

1. Keep one visible SSR `h1` for the primary BrainAPI proposition.
2. Use `h2` for top-level homepage sections and `h3` only inside an `h2`
   section. Convert quotation text, people names, card labels, and hidden
   responsive duplicates from `h4`–`h6` to `p`, `span`, or `div`.
3. Ensure the server response contains more than 500 visible characters without
   running JavaScript.
4. Add a visible “Developer” link to `https://brain-api.dev/developers` in the
   primary navigation and footer.
5. Add `<link rel="describedby" href="/llms.txt" type="text/plain">` to the
   homepage head so agents can discover the root instructions.
6. Merge this `contactPoint` into the existing Organization JSON-LD while
   preserving the current PostalAddress and other graph nodes:

```json
{
  "@type": "ContactPoint",
  "contactType": "customer support",
  "email": "info@lumen-labs.ai",
  "telephone": "+1-408-479-1979",
  "availableLanguage": ["English"]
}
```

Publish the Framer page, inspect its raw response, and compare desktop, tablet,
and mobile screenshots against production before the change.

## 5. Verify and re-index

Run `npm run agent:check` from the docs repository. To include authenticated
API verification, set `BRAINAPI_TEST_PAT` and `BRAINAPI_TEST_BRAIN_ID` in the
operator shell. Do not commit them.

After the live check passes, re-run the Ora audit and submit
`https://brainapi.lumen-labs.ai/docs/sitemap.xml` plus the developer portal URL
to the configured search consoles. Search-result discoverability can lag the
deployment even when every endpoint is live.
