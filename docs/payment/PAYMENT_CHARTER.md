# Payment Charter v1 Candidate

## 1. Status and Authority

- Candidate formulation date: `2026-08-11`
- Status: `payment_charter_v1_candidate_ready_pending_human_chatgpt_review`
- Human + ChatGPT acceptance: pending
- Implementation authority: `false`
- Canonical strategy: `PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`
- Provider-specific facts and approval remain separately evidence-gated.

This Candidate formulates a provider-independent Payment and Product-integrity contract for review. It creates no API, SDK, checkout, webhook, schema, migration, Provider call, Runtime/LUNA change, production authorization, PR, main merge, or release authority.

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
| PAY.JP merchant/category approval | Not established |
| Formal Provider evidence-gate selection | Not completed |
| Payment API / SDK / checkout / webhook implementation | `0` |
| DB / Supabase / migration operations authorized | `0` |
| Runtime / LUNA changes authorized | `0` |
| Provider calls authorized by this task | `0` |
| RevenueCat / Apple IAP / Google Play implementation | Unauthorized |
| PR / main merge / release | Unauthorized |

The next action is `Human + ChatGPT integrated review of Payment Charter v1 Candidate`.

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
→ `final purchase terms`
→ `Purchase Intent`
→ `Payment`

Browser state is never purchase authority. Any mutation of Safety-bound input that invalidates current purchase eligibility invalidates stale purchase authority. A prior Payment must never be silently reassigned to materially changed consultation content.

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

All success paths converge on one server-controlled verification procedure. This Candidate does not define PAY.JP objects, statuses, fields, webhook events, fetch semantics, metadata, authentication/capture semantics, or signatures as facts.

## 7. Unknown Is Not Failure

The invariant is:

`unknown != failed`

If Moon Reply cannot determine whether an external charge succeeded:

- do not create another charge;
- do not ask the Customer to pay again;
- retain and reconcile the existing Payment identity;
- allow only server-controlled verification or reconciliation;
- resume repurchase or retry only after failure or cancellation-without-charge is authoritatively established.

Customer recovery guidance must state that another payment is not required while the original status remains unresolved. No exact unknown-state timeout is set by this Candidate.

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

These outcomes must not create another Payment, Purchase, Grant, Logical Assessment, or canonical Report. This Candidate does not invent exact terminal-state names that have not yet been decided.

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

This Candidate does not select an exact Result-token implementation or expiry.

## 12. Delivery Email Ownership Verification

Status: `proposed_required_control_pending_human_decision`

Strong proposed direction: before a real Payment is created in the initial no-login Web MVP, Moon Reply should verify that the Customer controls the delivery/recovery email mailbox and bind that verified delivery address to the Purchase Intent.

Rationale:

- reduce typo-based disclosure of highly private relationship assessment content;
- create a reliable no-login Customer recovery channel;
- prevent Support from treating knowledge of an email address as identity.

This control is **not Human Accepted**. It is the prominent unresolved Product/Privacy decision in this Candidate, and the exact verification mechanism is not selected.

## 13. Refund Policy

### Normal Product Refund Policy

For one correctly created initial Product charge of `JPY 980`, the initial MVP Product refund is either `JPY 0` or `full JPY 980`. There is no Customer-facing partial-refund Product policy for that initial Product purchase.

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

Refunding an unintended or excess amount for a Payment Integrity Incident is not the same concept as offering a normal partial Product refund. Exact correction, refund, reversal, and confirmation mechanics remain Provider-specific and evidence-gated; this Candidate does not invent the operation.

This Product policy does not eliminate or waive non-waivable Customer rights. Material unresolved legal obligations remain blockers.

Refund Decision Authority and Refund Execution Authority are separate. Moon Reply Refund Decision Authority must remain server/operator controlled under any accepted policy; this Candidate is not that acceptance.

