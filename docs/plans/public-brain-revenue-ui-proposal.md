# PLAN-3 · Public brain revenue and connection UI

## Recommendation

Keep publishing in Brain settings → Sharing. After a listing goes public, show a Revenue share card with the effective platform-set rate, enrollment state, an eligibility explanation, Stripe setup, and the listing’s earnings. Offer an owner-authorized link into Stripe for payment account administration. The existing publish consent can mention the program when the feature is enabled. Publishing and payout enrollment are separate actions so existing public listings can opt in and a stalled Stripe session cannot block public sharing. Switching to team visibility or stopping sharing closes eligibility for new queries. An authorized owner can still review already-earned amounts and resolve payout issues for a formerly public listing.

Use a separate server-enforced revenue permission. The working proposal is the brain's owning team as payee, with a Team Owner enrolling or managing the Stripe relationship, and financial reads limited to Team Owners for v1 pending an explicit policy. Existing public publishing permission includes Admins. Preserve that distinction and avoid treating the historical publisher as the payee without an explicit decision. Present the payout relationship once per payee even if multiple listings earn. Show earnings per listing and link to account-level payout history. Label account-level bank payouts separately from transfers for listing earnings. Show pending, available, transferred, and adjusted totals only where the ledger supports those distinctions. Show currency alongside amounts and keep currencies separate.

