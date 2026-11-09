# PLAN-2 Public shared brain credentials and query access

## Recommendation

Add a platform-owned external query gateway for public Hub listings. Give each signed-in viewer a separate, opaque bearer credential bound to one immutable listing ID, viewer account and authorized payer team. REST and the dedicated shared MCP tool both invoke the same typed, read-only query service. The existing browser Ask route retains its session cookie and passes the same trusted settlement context after its listing and payer checks. Explore keeps its current free behavior.

Issue or rotate the credential from a single Connect control on the public listing, using the dashboard's normal session and mutation security. Show the secret once with Copy, along with the stable endpoint or copyable MCP setup. Return only masked metadata on subsequent reads and allow revocation. Use at least 32 bytes of randomness, a distinct token prefix, and a unique indexed digest. Store scope, listing ID, viewer ID, payer team, timestamps and revocation state. An atomic upsert/rotation with a unique active tuple prevents simultaneous creation of multiple active credentials. The billing team in use when the viewer connects is displayed in the control. Recheck membership, active account status, billing authority and payer deployment against that stored team on every data call. A later switch of active team does not change attribution. Switching the connection's payer explicitly requires issuance for that team.

Expose one structured REST query and one named MCP query tool for the same safe search/context functionality. Derive target and payer from server records and ignore or reject attempted overrides. Keep transport in an SDK-backed adapter. Validate the negotiated protocol, Origin as applicable, body limits and the bearer on each request. Use the deployed SDK's supported protocol negotiation and confirm that named clients can send a static bearer header. Clients that only support interactive authorization require a separately scoped OAuth design. MCP discovery, tools/list, failed tool calls and empty transport operations never create settlements. Count only the canonical settled retrieval event even if the model generates additional MCP traffic. See [the official July 2026 MCP protocol changes](https://blog.modelcontextprotocol.io/posts/2026-07-28/) and [Python SDK authorization](https://py.sdk.modelcontextprotocol.io/run/authorization/).

For each call, first authenticate the credential, load the listing by its stable ID, check public visibility and serving status, validate viewer and payer, consume Hub query limits, then use the existing read-only client to call the brain. The credential is audience-bound to the shared gateway. Treat it as invalid on all direct Brain API/MCP, dashboard and owner endpoints. Keep upstream BrainPAT and authorization headers server-side, reject ambiguous auth input, redact secrets in all logs, avoid caching credential responses and keep secrets out of URL parameters and analytics. Do not pass customer input as an arbitrary upstream path, raw Cypher or tool name. Apply the existing query clamping and response scrubbing at the gateway. Deny subsequent calls immediately after removal, a team visibility switch or token revocation, and use a connection epoch or explicit revocation so republishing cannot resurrect old tokens. Define settlement of already-admitted in-flight queries consistently across visibility transitions.

Keep publisher, payer and brain identities separate. The gateway resolves listing, brain, owner, verified actor, payer and credential ID, creates an operation ID and transmits service-signed attribution with short expiration. Pair it with the exact query operation and validate target binding at billing. Persist channel and key ID internally for attribution, without the bearer. Distinguish retries of the same explicit operation from separate queries. Exclude team listings and publisher self-use from royalty under the proposed policy. Never use a missing viewer payer as a reason to charge the publisher. Revenue follows the durable eligible paid settlement under billing's rules.

## Alternatives

- Reuse the deployment BrainPAT or existing MCP OAuth flow. The key authorizes private deployment tools and carries no viewer or payer identity. The current OAuth exchange recovers a BrainPAT. Neither works as a visitor credential.
- Add a token type directly to the existing Python MCP service. A distinct route or service could host the adapter if deployment favors Python, but it must call the platform's authorized shared query service over an authenticated internal channel. It cannot dispatch through the current direct tool handlers.
- Put the public gateway directly in Go billing. This makes query settlement local but would duplicate Hub listing policy, platform session issuance, and credential and membership checks unless those are moved behind a service boundary. Keep one policy authority.
- Offer only OAuth tokens. This accommodates interactive OAuth-only MCP hosts but adds consent, resource discovery and token refresh. A copyable static bearer serves the requested first workflow where clients support custom headers.

## Assumptions and unresolved decisions

