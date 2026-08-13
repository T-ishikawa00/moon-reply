# Payment Charter v1

## 1. Status and Authority

> **B2 Candidate current overlay:** `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review` on `2026-08-13`; Human + ChatGPT review / acceptance `pending / pending`; exact next work B2 review. Payment Charter v1 remains `human_chatgpt_accepted_complete`; no normative Charter principle, Payment implementation authority, or Production Payment authority changes.

- Candidate formulation date: `2026-08-11`
- Acceptance date: `2026-08-12`
- Status: `human_chatgpt_accepted_complete`
- Human + ChatGPT acceptance: complete
- Implementation authority: `false`
- Canonical strategy: `PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`
- Provider-specific facts and approval remain separately evidence-gated.

Acceptance lineage:

- original Candidate: `7aeb9ecbc5a786b895f9280112f13b0629730429`;
- integrated-review correction: `b6f38586fadd2a17034810dbb139465af5eade2f`; and
- explicit `2026-08-12` Human decision on Delivery/Recovery Email Verification with trusted-session reuse.

The Candidate formulation remains historical lineage. This accepted Charter is the current provider-independent Payment and Product-integrity authority. Acceptance creates no API, SDK, checkout, webhook, schema, migration, Provider call, Runtime/LUNA change, production authorization, PR, main merge, or release authority.

The following states are distinct and must never be collapsed:

`strategy agreement`
≠ `Charter Candidate`
≠ `Charter acceptance`
≠ `provider approval`
≠ `implementation authorization`
≠ `production authorization`

Current boundaries remain:

| Boundary | State |
| --- | --- |
| Payment implementation authorized | `false` |
| Stripe strategy | Human + ChatGPT accepted at Product/strategy level on `2026-08-12`; not feasibility, approval, activation, or selection |
| Stripe-first Customer-facing / Public-copy Alignment | `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete` on `2026-08-12`; Product/UI/content authority only; Human Visual QA and Automated QA PASS |
| Stripe Feasibility Evidence Preparation | `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete` on `2026-08-12`; preparation authority only; no external-action authority |
| Stripe feasibility / account / contact / approval / activation | Not established / absent / none / absent / absent |
| Stripe evidence lanes | Lane A `preparation_human_approved`; Lane B/C blocked; all external actions not authorized; all acquisitions not submitted; all outcomes `null` |
| Cards / Apple Pay / Google Pay / PayPay eligibility | Unverified |
| PAY.JP | Paused fallback; Not approved; Not selected |
| Formal Provider evidence-gate selection | Not completed |
| Payment API / SDK / checkout / webhook implementation | `0` |
| DB / Supabase / migration operations authorized | `0` |
| Runtime / LUNA changes authorized | `0` |
| Provider calls authorized by this task | `0` |
| RevenueCat / Apple IAP / Google Play implementation | Unauthorized |
| PR / main merge / release | Unauthorized |

Stripe feasibility evidence preparation remains `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`. Lane A remains Human-approved preparation / no external authority / not submitted / `null` but is preserved inactive. Stripe Sales is `not_used_by_human_direction`, not a Provider outcome. The Stripe Lane B Human Decision Package is `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete` on `2026-08-13`; all seven policy directions are accepted. The B2 Candidate is `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`; B2 Human + ChatGPT review is the exact current next work and acceptance remains pending. Lane B/C remain blocked pending downstream requirements, and no external action is authorized. Stripe feasibility is not established; account/contact/submission remain absent/none/none; approval/activation are absent; formal selection is incomplete; and desired-method eligibility is unverified. PAY.JP is paused fallback. Provider account/contact/API operations, Payment implementation authority, and Production Payment authority remain `false`. Ordinary JPY 980 Product refunds remain distinct from uncapped Payment Integrity remediation.

## 2. Initial Product Contract

The fixed initial commercial product is:

- one consultation = one assessment note;
- JPY 980 including tax;
- one-time purchase;
- no automatic renewal;
- no initial subscription;
- no Customer-facing coins;
- no Customer-facing points.

Before the Customer authorizes payment, the final purchase confirmation must make the material purchase terms visible. This Charter does not invent Provider-specific checkout behavior.

