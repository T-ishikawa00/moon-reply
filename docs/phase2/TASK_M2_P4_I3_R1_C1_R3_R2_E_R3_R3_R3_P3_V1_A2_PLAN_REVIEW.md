# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2 Clarification Integration Architecture Plan Review

## Status and authority

- Status: `planning_defined_pending_human_chatgpt_review`
- Branch: `plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-clarification-integration`
- Exact parent / accepted V1-A1 snapshot: `8db5c6386ed0b9b16f0d1586f47d384262cc502b`
- Original V1-A1: `65c245860813f6179689855b344dbf6fd425867a`
- JPY980 architecture: `cfad0bd4ca3fd2304b00d072624e624f98c09b29`
- main / origin/main: `61e33a10e195fad17e253a6b9719217e1992f273`
- Acceptance date: `2026-08-16`

V1-A1 ChatGPT review and Human review are `PASS / complete`; Human acceptance and V1-A1 acceptance are complete. V1-A1 is `accepted_complete`. V1-A overall remains incomplete.

Only V1-A2 planning is authorized. V1-A2 implementation remains unauthorized until this plan is reviewed and accepted. V1-B, V1-C, V1-D, Provider execution, Production Runtime, Payment, and main integration remain unauthorized.

## Architecture decision

The connection must preserve three independent authorities:

1. Base — immutable original consultation input.
2. Candidate — immutable optional unsent candidate message.
3. Clarification Evidence — the single answer to the single authorized clarification.

Clarification Evidence is not a patch to Base. It may not be appended to `currentSituation`, projected as `input:current_situation`, inserted into existing Base source refs, or copied into Candidate. Its provenance is `user_clarification`, with a clarification-owned source identity such as `clarification:<opaque_clarification_id>:answer:1`.

The versioned Clarification Evidence contract retains its schema version, opaque clarification ID, ordinal `1`, question code, target, immutable question snapshot, user answer, provenance, source identity, target-limited grounded normalized representation, and clarification-attributable Safety signals. Provider metadata is not part of customer delivery.

## PB-01 successor without a new Provider stage

No PB-01F or other Provider stage is added. A future v12 successor continues to use stage ID `PB-01`.

- Initial run: PB-01 receives original Base input with `clarification_evidence=null` and establishes Base grounding.
- One-gap result: execution stops before Product generation and persists one pending clarification.
- Resume run: a second run is created for the same assessment request. PB-01 receives the original Base input, the immutable initial Base grounding, and the separate Clarification Evidence.
- Resume ownership: PB-01 may ground only the clarification lane. It may not rewrite the initial Base grounding. The Application composes the immutable Base grounding, clarification grounding, and separate PB-01C Candidate lane.

Current PB-01 Base schema cannot represent this provenance truthfully. Therefore a clarification-aware PB-01 Prompt, output Schema, and v12 Catalog successor are required in future A2 implementation. This is a successor contract under the same stage ID, not a new stage and not authority to execute a Provider.

Structural source-integrity validation must enforce lane ownership. Raw-literal comparison is not provenance proof. Clarification grounding can fill only the selected target dimension and cannot write unrelated Base, Candidate, or decision fields.

## Same-consultation lifecycle

The persistence model is:

`one assessment_request + zero or one assessment_clarification + one or more assessment_runs`

Future request states are:

- `processing`
- `awaiting_clarification`
- `completed`
- `failed`

A separate `assessment_clarifications` table is required; `raw_situation` remains immutable. There is at most one clarification row per request, enforced by a unique request constraint and ordinal `1`. The record holds the stable opaque ID, request link, question authority, provenance/source identity, pending/answered status, answer/fingerprint, grounding/Safety evidence, and timestamps.

The customer continues with the opaque clarification ID, not a raw request ID as the only authority. The answer endpoint does not accept a client-selected request ID, question code, or target.

Answer acceptance is transactional and idempotent:

- pending + first valid answer: accept exactly once;
- answered + same canonical answer: replay the existing continuation or result without a new answer or run;
- answered + different answer: fail closed with `M2_CLARIFICATION_ALREADY_ANSWERED` and HTTP 409.

No second clarification row, second answer, automatic second question, or clarification loop is allowed.

## Run and Safety semantics

An initially sufficient consultation proceeds normally from `full_paid_ready_candidate`.

An initial one-gap consultation maps to Runtime `needs_more_information`, persists the pending clarification, sets the request to `awaiting_clarification`, and returns no Report, generated draft, or Payment-capable state.

After answer acceptance, the second run on the same request has an exhausted clarification budget. Its only policy outcomes are:

- sufficient → ready path;
- still insufficient or non-material → `not_full_product_candidate`;
- non-normal Safety → `safety_blocked`.

Clarification Safety keeps clarification provenance and is aggregated with Base and Candidate Safety before paid Product eligibility. It cannot weaken or reinterpret an existing Safety result.

Accepted V1-A1 remains immutable. A future `jpy980-input-sufficiency-policy-v2.ts` adapter must deep-equal V1 on inputs without clarification and consume the separate, target-limited clarification grounding on resume. It must not synthesize a mutated Base object. With `clarificationAlreadyUsed=true`, a second question remains unreachable.

## First-class not-full state

`not_full_product_candidate` is a normal, non-paid Application outcome. It must not be represented as `needs_more_information`, technical failure, `safety_blocked`, or `ready`.

Its fixed successor semantics are:

- Runtime result: `status=stopped`, `eligibility=not_full_product_candidate`;
- clarification, Report, and draft: `null`;
- assessment run: `completed` with first-class eligibility;
- assessment request: `completed`;
- Customer Delivery: stopped, customer-safe reason allowed, no internal Fact or Provider IDs;
- charge: prohibited.

