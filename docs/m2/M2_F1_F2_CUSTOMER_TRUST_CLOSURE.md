# M2-F1 + M2-F2 — Customer Trust UX Closure

Status:

- M2-F1: `Human/ChatGPT SOURCE PASS`
- M2-F2: `Human/ChatGPT SOURCE PASS`
- PROD-01: `CUSTOMER TRUST SOURCE READY`
- UX-01: `POST-PAYMENT TRUST SOURCE READY`
- ERR-01: `PURCHASE/RETURN SLICE ADDRESSED — BROADER ERR-01 REMAINS OPEN`

Source base: `release/private-ready@60c4f6f6b592463c65815e7df87f19a56cf67751`

Task branch: `task/m2-f1-f2-customer-trust-closure-r1`

Reviewed candidate: `930b3552878189d33b48d95c83bebbf0ff658558`

This is accepted source evidence. It is not Human visual acceptance, deployment, Production Publish, Payment activation, or Public Launch authority.

Historical pre-review disposition preserved for verifier lineage:

- M2-F1: `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`
- M2-F2: `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`
- PROD-01: `CUSTOMER TRUST SOURCE CANDIDATE`
- UX-01: `POST-PAYMENT TRUST SOURCE CANDIDATE`
- ERR-01: `PURCHASE/RETURN SLICE FURTHER ADDRESSED — NOT CLOSED`

## 1. Pre-F1/F2 gap and authority inventory

The final decision surface contained the required facts, but price, one-time purchase terms, Stripe handoff, AI use, non-guarantees, legal links, and the Checkout action competed in one long memo. The primary action read like a charge command instead of a calm handoff to a reviewable Stripe page.

The Return lane already had one strict server response contract:

- `confirming_payment` — durable payment is not yet verified;
- `payment_not_completed` — terminal unpaid state where the same Checkout may be restarted;
- `preparing_assessment` — durable payment verified, fulfillment in progress;
- `temporary_problem` — durable payment verified, bounded automatic recovery remains possible;
- `confirmation_pending` — automatic confirmation stopped; `paymentVerified` separately controls paid/unpaid wording;
- `completed_check_verified_email` — durable payment verified and result complete, but this browser lacks the result credential;
- `completed` — durable payment verified with a validated legacy or authenticated Account result path.

F1/F2 does not add, rename, infer, or mutate any Payment state. `paymentVerified` remains the only source for “お支払い確認済み” and “追加のお支払いは必要ありません”.

## 2. F1 purchase decision contract

Both current final decision lanes use the same `PurchasePaymentPanel`:

- RequestForm purchase-ready confirmation;
- authenticated `/purchase/auth/continue`, including the C1 continuation path after any one allowed clarification.

The panel presents, before one dominant action:

- `税込980円`;
- `1相談 / 1鑑定ノート`;
- `都度払い`;
- `自動更新なし`;
- `Stripeによる決済`;
- AI use;
- no guarantee of the other person’s true thoughts, reply, reconciliation, future, or relationship improvement.

The visible primary action is `お支払いに進む`. Its next-step copy says that Stripe opens next and the Customer can review before paying. Relevant Terms, Privacy, Refund, Tokushoho, and AI disclosure links remain immediately adjacent. The only other action is the existing low-emphasis edit/login-method action.

Checkout creation, URL validation, same-origin fetch, CSRF/preparation capability, idempotency, Purchase eligibility, C1, and Stripe request semantics are unchanged.

## 3. F2 customer-safe state mapping

The UI now presents three honest milestones: `お支払い確認` → `鑑定ノート準備` → `お受け取り`. Each milestone is marked only as complete/current/next from the strict server state. It is a categorical state map, not percentage progress, elapsed-time prediction, queue position, or Provider progress.

| Server contract | Customer heading / current milestone | Safe action |
| --- | --- | --- |
| confirming_payment | 決済を確認しています / お支払い確認 | bounded automatic recheck |
| payment_not_completed | 決済は完了していません / お支払い確認 | same-purchase Checkout restart; optional fresh request is secondary |
| preparing_assessment | 鑑定ノートを準備しています / 鑑定ノート準備 | no payment action; automatic observation continues |
| temporary_problem | verified recovery wording / 鑑定ノート準備 | after exhaustion, same-purchase refresh and Account; Support only when enabled |
| confirmation_pending, unverified | individual payment confirmation / お支払い確認 | Account when server permits; Support only when enabled |
| confirmation_pending, verified | individual fulfillment confirmation / 鑑定ノート準備 | Account; Support only when enabled; never Checkout |
| completed_check_verified_email | 鑑定ノートが完成しました / all complete | confirmed email recovery only |
| completed | 鑑定ノートを開いています / all complete | existing validated result redirect |