- Public means a Hub listing with public visibility. Signed-in viewer access matches the current Hub model. External team-only credentials are outside this slice.
- Browser Ask should also qualify when it settles eligible paid credits. It already carries listing identity. Explore and other non-paid reads are outside revenue.
- Confirm required MCP clients early. Existing config code offers header-based examples, which is repository evidence of intended support and does not establish current compatibility.
- Confirm whether every current payer-team member may issue a connection or whether issuance/use should require a dedicated spending permission. Use explicit membership and spending authorization rather than trusting a stale active-team hint.
- Confirm whether an owner using a different payer team or a member of the publisher team spending from another team qualifies. Proposed default excludes publisher-associated self-use during initial rollout and fails eligibility independently of permission to query.
- Confirm availability policy for public paid connections before payout onboarding and whether existing public listings are enabled automatically. Credential capability and earn-eligibility can be gated separately.

## Dependencies and risks

- Go billing currently resolves a BrainPAT to the serving deployment, then optionally overrides the payer using signed context. Payer lookup failure leaves the serving deployment in place. A strict path for public shared settlement must reject that failure and verify payer/brain/listing linkage. Current asynchronous best-effort successful-response recording is insufficient for durable paid settlement and replay deduplication.
- Current Hub sessions obtain payer team from the user's last active team and may omit payer deployment. Revalidate before monetization. Maintain legacy behavior for ordinary/team access while protecting the distinct new strict path.
- Current listing policy allows a special owner_quota pause state to reach Hub admission. Preserve existing browser behavior. Decide whether a public gateway can serve that state after strict viewer payment, or requires a live listing.
- The existing MCP FastMCP tools can call engine operations directly. Per-HTTP-request proxy billing cannot account for tool calls and logical errors. Use shared typed retrieval, not a proxy of legacy tools.
- To stop cross-listing credential substitution, bind token to listing ID rather than slug and gate any route parameter by the stored ID. Cover concurrent revocation/admission and record an explicit admission-time policy.
- Roll out Go signature/context validation before issuing new platform contexts. A mixed deployment must fail closed on strict settlement requests if they cannot be understood. Feature flags should distinguish issuance, query admission and accrual.

## Validation

1. Issue, copy, rotate and revoke while signed in. Test concurrent issuance, wrong user, revoked/expired token, wrong listing, stale team membership, invalid payer, disabled account, missing payer deployment and backend outage. Verify team/private publication, pause, removal and republish policies.
2. Issue a public credential, run the same query through REST and MCP, and verify identical target, payer and result rules. Verify native private API/MCP reject the new token. Include bounded inputs, raw-query refusal, forged payer/listing/usage context, upstream URL override, header replay, and secret redaction.
3. Verify the actual supported MCP clients initialize/list and call the tool with bearer configuration. Verify protocol errors and unsupported tools cannot call the engine. Test correct negotiated versions in staging.
4. With Go billing, show one charged and attributed retrieval under retry, zero royalty for rejected/unsuccessful/administrative/free calls, no charges against the owner when payer resolution fails, and unchanged cookie-based browser/team routes and private PAT API/MCP paths. Add TypeScript/Go signed-context vectors and Go settlement retry/concurrency coverage.

## Repository evidence

Paths below are relative to the Projects directory.

| Evidence | Location |
| --- | --- |
| Signed-in listing access, public vs team and special pause handling | `brainapi-maas-nextjs/src/lib/hub/access.ts:63`, `src/lib/auth/brainAccess.ts:87` |
| Existing payer selection, usage deployment, limits, and server credentials | `brainapi-maas-nextjs/src/services/hub/HubSessionService.ts:86`, `:138`; `src/services/TeamUsageDeployment.ts:108` |
| Browser Hub cookie, Ask usage and free Explore | `brainapi-maas-nextjs/src/lib/hub/routeAuth.ts:4`; `src/services/hub/HubChatService.ts:83`; `src/lib/hub/quota.ts:46` |
| Typed retrieval, explicit allowlist and server-signed usage context | `brainapi-maas-nextjs/src/lib/hub/readOnlyBrainClient.ts:431`; `src/lib/hub/allowlist.ts:13`; `src/lib/brains/client.ts:171`; `src/lib/billing/usageContext.ts:21` |
| Existing token storage pattern and header-bearing config examples | `brainapi-maas-nextjs/src/models/TeamJoinLink.ts:10`; `src/ui/features/connect/mcp.ts:25` |
| Legacy engine authentication and separate MCP handlers | `brainapi2/src/services/api/middlewares/auth.py:45`; `src/services/mcp/app.py:98`; `src/services/mcp/main.py:263`; `src/services/mcp/executor.py:27` |
| Go signed context, payer fallback, asynchronous recording | `brainapi-billing/internal/handlers/proxy_handler.go:123`, `:230`; `internal/services/attribution.go:108`; `internal/services/proxy_usage_service.go:147` |