## 3. Safety and Purchase Authority

The required conceptual sequence is:

`consultation`
→ `accepted server-owned Safety classification`
→ `purchaseGateSatisfied=true`
→ `delivery/recovery email`
→ `mailbox verification when no valid trusted session exists`
→ `server-authoritative verified-email binding to current purchase authority / Purchase Intent`
→ `final purchase terms and confirmation`
→ `Payment`

For a still-valid trusted session bound to the unchanged verified delivery/recovery email, repeat mailbox verification may be skipped. Safety eligibility and final purchase confirmation remain required for every Purchase.

Browser state is never purchase authority or trusted-email authority. Any mutation of Safety-bound input that invalidates current purchase eligibility invalidates stale purchase authority. A prior Payment must never be silently reassigned to materially changed consultation content.

Safety controls whether assistance may be provided. Normal Product outcomes—such as waiting, pausing additional contact, or producing no current message draft—do not independently block purchase when the assistance scope remains eligible.

## 4. Top-Level Payment Integrity Invariants

For one intended purchase:

- successful economic charges `<= 1`;
- normalized Moon Reply Purchases `<= 1`;
- Assessment Grants `<= 1`;
- Logical Assessments `<= 1`;
- canonical Customer-visible Reports `<= 1`.

A confirmed duplicate successful charge is a **P0 Payment Integrity Incident**, even when Moon Reply database constraints prevented duplicate Purchase, Grant, or Assessment creation.

Other P0 candidates include:

- wrong amount;
- wrong currency;
- wrong Customer mapping;
- wrong Request mapping;
- charging while current purchase authority is invalid or Safety authority was bypassed;
- production/test environment contamination;
- critical idempotency or uniqueness failure;
- material production credential compromise.

Refund is the final safety net, not the primary duplicate-charge defense.

## 5. Purchase Intent and Payment Attempt Model

The model is:

`1 Purchase Intent`
→ `0..N Payment Attempts`
→ `successful economic charges <= 1`

Payment Attempts for the same Purchase Intent are sequential. A new Attempt may be created only after the previous Attempt is server-authoritatively established as terminally failed or cancelled without charge.

A new Attempt must not be created while the previous Attempt is:

- pending;
- processing;
- unknown;
- unverifiable because verification is unavailable;
- succeeded.

Provider idempotency must be used where authoritative Provider evidence supports it, but its exact mechanism remains evidence-gated. Moon Reply must independently enforce the one-successful-charge invariant and must never rely only on the Provider.

## 6. Payment Success Authority

A browser redirect, success display, or client state is never final Payment authority. A Payment may become locally successful only after the Moon Reply server validates authenticated, authoritative Provider evidence against the persisted Purchase Intent.

As supported by the selected Provider, provider-independent verification must validate:

- Provider identity;
- environment;
- Provider payment or transaction identity;
- Purchase Intent linkage;
- product;
- expected amount;
- currency;
- Customer and Request linkage;
- Payment state;
- absence of an already-successful conflicting Payment.

All success paths converge on one server-controlled verification procedure. This Charter does not define Stripe, PAY.JP, or other Provider objects, statuses, fields, webhook events, fetch semantics, metadata, authentication/capture semantics, or signatures as facts.

## 7. Unknown Is Not Failure

The invariant is:

`unknown != failed`

If Moon Reply cannot determine whether an external charge succeeded:

- do not create another charge;
- do not ask the Customer to pay again;
- retain and reconcile the existing Payment identity;
- allow only server-controlled verification or reconciliation;
- resume repurchase or retry only after failure or cancellation-without-charge is authoritatively established.

Customer recovery guidance must state that another payment is not required while the original status remains unresolved. No exact unknown-state timeout is set by this Charter.

## 8. Webhook and Provider Callback Rules

Provider callbacks are external evidence inputs, not Customer or Product authority by themselves.