Internal terms such as `manual_review`, reconciliation, lease, Provider, Async Workloads, RPC, and scheduler never enter the Customer component or presentation copy.

## 4. Recovery and ERR-01 slice

Visible failures have one or more safe, state-authorized next actions:

- status observation failure: bounded automatic retry, then same-purchase manual refresh at exhaustion;
- paid/owned recovery: `私の鑑定ノートを確認する` only when the server contract permits Account fallback;
- Support: `/contact` only when `CUSTOMER_SUPPORT_CASES_ENABLED` is exact true; D2 revalidates fresh identity and owned purchase;
- unpaid terminal state: restart Checkout for the same Purchase Intent;
- Checkout preparation failure: retry the same action; copy explicitly says no charge occurred.

No raw safeCode, exception, status capability, Payment ID, provider identifier, or internal recovery vocabulary is rendered. F1/F2 does not claim broader ERR-01 closure.

## 5. No-repayment and adjacent-authority freeze

Every state with durable `paymentVerified: true` has Checkout restart disabled and states that no additional payment is required. Account and Support recovery refer back to the original durable purchase. F1/F2 creates no Purchase Intent, payment attempt, fulfillment job, Support case, email, Async event, or Provider call.

The following remain unchanged from the source base:

- E1 measurement schema, trace/cookie, phase semantics, and default-off adapter;
- E2 standalone Account Auth, fixed redirects, session probe, and Header;
- E3 Account/history/result ownership and canonical projection;
- D2 Support schema/API/ownership/state machine and default-off activation;
- C1 compute budget schema/RPC/config authority;
- Payment/fulfillment API, strict status decoder, poller, DB schema, migrations, and Stripe provider semantics.

Migration count is `0`. Next.js remains 16.3.0 and dependencies are unchanged.

## 6. Review fixtures, accessibility, and viewport boundary

`/review/purchase/trust/[fixtureId]` renders nine fixed, external-operation-free states: Checkout plus every current Return contract disposition needed for trust review. The purchase panel has one dominant button, a labelled decision section, and an explicit description. Return state uses `aria-live`, one H1, a labelled ordered milestone list, textual state labels, real links/buttons, visible focus styles inherited from the accepted system, and mobile-stacked actions.

Production-build browser evidence was captured at 320, 390, and 1280 CSS pixels:

- Checkout: horizontal overflow `0` at all three widths, one H1, one primary purchase button, five adjacent legal links, and a 68px-tall primary action;
- Return recovery: horizontal overflow `0` at all three widths, one H1, one primary recovery action, complete/current/next textual milestone states, and visible same-purchase, Account, and enabled-Support actions;
- all eight Return fixtures at 390px: one H1, no horizontal overflow, no internal recovery vocabulary, and only state-authorized actions;
- the 390px visual pass found and corrected one secondary-action contrast defect; the rebuilt computed color is `rgb(33, 26, 43)` on the Paper surface and the action is visibly rendered.

Human visual acceptance remains separate.

## 7. Source regression

- F1/F2 verifier: `24/24`;
- D2 `28/28`, D1 `30/30`, C1 `8/8`, Auth Entry `11/11`, Product Intent `18/18`, Purchase Eligibility `9/9`, Clarification `7/7`;
- B1 descendant `15/15`, I1 descendant `15/15`, RC-1 `19/19`, RC-2 `50/50`, Background Durability `21/21`;
- Async graph/artifacts, Scheduled artifacts, runtime-assets, root and ingress typecheck/build, zero-warning ESLint, and `git diff --check`: PASS;
- customer Production build: `48/48` static generation PASS.

Historical literal verifiers remain unchanged. E3 reaches `37` accepted Account/Auth checks before its exact E1-era `RequestForm.tsx` byte-freeze detects this task's bounded F1 presentation change; E2 and E1 stop only at their historical reviewed-authority SHA pins. Customer Auth reaches `31` checks before its previously accepted older-file lineage pin, and I4 reaches `6` scheduler-safety checks before its historical migration list ending at `0019`. The new verifier independently freezes E1/E2/E3/D2/C1 authority files and the Payment server contract while permitting only the reviewed presentation surface.

## 8. External and activation boundary

Remote DB remains read-only exact `0002..0021`, pending `0`, unknown `0`; accepted 0021 SHA-256 remains `49dd851643dc85716dc8ca0fb712e2d51bc37e8d04116fd0ae24555b7d27bc9a`.

Production Publish, manual Netlify deploy/config, DB writes, Stripe operations, real Checkout/Payment, Provider/OpenAI, email, Support activation, Async events, scheduler, telemetry activation, SEC-01 dependency work, and `main` change are outside this task and remain prohibited.