Where the selected Provider supports merchant-initiated refund execution, any Moon Reply-initiated refund command must be server-side and must never be browser/client authorized. Provider- or Store-initiated refunds, reversals, disputes, or equivalent external financial changes may occur outside a Moon Reply refund command. Those external events must be authenticated or otherwise authoritatively verified, normalized, and reconciled.

Browser/client state is never refund authority, and duplicate processing must remain idempotent. An attempted Moon Reply API command does not by itself establish refund completion. Exact PAY.JP, Apple, Google, and RevenueCat refund mechanics and final confirmation semantics remain evidence-gated. This Candidate does not assume that every future platform permits Moon Reply to execute refunds directly.

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

Do not hard-code PAY.JP fee rates, tax rates, Apple commission, Google service fees, or settlement timing. RevenueCat is not accounting, tax, or settlement authority. Settlement and payout may aggregate many Purchases and must not be modeled as a mandatory single `purchase -> payout_id` relationship. Accounting classification must never change Assessment Grant or Product-entitlement behavior.

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

This Candidate does not hard-code legal reporting deadlines. Current-source privacy and legal incident procedures are a production/publication responsibility.

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

Public paid release must not rely on an asset with unknown commercial-use rights. J-PlatPat/trademark screening remains a paid-launch preparation requirement. This Candidate claims neither trademark clearance nor registration and does not create a Rights Register implementation.

## 23. Provider Evidence Required Before Binding Implementation

The following remain unresolved and must not be inferred:

- PAY.JP authoritative Payment object;
- exact success state and fields;
- create-versus-refetch authority;
- authentication/capture semantics;
- Payment API idempotency behavior;
- webhook authentication/signature;
- webhook event IDs and types;
- callback retry behavior;
- metadata capability;
- refund API and confirmation behavior;
- dispute/chargeback semantics;
- Provider fees;
- Provider tax treatment;
- settlement/payout reports and timing;
- Apple Pay-specific behavior.

## 24. Production and Product Decisions Still Unresolved

### Product decision required before Paid Launch

Customer-initiated cancellation or refund after successful Payment but before generation or fulfillment completion is currently unresolved. It must be decided before Paid Launch and must be consistent with final Customer-facing terms, current official-source consumer-law review, actual fulfillment timing, and selected Provider evidence. This Candidate invents neither a cancellation deadline nor a Provider capability.

### Production-measurement decisions

The following remain unresolved until implementation and QA evidence exists:

- exact Fulfillment retry count;
- exact recovery time budget;
- exact unknown-state escalation time;
- automatic kill-switch thresholds;
- exact reconciliation cadence;
- Result-access credential lifetime;
- specific retention periods;
- exact Customer-support identity recovery when a verified email is lost.

No number is invented by this Candidate.

## 25. Authorization Matrix

| Area | Current authority/status |
| --- | --- |
| Long-term strategy | Agreed |
| Safety Engine / Safety UX | Current explicit Human decision accepted |
| Payment Charter v1 Candidate | Formulated; pending Human + ChatGPT review |
| Payment Charter v1 | **NOT accepted** |
| Delivery-email mailbox verification | `proposed_required_control_pending_human_decision` |
| Professional review | Optional escalation; not completed; not a hard launch gate |
| Current-source legal/Privacy/Customer-rights review | Required; unresolved material obligations remain blockers |
| PAY.JP written category evidence | Not established |
| PAY.JP formal selection | Incomplete |
| Payment implementation | Unauthorized |
| Payment DB / migration | Unauthorized |
| Payment Provider calls | Unauthorized |
| Moon Reply-initiated refund command | Unimplemented and unauthorized; Provider/Store mechanics remain evidence-gated |
| Production Payment | Unauthorized |
| RevenueCat | Unauthorized |
| Apple IAP | Unauthorized |
| Google Play Billing | Unauthorized |
| Runtime / LUNA changes | Unauthorized |
| Downstream review-only legal UI synchronization | Separate follow-up; unauthorized |
| PR / main merge / release | Unauthorized |