- Only authenticated callbacks are processed; the authentication mechanism is Provider-specific and evidence-gated.
- Replay and duplicate delivery are idempotent.
- The same callback received N times cannot multiply Purchase, Grant, Assessment, Refund, or fulfillment.
- Different callbacks for one Payment cannot multiply Product rights.
- Arrival order is not authoritative business chronology.
- Stale events cannot regress an authoritatively established state.
- An invalid callback does not mean failed Payment.
- Callback-processing failure does not authorize a new charge.
- Webhook outage must not be the sole recovery dependency.
- The webhook handler must not directly own LUNA generation.
- Fulfillment remains decoupled from callback processing.

Provider retry timing, event identifiers/types, and signatures remain evidence-gated.

## 9. Purchase, Grant, and Logical Assessment Boundary

Provider transaction facts are normalized into Moon Reply Product rights:

`verified external transaction`
→ `Moon Reply Purchase`
→ `one Assessment Grant`
→ `one Logical Assessment`
→ `one canonical Report`

Assessment Grant is an internal domain concept, not a Customer-facing coin or point. Retries never issue another Grant for the same legitimate Purchase.

## 10. Post-Payment Fulfillment Recovery

Once Payment is authoritatively verified successful, the same Purchase Intent enters a **no-recharge boundary**. Downstream failure must never trigger another economic charge for that Purchase Intent.

Payment retry and Fulfillment retry are separate. Bounded internal fulfillment attempts may be necessary, but every attempt belongs to the same Logical Assessment. At most one active fulfillment owner may operate that Logical Assessment at a time.

Browser reload, callback replay, concurrent worker, process restart, or operator retry must not create competing Customer-visible assessments. Recovery should resume from the latest safe durable checkpoint where possible:

- LUNA not started → resume the same fulfillment;
- recoverable LUNA technical failure → bounded retry of the same Logical Assessment;
- Report complete and email failed → retry notification only, without regenerating the assessment;
- safe Report persistence failure → recover persistence without unnecessary regeneration where possible.

Infinite retry is prohibited. Exact retry counts and exact 10-minute, 15-minute, or other wall-clock thresholds are not set here; they remain production-preparation decisions based on measured Runtime behavior.

Every successfully paid Purchase must never remain indefinitely `processing`.

If the economic Purchase remains effective and has not otherwise been validly refunded or reversed, it must converge to either:

- `delivered`; or
- reconciled service-failure full-refund terminal handling.

Other reconciled terminal outcomes may legitimately apply, including:

- an authorized Customer-requested refund;
- a legally required refund or cancellation;
- a Provider- or Store-initiated reversal;
- a dispute or chargeback financial resolution.

These outcomes must not create another Payment, Purchase, Grant, Logical Assessment, or canonical Report. This Charter does not invent exact terminal-state names that have not yet been decided.

Once a service-failure refund terminal path is selected, late generation output must not automatically be published. The special duplicate-charge rule remains distinct: the one legitimate Purchase may still produce its legitimate Report while the excess unintended charge is refunded.

## 11. Customer Recovery and Privacy

Browser presence, browser storage, success-page presence, or possession of a redirect URL is not required to recover a paid order. Losing a Result URL must not create a new Payment, Purchase, Grant, Logical Assessment, or LUNA execution. Recovery returns to the same canonical Report.

Result-access credentials must conceptually be:

- server issued;
- unguessable or equivalently protected;
- separate from Report content;
- separate from Provider transaction identity;
- revocable or rotatable;
- absent from ordinary logs, analytics, and Provider metadata.

A support reference or Purchase lookup identity is not automatically disclosure authority. Routine Payment or delivery support should not require consultation body, partner messages, raw card number, CVC, or unnecessary sensitive assessment content. Payment and support observability must be privacy-minimized.

This Charter does not select an exact Result-token implementation or expiry.

## 12. Delivery/Recovery Email Verification

Status: `accepted_required_control_with_trusted_session_reuse`

### First or untrusted-session purchase

Before any real economic charge is initiated, Moon Reply must have server-authoritative evidence that the Customer controls the delivery/recovery email mailbox. This may be established during the current purchase flow or by an existing still-valid trusted session already bound to the same verified email.

The verified delivery/recovery email must be bound to the current purchase authority and Purchase Intent before Payment.

### Repeat purchase