The future migration must widen request status for `awaiting_clarification`, widen run eligibility for `not_full_product_candidate`, and create the clarification table. It must not mutate raw consultation input.

## Candidate-required message impact

If `requestedTopics` contains `message_impact`, a non-empty Candidate message is required before the request is accepted into Product evaluation.

- Server and UI both enforce the rule.
- Server safe code: `M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED`.
- Classification: input/form validation, not paid-quality clarification.
- No assessment request, Provider call, or clarification-budget consumption occurs.
- `draft_message` does not require a Candidate.
- Candidate present but analysis unavailable is a technical fail-closed result, not Product ineligibility.
- Candidate Safety remains higher priority once Candidate processing begins.

## Actionable versus supplementary topics

The exact actionable anchor set is:

- `decide_send_or_wait`
- `draft_message`
- `message_impact`
- `next_three_days`

The exact supplementary-only set is:

- `relationship`
- `organize_emotions`

A Full JPY980 consultation requires at least one actionable anchor. Supplementary topics may enrich an anchored consultation but cannot establish current MVP eligibility alone.

Supplementary-only submission fails cheap Product-scope validation with `M2_ACTIONABLE_TOPIC_REQUIRED`. It creates no assessment request, calls no Provider, consumes no clarification budget, creates no Report, and cannot charge. A relationship-only or emotional-only Product is outside the current MVP and requires a separate future Human decision.

## Clarification target boundary

All six V1-A1 targets are retained. Every normalized result stays within its selected target.

| Target | Allowed answer shape | May ground | Must not ground |
| --- | --- | --- | --- |
| `material_relationship_or_communication_concern` | one bounded choice plus optional detail | explicit material concern or explicit no-concern | relationship facts, inner state, outcome |
| `latest_contact_timing` | local datetime, bounded elapsed bucket, or unknown | user-supplied timing | invented chronology, future timing |
| `usual_reply_cadence` | `within_usual`, `beyond_usual`, or `unknown` | bounded cadence relation | invented exact interval, reply prediction |
| `central_fear_or_decision_concern` | bounded text or explicit none | exact user-stated concern and emotional-context presence | unstated fear, inner state, outcome |
| `relationship_intent` | bounded direction choice plus optional detail | user-stated desired direction | the other person's intent, outcome, mutated Base goal |
| `requested_message_tone` | bounded tone/register choice plus optional detail | requested writing direction | Candidate rewrite/analysis, other person's preference |

Elapsed-time derivation uses trusted `runContext.startedAt` and an explicit IANA timezone. Clarification prose is never regex-routed. Any free-text detail is grounded and Safety-evaluated under clarification provenance.

## Customer/API contract

CustomerAssessmentDeliveryV2 supports:

- `ready` → `completed`;
- `needs_more_information` → `awaiting_clarification`;
- `not_full_product_candidate` → `stopped`;
- `safety_blocked` → `stopped`.

`needs_more_information` returns only bounded UI authority: opaque clarification ID, question code, target, customer-safe question, maximum one question, questions used, and questions remaining. It exposes no internal Fact or Provider IDs.

The original initial POST body is immutable after request creation. Clarification submission uses a separate endpoint:

`POST /api/internal/assessment-clarifications/[clarificationId]/answer`

The endpoint loads question/target/request authority server-side, persists the answer exactly once, and starts the second run on the same request.

## Payment boundary

This plan implements and authorizes no Payment work. There is no charge in `needs_more_information`, `not_full_product_candidate`, or `safety_blocked`. Only a future full-paid-ready state may reach a separately authorized Payment gate.

## Future implementation package

Future V1-A2 implementation is fixed at `31/31`: 14 UPDATE + 17 NEW, DELETE / RENAME 0. It remains unauthorized. The machine-readable exact list is in `integration-contract-v1.json`.

The package owns types; Clarification Evidence/Grounding; target-limited source integrity; PB-01 successor Prompt/Schema/Catalog; V1-A1-compatible policy V2; Product-scope validation; pipeline; Application/service; repository/fake; migration; result normalization; Customer Delivery V2; initial and answer APIs; clarification UI/styles; offline fixtures/results/verifier; and review/authority synchronization.

It expressly excludes PB-05 semantic depth, Product note work, semantic disposition, Product re-review, Payment, Provider execution, Production Runtime activation, and main integration. Any future path change is a STOP and requires a new Human review; it is not an implicit scope expansion.

## Current closed authority

- V1-A1: `accepted_complete`
- V1-A2: `planning_defined_pending_review`; `implementation_authorized=false`
- V1-B/C/D: unauthorized
- R2-C: `remediation_required`
- experienceProductJudgment: `pending_remediation`
- jpy980RuntimeReadiness: `not_established`
- globalQ0Completion=false
- Provider / DB / Supabase operations: `0 / 0 / 0`
- Product/Runtime/API/UI/DB/Prompt/Schema/Catalog/Provider/PB-05/semantic/Payment changes: `0`

This planning result is not V1-A2 implementation, Runtime readiness, Payment readiness, R2-C PASS, or Global Q0 completion.

## Planning scope and review gate

This Task changes exactly `10/10`: 6 UPDATE + 4 NEW, DELETE / RENAME 0. The V1-A1 accepted snapshot, current Runtime/Product blobs, `next-env.d.ts`, and main remain unchanged.

Next action: Human / ChatGPT review of this connection architecture. Do not begin V1-A2 implementation before explicit acceptance and implementation authorization.
