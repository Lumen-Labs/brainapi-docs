# Public brain revenue test rollout

This rollout uses the app in `brainapi-maas-nextjs` and the billing proxy in `brainapi-billing`. Deploy the updated proxy before enabling revenue in a test environment. A managed retrieval requires the proxy to acknowledge signed platform settlement and resolve the visitor's payer deployment.

## Test environment

- Use a MongoDB replica set and the same `USAGE_CONTEXT_SECRET` in the app and the proxy. Confirm the existing wallet balance and team usage deployment are accessible from the app.
- Set `PUBLIC_BRAIN_REVENUE_BPS` to the approved rate in basis points. For example, `2500` is 25%. The supported increment is 10 basis points. An unset rate disables public query settlement.
- Set `PUBLIC_BRAIN_REVENUE_ORIGIN` to the trusted HTTPS app origin for Stripe redirects.
- Set `PUBLIC_BRAIN_TEST_TRANSFERS_ENABLED=true` only in the environment running the test transfer command. The transfer switch is independent of query accrual.
- Use a Stripe Connect test configuration, an `sk_test_` key, and the matching signed webhook secret. Deliver `payment_intent.succeeded`, `charge.refunded`, and `charge.dispute.created` to the existing billing webhook. Checkout proceeds through the existing credit purchase path.
- Use a publisher team and a separate buyer team. Enable revenue share from the publisher's Sharing settings and complete Stripe-hosted test onboarding. From the buyer team, buy a verified USD credit pack and create a token from the public listing's Connect sheet. The buyer must have billing management permission for the active team.
- Check one included query and one successful query after the included allowance is used. The current retrieval price is USD 0.001. Compare the query settlement, payer wallet debit, prepaid usage row and publisher accrual. Repeat the same REST idempotency key or MCP request ID to confirm the replay creates no second charge. Team-only listings and Explore generate no publisher earnings.

## Connecting from an app or MCP

For an app, send the token in the `Authorization` header and use a unique idempotency key per logical query.

```sh
curl "$APP_ORIGIN/api/hub/listings/$LISTING_SLUG/query" \
  -H "Authorization: Bearer $SHARED_BRAIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: app-query-001' \
  --data '{"query":"What are the key points?"}'
```

For MCP, use Streamable HTTP at `/api/hub/listings/<slug>/mcp`. Configure the same Bearer header and call `query_brain` with `query` and a stable `request_id` for retries. Discovery does not consume credits. The REST response and MCP tool expose matching passage text. Clients that require interactive OAuth are outside this test rollout.

## Test settlement operations

Run the commands from the Next.js repository using the test environment. They can be invoked from a scheduler. Database credentials and the Stripe key come from the process environment.

```sh
npx tsx scripts/operations/public-brain-revenue.ts prepare
npx tsx scripts/operations/public-brain-revenue.ts reconcile
npx tsx scripts/operations/public-brain-revenue.ts transfer <publisher-team-id>
npx tsx scripts/operations/public-brain-revenue.ts reconcile-transfer <publisher-team-id>
```

Run `prepare` once to create the feature indexes before enabling accrual. Reconciliation releases expired reservations and removes cached query result bodies after 24 hours while preserving the settlement records. Test transfers use test-funded earnings that have aged at least 24 hours. They pay whole cents and carry the remainder forward on the query entries. The transfer command accepts only a Stripe test key and rechecks funding with Stripe before sending. An ambiguous outcome past the retry window blocks subsequent transfers until the operator checks the persisted batch against Stripe. A Stripe transfer is recorded separately from any bank payout displayed by Stripe.

Refunds and disputes place the affected pack on hold, remove its unspent verified amount from the wallet, and hold linked unpaid earnings. Existing test batches linked to that funding are flagged for review. Partial refund allocation, dispute resolution and post-transfer recovery require operator reconciliation in this test version. Keep real settlement disabled until those policies and a live rollout are approved.

[Stripe-hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding) · [Separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers) · [Transfer reconciliation API](https://docs.stripe.com/api/transfers/list)