Moon Reply must not require mailbox verification again for every purchase merely because the Customer is buying another assessment. When the trusted session remains valid and the verified delivery/recovery email is unchanged, a repeat Customer may proceed without repeating email verification.

Safety eligibility and final purchase confirmation remain required for every Purchase. A trusted session is neither Payment authority nor Safety authority.

### Reverification

Email ownership must be reverified when applicable, including when:

- the delivery/recovery email changes;
- no valid trusted session exists;
- the trusted session is expired, revoked, invalidated, or otherwise unavailable;
- another browser or device has no valid trusted session;
- sensitive recovery requires renewed mailbox control; or
- the system cannot safely establish the existing verification binding.

No risk-scoring system is established by this rule.

### Security boundary

Trusted state must be server-verifiable. Browser, client, cookie contents interpreted without server verification, or localStorage state alone must never be able to assert `verified=true` or equivalent trusted status. The Customer must not be able to create or modify trusted status solely through client-controlled state.

### No-login boundary

This accepted control does not introduce mandatory account creation, password login, Google login, Apple login, a Customer profile/account system, or My Page. The initial MVP remains no-login. A trusted delivery/recovery session is not a full Customer account.

### Identity boundary

Email ownership verification proves mailbox control. It does not establish legal identity or prove that the Customer is a particular named individual.

### Still unresolved

The Charter does not decide:

- OTP versus Magic Link;
- exact verification Provider;
- session implementation;
- cookie or token implementation;
- exact trusted-session lifetime;
- exact refresh behavior;
- exact revocation implementation;
- Google or Apple authentication; or
- future account migration.

These belong to separately authorized implementation or design work.

## 13. Refund Policy

### Normal Product Refund Policy

For one correctly created initial Product charge of `JPY 980`, the initial MVP Product refund is either `JPY 0` or `full JPY 980`. There is no Customer-facing partial-refund Product policy for that initial Product purchase.

Before Payment, cancellation costs `JPY 0` because no charge has occurred. After successful Payment but before generation starts, the accepted policy direction permits a full `JPY 980` cancellation/refund only where the future server-authoritative system can objectively prove that the request arrived before `generation_started`. Exact state-machine, Provider execution, operational, evidence-retention, and legally compliant public-wording details remain downstream-gated.

Normal Product full-refund candidates include:

- paid service that cannot be delivered after bounded recovery;
- objective major Product defect, including empty output, clear truncation, another consultation mixed in, or internal-error-only/non-product output.

The following are normally insufficient by themselves when a conforming assessment was delivered:

- the Customer dislikes the conclusion;
- the conclusion is to wait or not send;
- the hoped-for answer was absent;
- the partner later reacted differently;
- the Customer changed their mind after normal delivery.

### Payment Integrity Remediation

A P0 monetary defect is not constrained by the normal Product refund amount. Examples include:

- a duplicate successful charge;
- a wrong amount;
- a wrong Customer;
- a wrong Request;
- a charge created through invalid purchase authority or a Safety-authority bypass.

Moon Reply must remediate the actual affected or unintended economic amount. A Customer must not remain responsible for more than the intended legitimate `JPY 980` purchase because of a Moon Reply Payment Integrity defect. In particular, remediation of a wrong-amount transaction is not capped at `JPY 980` merely because the normal Product price is `JPY 980`.

Refunding an unintended or excess amount for a Payment Integrity Incident is not the same concept as offering a normal partial Product refund. Exact correction, refund, reversal, and confirmation mechanics remain Provider-specific and evidence-gated; this Charter does not invent the operation.

This Product policy does not eliminate or waive non-waivable Customer rights. Material unresolved legal obligations remain blockers.

Refund Decision Authority and Refund Execution Authority are separate. Moon Reply Refund Decision Authority remains server/operator controlled under this accepted policy; implementation and execution authority remain absent.

Where the selected Provider supports merchant-initiated refund execution, any Moon Reply-initiated refund command must be server-side and must never be browser/client authorized. Provider- or Store-initiated refunds, reversals, disputes, or equivalent external financial changes may occur outside a Moon Reply refund command. Those external events must be authenticated or otherwise authoritatively verified, normalized, and reconciled.

