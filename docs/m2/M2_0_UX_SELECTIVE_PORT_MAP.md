# M2-0 UX Candidate Selective-port Map

Status: `read_only_plan_only`

Authority: `0befd512219eb2897fb1edf969ad37d7e8c56b0d`

Reference-only candidate: `task/m2-purchase-trust-ux-r1@1b8b61b32b1f284f843593777d8f0520ce13281b`

No merge, cherry-pick, selective port, code edit, Netlify change, or release integration occurred in M2-0. Neither candidate commit is safe to cherry-pick wholesale.

## Classification

| Class | Candidate unit | Future port method | Dependency / acceptance |
| --- | --- | --- | --- |
| A — Return contract reliability | `components/payment/PurchaseReturnStatus.tsx`; `app/purchase/return/[statusCapability]/page.tsx`; narrow changes in `lib/payment/production/application.ts`; related verifier expectations | Manually port decoder/status hunks only after F is designed; support bounded legacy `/result/<43-char-token>` and authenticated `/account/results/<UUID>`; reject malformed paths | Atomic with F; transient polling, canonical destination, terminal/no-loop tests |
| B — Purchase Trust UI | `components/payment/PurchasePaymentPanel.tsx`; narrow `components/request/RequestForm.tsx` JSX; matching `.request-payment-panel` CSS; `税込 980円`, `お支払いに進む`, legal-link order | Port the new component and only its insertion/CSS selectors. Preserve authority checkout handler, eligibility, verified-email/auth, economics, and legal links | After B1/C1 contracts; Human mobile/desktop visual review |
| C — Google latency measurement | `lib/customer-auth/latency-measurement.ts`; observer injection in `lib/customer-auth/application.ts` and `service.ts`; narrow Auth route and `RequestForm` timing hunks | Independent measurement task: library -> observer seam -> routes -> client markers. Do not mix with Purchase UI | PII/secret allowlist, T0–T4, bounded Server-Timing, fail isolation; does not itself achieve 10 seconds |
| D — Review fixture/test only | `app/review/purchase/trust/[fixtureId]/page.tsx`; `components/review/ReviewPurchaseTrust.tsx`; `scripts/verify-m2-purchase-trust-ux.mjs`; design note | Port separately as static fixed-fixture review evidence; keep outside production customer authority | No payment/API/AI/persistence/email; review route cannot be cited as live behavior |
| E — Authority runtime-assets conflict | Candidate deletion of `netlify.toml` and `scripts/verify-m1-4-background-runtime-assets.mjs`; `toml` removal; weakened async artifact verifier config | **Reject every hunk. Never port.** Preserve authority runtime-assets fix and packager configuration | Byte/semantic protection before and after every future port; all M1-4 runtime verifiers pass |
| F — State contract change | Mandatory `paymentVerified: boolean` for `confirmation_pending` across `lib/payment/production/types.ts`, application branches, decoder/UI, RC/M1 verifiers | Treat as a contract task, not visual polish. Port types + all producers + all consumers + verifier expectations in one commit | Pre-verification false; verified-but-pending true; missing/malformed fails closed; A ports only with F |

## Commit and hunk order

1. Record hashes and protect authority `netlify.toml`, background runtime source, runtime-assets verifier, `toml` dependency, and async packager config.
2. Do not cherry-pick candidate commit `c13af4d`: it mixes A/B/D/F with prohibited E regressions.
3. Implement F and A together through manual hunks against authority, not whole-file replacement.
4. Port B component/CSS and the narrow `RequestForm` insertion in a separate reviewable commit.
5. Port D fixtures/verifier separately and retain review-only semantics.
6. Do not cherry-pick candidate commit `1b8b61b`: port C library/observer/route/client hunks as an independent measurement task.
7. Re-run typecheck, lint, build, Auth/RC/M1-4/M2 tests, protected-file hash checks, and `git diff --check` before Human review.

## Non-negotiable runtime protection

`netlify.toml`, `netlify/functions/production-fulfillment-background.mts`, `scripts/verify-m1-4-background-runtime-assets.mjs`, the `toml` dependency, and the authority async packager configuration must not be deleted, replaced from the candidate, or weakened. A future UI success with any runtime-assets regression is a failed port.