Use Stripe-hosted onboarding for identity, business, and payout details. Support start, resume, refresh-link, return, verification pending, restricted, and enabled states. POST a new authorized, short-lived link for each outbound action and navigate directly. On return, reload authoritative account state scoped to the owning team. Refresh link authorization on the server and restore to an internal return path. An optional Express Dashboard action is appropriate only if the selected Connect configuration grants access. [Stripe-hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding), [Stripe Express Dashboard](https://docs.stripe.com/connect/express-dashboard)

For consumers, extend the existing Connect sheet and make the same credential flow reachable from an eligible shared listing's detail and saved-card entry. Keep the new UI to generating, copying, rotating, or revoking the scoped token. Show the API/MCP endpoint or a documentation link only as needed for setup and render a short payer-team attribution near the issue action. Keep normal browser chat session-based. If the active team cannot pay, show the backend’s actionable reason and use existing team selection where available. For a saved listing, explicitly distinguish a viewing project’s team from the token's payer team. The server must authorize the selected team and bind it at issue time. Use a stable listing reference internally and obtain capability from the server so availability, moderation, membership, and rollout cannot be bypassed through client state. Preserve existing saved-listing behavior where token issuance is unavailable.

## Candidate contracts

- Owner settings query returns a separate revenue DTO gated by ownership and permission. Include listing enrollment and eligibility, rate and terms version, payee account readiness, balances by currency, and a paginated owner-only activity projection if needed. Publish and update payloads can retain their existing scope. Enrollment is a distinct mutation with versioned terms and an idempotent result.
- Revenue onboarding and dashboard-link mutations are authenticated POSTs with server-generated destination and allowlisted return paths. Browser-visible account state is a normalized projection. Return and refresh trigger a new query. A redirect alone never changes the displayed enrollment state.
- Consumer detail and saved cards can receive a small credential-capability hint, or request it when the sheet opens. A session-authenticated list returns masked metadata and a server-validated payer label. Issue and rotate return a secret once with no-store semantics. Revoke and rotate target an opaque credential ID. Keep secret responses in component-local ephemeral memory and out of shared Redux cache, analytics, logs, URLs, and clipboard telemetry. Clear on close or context change. Supply placeholders in setup examples.
- Normalize access failures through existing API error conventions. A newly hidden listing, stale role, invalid payer, expired key, or removed membership must be handled by the server even if the UI was already open. No issuer secrets, raw Stripe payloads, or other customer data belong in Hub DTOs.

## Alternatives

- Embed payout onboarding in the Share wizard. This would require every publisher to encounter payout setup and couple listing publication to an external onboarding flow.
- Put all revenue management in Team billing. A team-level view may be useful later, but the existing billing UI is centered on paying for usage. Start with per-listing earnings and payee-scoped Stripe actions where public publishing is managed.
- Expose the existing workspace Connect sheet or generate a shell command containing the real token. Existing workspace configuration is for direct brain credentials. Keep a dedicated scoped credential flow and use placeholders in examples to reduce accidental disclosure.
- Store a token on a saved project row. Saved listings are discoverability/bookmark records. A personal credential may draw from a team allowance without becoming a project-wide secret.

## Assumptions and unresolved decisions

- Product needs to confirm whether the payee is the publishing user or the owning team. Team-owned is the proposed v1 default because a public listing, its project, and its billing roles already have team ownership. Confirm owner versus admin access to earnings and what happens after transfer of a brain or team.
- Confirm the platform rate, fee basis, eligible purchased credit classes, refunds and reversals, minimum threshold, supported jurisdictions and currency, and whether accrual starts at enrollment or only after Stripe readiness. Dashboard copy and money-state labels depend on these decisions.
- Confirm external connector scope for team listings. Recommend public read-only external issuance as the initial new path, with existing team listing behavior preserved. If team listings also receive credentials, they need independent access policy and produce no revenue share.
- Confirm which accepted team roles can bind billable external credentials, whether several app-specific credentials are supported, and whether users can pick a payer team or must use the active accepted team. Confirm supported MCP clients and endpoint protocol with access workstream.

## Dependencies and risks

- The access workstream defines the external auth transport, bearer scopes, stable listing identity, status checks, payer authorization, and lifecycle. The billing workstream supplies a viewer debit with trustworthy listing attribution and a ledger/reporting projection. Coordinate contracts before splitting frontend implementation.
- An owner who downgrades visibility, is removed, or begins an onboarding session before a role change can retain browser state. Fetch authority on every mutation and revalidate on return. For historical payee access after ownership changes, use payee authorization as defined by the money contract.
- Shared Hub chat already picks a viewer team and checks allowance in code, while older specs describe an owner-pays model. Use runtime behavior for current UX and verify its settlement implications with billing.
- Keep token creation as an explicit action. Ensure loading disables duplicate submission, transport retries follow the issuance contract, and copy feedback avoids echoing the secret. Preserve keyboard focus and provide accessible errors. A stale saved listing must lose the new action or receive an actionable disabled state.
- Guard feature availability on both server and client. A failed Stripe redirect, stale status, payout rejection, zero earnings, disabled listing, and network failure each need distinct recoverable owner states.

## Validation

- Run scoped existing suites from the MaaS checkout with `npx tsx --test tests/hub-share-form.test.ts tests/hub-owner-service.test.ts tests/hub-access.test.ts tests/hub-wiring.test.ts tests/saved-listing.test.ts tests/connect-mcp.test.ts` plus new targeted contract tests, then `npm run typecheck:ci` and `npm run build`.
- Staging browser checkpoint with Owner, Admin, Member and consumer accounts. Publish public or team, edit visibility, start and revisit setup, finish Stripe sandbox onboarding, check restricted/incomplete status and account-scope authorization, then confirm an eligible query changes only the intended listing’s owner balance.
- Check consumer flows from direct detail and saved cards, across team changes and an unavailable listing. Copy secret once, use it in an app and supported MCP client, rotate and revoke, verify old token rejection, inspect client network/cache/logs for leaks, and verify browser chat and owned-brain Connect still operate normally.

## Repository evidence

All paths below are in the sibling MaaS checkout.

- `src/ui/features/settings/SettingsTab.tsx` mounts `SharingCard`, which opens `ShareDialog`. `src/lib/hub/shareForm.ts` owns draft defaults and consent validation. `src/store/api/hub.ts` wires owner and public listing endpoints through RTK Query.
- `src/app/api/brains/[brainRef]/listing/route.ts` and `src/services/hub/ListingOwnerService.ts` implement owner-listing reads and writes. `src/types/platform/hub.ts` defines `OwnerListingView`, `HubListingDetail`, and `SavedListingDto`. Saved DTOs currently lack visibility or token capabilities. `src/lib/auth/permissions.ts` grants public publishing and billing reads to Admins and billing management to Owners.
- `src/ui/features/shared/SharedDetail.tsx` has the direct listing view and owner settings link. `src/ui/features/home/SavedListingCard.tsx` mounts `src/ui/features/connect/SavedListingConnectSheet.tsx`, whose copyable Ask URL points at the existing session-based Hub chat route. `src/ui/features/connect/McpSetup.tsx` and `mcp.ts` contain examples for owned brain configuration.
- `src/services/hub/HubSessionService.ts` and `HubChatService.ts` open the read-only session with a server-resolved brain credential, viewer payer deployment and usage context. `docs/plans/platform-v2/07-billing-usage.md` records the earlier owner-pays design.
- `src/ui/features/billing/PaymentMethodCard.tsx` and `src/app/api/billing/payment-methods/setup-intent/route.ts` are existing customer collection surfaces. Revenue enrollment should have a separate Stripe Connect account lifecycle and owner route.