Browser/client state is never refund authority, and duplicate processing must remain idempotent. An attempted Moon Reply API command does not by itself establish refund completion. Exact Stripe, PAY.JP, Apple, Google, and RevenueCat refund mechanics and final confirmation semantics remain evidence-gated. This Charter does not assume that every future platform permits Moon Reply to execute refunds directly.

## 14. Dispute and Chargeback

Refund and dispute/chargeback are separate state domains.

- A dispute must never silently or automatically recharge the Customer.
- An open dispute alone must not label a Customer fraudulent.
- Refund and dispute states must be reconciled to prevent duplicate economic reversals.

Provider dispute events, evidence requirements, deadlines, and chargeback mechanics remain Provider-specific and evidence-gated.

## 15. Purchase Ledger, Settlement, and Accounting Boundary

A Purchase record or Provider dashboard alone is insufficient for Moon Reply Product operations.

### Purchase Ledger

Owns Product/Payment-integrity and entitlement facts.

### Settlement Ledger

Owns Provider fees, refunds, settlement batches, and payout facts.

### Accounting and Tax Layer

Owns accounting software, filing, and tax operations derived from recorded facts.

Preserve separate timestamps where relevant:

- `purchased_at`;
- `payment_succeeded_at`;
- `fulfilled_at`;
- `refunded_at`;
- `provider_settled_at`;
- `payout_at`.

These timestamps do not represent the same event. `payment_succeeded_at` is not automatically accounting or tax revenue-recognition authority.

Do not hard-code Stripe or PAY.JP fee rates, PayPay rates, tax rates, Apple commission, Google service fees, or settlement timing. RevenueCat is not accounting, tax, or settlement authority. Settlement and payout may aggregate many Purchases and must not be modeled as a mandatory single `purchase -> payout_id` relationship. Accounting classification must never change Assessment Grant or Product-entitlement behavior.

## 16. Reconciliation

Moon Reply must regularly reconcile internal Purchase, Refund, and Product state against Provider financial evidence.

Core anomalies include:

- Provider success `> 1` for the same Purchase Intent;
- Provider success `1` and Moon Reply Purchase `0`;
- Provider success `0` and local Purchase marked paid;
- Grant `> 1` for one legitimate Purchase;
- Purchase `> 1` for one intended purchase;
- amount or currency mismatch;
- Customer or Request mismatch;
- refund mismatch;
- Provider Payment exists but local Payment Attempt identity is missing;
- unresolved unknown states;
- test/production mismatch.

The Provider is authoritative for the external financial transaction it processed. Moon Reply is authoritative for Product identity, Request linkage, Purchase normalization, Assessment Grant, and fulfillment. A conflict between those authorities is a reconciliation condition and must not be silently overwritten.

Unambiguous missing local state may later be recovered idempotently from authenticated Provider evidence only when identity, product, amount, currency, and environment linkages are complete and unique. Financial or identity conflicts must not be silently auto-repaired.

## 17. P0 Incident and Emergency Payment Kill Switch

Moon Reply must have a server-owned emergency ability to disable creation of **new economic charges** independently of existing Payment verification, webhook receipt, reconciliation, refund processing, already-paid fulfillment, and Customer support.

Activating the kill switch does not turn in-flight Payments into failures. In-flight Payments remain subject to verification and reconciliation.

Confirmed duplicate successful charge handling must include conceptually:

- P0 incident classification;
- affected Purchase lock;
- stop, or consideration of stopping, new Payment intake;
- evidence preservation;
- identification of the legitimate and excess successful charges;
- full refund of the excess charge;
- refund confirmation and reconciliation;
- affected-period reconciliation;
- root-cause analysis;
- corrective action and regression verification;
- explicit reauthorization before normal Payment intake resumes.

No automatic traffic threshold is defined here. P0 reopening must not occur merely because time elapsed.

## 18. Secret Ownership, Logging, and Redaction

Privileged Payment credentials are server-owned. They must never be exposed to a browser/client bundle, HTML, URL/query, local/session storage, analytics, repository, documentation, screenshots, ordinary logs, or Customer-facing errors.

Separate credentials by purpose and environment:

- Payment API secret;
- webhook verification secret;
- internal signing/token secret;
- test credentials;
- production credentials.

Do not intentionally persist or log raw card numbers, CVC, or equivalent raw Payment credentials. Ordinary Payment logs use an allowlist of safe structured operational identifiers and states. Consultation text and partner-message content do not belong in ordinary Payment logs.

Provider transaction identifiers needed for reconciliation or refund may be retained in controlled ledgers even when omitted from ordinary logs. Secret rotation never creates a Purchase Intent, Payment Attempt, or idempotency identity and never justifies retrying an unknown charge.

Suspected production Payment credential compromise is a Payment Security Incident and kill-switch candidate. Secret values are never written to audit history; non-secret credential or policy version identifiers may be retained. Provider-specific rotation behavior remains evidence-gated.

## 19. Privacy Incident Linkage

A serious Privacy/Data incident may also stop new paid intake. Examples include:

- Result URLs broadly exposed;
- consultation content leaking into Payment logs;
- systemic misdelivery of assessment emails;
- prohibited direct identifiers sent to an external service contrary to approved policy.

This Charter does not hard-code legal reporting deadlines. Current-source privacy and legal incident procedures are a production/publication responsibility.

## 20. Production Authorization Hard Gate

`implementation complete != production payment authorized`

Production Payment is disabled by default. Real Customer charges require separate Production authorization after evidence has been completed for:

- Payment Integrity;
- Safety-before-payment;
- Provider formal approval and selection;
- final Customer purchase terms;
- Refund and recovery operations;
- reconciliation;
- kill switch;
- secrets and logging;
- Privacy and data flow;
- legal and public consumer disclosures;
- operator and support information;
- rights and IP;
- production environment separation;
- end-to-end and failure QA.

Deployment itself does not authorize real Payment. A P0 Payment Incident or material Privacy Incident requires explicit reauthorization after safe resolution.

## 21. Legal and Privacy Release Rule

Human decision dated `2026-08-11`: professional, lawyer, tax-professional, privacy-professional, or other specialist review is **optional**. It is not a mandatory Payment Charter acceptance condition, Paid Launch condition, or Production Payment authorization condition.

Required review instead consists of current official primary legal/regulatory sources, actual Product behavior, final public wording, and actual Provider terms/evidence. The reviewed evidence must be preserved. Applicable Human/operator decisions must be completed, and any materially unresolved legal obligation remains a hard blocker.

Internal or current-source review does not guarantee legal compliance. Professional consultation remains an optional escalation path, not a prerequisite.

Downstream review-only legal UI synchronization is a separate, currently unauthorized implementation follow-up before public paid release.

## 22. Rights and IP Production Gate

The future Production-readiness process must include an evidence-backed rights review for publicly used material. Track conceptually:

- asset and source;
- owner or creator;
- license;
- commercial-use permission;
- modification permission;
- attribution requirement;
- evidence location and status.

Public paid release must not rely on an asset with unknown commercial-use rights. J-PlatPat/trademark screening remains a paid-launch preparation requirement. This Charter claims neither trademark clearance nor registration and does not create a Rights Register implementation.

## 23. Provider Evidence Required Before Binding Implementation

The accepted evidence-preparation package defines three non-substitutable lanes:

- Lane A / `STRIPE-FEAS-001`: preliminary category clarification only;
- Lane B / `STRIPE-ACCOUNT-001`: actual account/business/site/category/Live Payment review; and
- Lane C / `STRIPE-PAYPAY-001`: PayPay-specific onboarding review.

Lane A alone is not sufficient for Stripe approval or formal Provider selection. Lane C cannot inherit Lane B approval automatically. All three outcomes are currently `null`, and this lane synchronization changes no Charter invariant.

The following Provider-specific facts remain unresolved and must not be inferred:

- actual Stripe account/business/site/category and Live Payment outcome;
- cards, Apple Pay, Google Pay, and PayPay eligibility and conditions;
- authoritative Payment object, exact success state, fields, and object relationships;
- create-versus-refetch authority and authentication/capture semantics;
- Payment API idempotency behavior;
- webhook authentication/signature, event IDs/types, retry behavior, and ordering;
- metadata and Customer/Purchase/Request linkage capability;
- refund API, confirmation, dispute, and chargeback behavior;
- statement descriptor behavior;
- Provider fees, taxes, reserves, holds, settlement, and payout timing;
- test/live separation; and
- future RevenueCat import and identity behavior where used.

## 24. Accepted Policy Direction and Production Decisions Still Unresolved

### Accepted pre-generation cancellation direction

Customer-initiated cancellation/refund after successful Payment but before generation starts is accepted as a full `JPY 980` refund only when the future system can objectively prove the request preceded `generation_started`. This is a policy direction, not an implemented state, Provider capability, public promise, or legal conclusion. B2 and later implementation/Provider work must align final Customer-facing terms, current official-source consumer-law review, actual fulfillment timing, evidence, and execution mechanics. No concrete time-based cancellation deadline is invented.

### Production-measurement decisions

The following remain unresolved until implementation and QA evidence exists:

- exact Fulfillment retry count;
- exact recovery time budget;
- exact unknown-state escalation time;
- automatic kill-switch thresholds;
- exact reconciliation cadence;
- exact trusted-session lifetime, refresh behavior, and revocation implementation;
- Result-access credential lifetime;
- specific retention periods;
- exact Customer-support identity recovery when a verified email is lost.

No number is invented by this Charter.

## 25. Authorization Matrix

| Area | Current authority/status |
| --- | --- |
| Long-term strategy | Agreed |
| Safety Engine / Safety UX | Current explicit Human decision accepted |
| Payment Charter v1 Candidate | Historical lineage: `7aeb9ecbc5a786b895f9280112f13b0629730429`, corrected by `b6f38586fadd2a17034810dbb139465af5eade2f` |
| Payment Charter v1 | `human_chatgpt_accepted_complete` on `2026-08-12` |
| Delivery/Recovery Email Verification | `accepted_required_control_with_trusted_session_reuse` |
| Professional review | Optional escalation; not completed; not a hard launch gate |
| Current-source legal/Privacy/Customer-rights review | Required; unresolved material obligations remain blockers |
| Stripe strategic direction | `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete` on `2026-08-12`; Product/strategy authority only |
| Stripe Feasibility Evidence Preparation | `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete` on `2026-08-12`; preparation authority only |
| Stripe Lane B Human Decision Package | `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete` on `2026-08-13`; seven decisions accepted; B2 Candidate ready pending review; Production enforcement/evidence pending |
| Stripe Lane A / B / C | `preparation_human_approved` / blocked / blocked; external action not authorized; not submitted; outcomes `null` |
| Stripe feasibility / account / contact / approval / activation | Not established / absent / none / absent / absent |
| Stripe formal selection | Incomplete |
| Cards / Apple Pay / Google Pay | Unverified |
| PayPay | Desired; Unverified; Not enabled; Not approved; lifecycle `not_frozen_recheck_required`; goods type unresolved pending actual onboarding evidence and Human review |
| `AGE-GATE-001` | Human direction accepted / downstream specification and legal alignment pending; Lane B/C remain blocked |
| Current next work | Human + ChatGPT review of Stripe Lane B Legal Draft Finalization Candidate (B2); Candidate not accepted; B3 inactive |
| PAY.JP | Paused fallback; Not approved; Not selected |
| Payment implementation | Unauthorized |
| Payment DB / migration | Unauthorized |
| Payment Provider calls | Unauthorized |
| Moon Reply-initiated refund command | Unimplemented and unauthorized; Provider/Store mechanics remain evidence-gated |
| Production Payment | Unauthorized |
| RevenueCat initial Web / future synchronization | Not required and unconfigured / desired and unresolved; implementation unauthorized |
| Apple IAP | Unauthorized |
| Google Play Billing | Unauthorized |
| Runtime / LUNA changes | Unauthorized |
| Downstream review-only legal UI synchronization | Separate follow-up; unauthorized |
| PR / main merge / release | Unauthorized |
