# M2-P4 V1-A2 Clarification Integration — Review Packet

## Review disposition

- Authority: accepted V1-A2 R1 plan `9f397ed41f3f284e7a984ad139768af16373a747`.
- Implementation status: `implemented_pending_human_chatgpt_review`.
- Exact scope: `37/37` — 14 UPDATE + 23 NEW; DELETE / RENAME 0.
- V1-A1: `accepted_complete` and immutable.
- V1-B / V1-C / V1-D: unauthorized and not implemented.
- R2-C: `remediation_required`; `experienceProductJudgment=pending_remediation`; `jpy980RuntimeReadiness=not_established`; `globalQ0Completion=false`.

## Customer and Product-scope boundary

The initial API and Application entry point consume the same deterministic Product-scope validator. At least one of `decide_send_or_wait`, `draft_message`, `message_impact`, or `next_three_days` is required. `relationship` and `organize_emotions` are supplementary-only. `message_impact` independently requires a non-empty Candidate; `draft_message` does not. These failures occur before request creation, Provider work, or clarification-budget consumption.

Normal initial routing is Safety-first, then V1-A1-compatible Policy V2:

1. `full_paid_ready_candidate` continues to PB-04/05/06.
2. `needs_one_clarifying_answer` atomically completes the initial run, persists one pending clarification, and transitions the request to `awaiting_clarification` with no Report or generated draft.
3. `not_full_product_candidate` is a completed normal no-charge stop.
4. non-normal Safety is a completed Safety stop.

## Clarification authority and answer validation

Clarification Evidence retains schema version, opaque ID, ordinal 1, question code, target, immutable question snapshot, validated answer, `user_clarification` provenance, `clarification:<opaque_id>:answer:1` source identity, normalized grounding, fingerprint, and attributable Safety. It never enters `currentSituation`, Base source references, Candidate, or a fabricated Fact ID.

The default capability uses 32 cryptographically secure random bytes (256 bits before encoding); request ID is never accepted as continuation authority. Target-specific validation supports all six accepted targets. Canonical fingerprinting normalizes only bounded structure, line endings, outer whitespace, and key order. For local timing, the fingerprint covers the user authority while elapsed time is derived separately from the trusted resume-run start and explicit IANA timezone.

## Same-request lifecycle and idempotency

Initial `needs_more_information` finalization and answer acceptance are transaction/RPC boundaries. Answer acceptance locks the clarification and request, persists the first answer, changes `awaiting_clarification → processing`, and creates exactly one `clarification_resume` run. A duplicate canonical fingerprint creates no run and replays the persisted continuation/result. A different fingerprint fails under `M2_CLARIFICATION_ALREADY_ANSWERED` with HTTP 409. Resume can finish ready, not-full, Safety, or technical failure; it never returns to awaiting and never creates a second clarification.

Lost initial responses are recovered by the original idempotency key: an awaiting request returns the same persisted Delivery V2 clarification ID and question snapshot without another request, run, or Provider call.

## Effective authority and downstream consumption

`EffectiveAssessmentAuthorityV1` is Application-owned derived authority, not a source of new facts. It composes immutable Base, Candidate, and optional target-limited Clarification while retaining each effective value's lane, source reference, source path, and clarification target. Known Base override, Candidate contamination, duplicate origin, unrelated-target mutation, and false Base attribution fail closed.

Target consumption is explicit:

| Target | V1-A / Effective Decision | PB-04 | PB-05 | PB-06 |
|---|---|---|---|---|
| material concern | materiality/scope | action context when relevant | Product understanding | provenance/fidelity |
| latest timing | effective timing | decision/reassessment | factual/uncertainty context | provenance/fidelity |
| usual cadence | effective cadence | decision/reassessment | factual/uncertainty context | provenance/fidelity |
| central concern | emotional sufficiency | rationale only when relevant | exact user concern for containment | no invented fear |
| relationship intent | user intent | action/draft rationale | relevant Product context | no other-person intent |
| requested tone | writing sufficiency | draft/edit rationale | draft context | tone authority fidelity |

`EffectiveDecisionPolicyV1` preserves current policy behavior without clarification and records consumed effective paths. PB-04, PB-05, and PB-06 receive explicit `clarification_consumption_contract` inputs. If clarification established ready but no materially relevant downstream path remains, Application integrity fails with `M2_CLARIFICATION_DOWNSTREAM_DISCARDED`; missing authority fails with `M2_CLARIFICATION_DOWNSTREAM_AUTHORITY_MISSING`.

PB-05 changes only authority availability. This slice does not add semantic-depth sections, alternatives, emotional prose architecture, generic expansion, or repetition doctrine; those remain V1-B/V1-C work.

## Resume reuse and stage counts

Resume reuses immutable initial Base grounding, Candidate lane/analysis, Base Safety, Candidate Safety, and original request input. It does not rerun PB-01C, PB-02, or PB-03.

- Initial ready without Candidate: Provider-stage IDs PB-01, PB-02, PB-03, PB-04, PB-05, PB-06; PB-01C is a deterministic `candidate_absent` skip.
- Initial one-gap with Candidate: PB-01, PB-01C, PB-02, PB-03; PB-04/05/06 are not invoked.
- Ready resume: PB-01, PB-04, PB-05, PB-06; PB-01C/PB-02/PB-03 are deterministic `reused_initial_authority` skips.
- Not-full or Safety resume: PB-01 only, followed by terminal routing; no Product stages.

Offline fake transport records `actualProviderCalls=0`; stage invocation lists are deterministic simulated evidence, not live Provider execution.

## Persistence, API, delivery, and UI

Migration `0006_m2_p4_jpy980_clarification_lifecycle.sql` is created but not applied. It adds request awaiting state, run kind/result authority, four run eligibilities, skip provenance, exactly one clarification per request, immutable question authority, fingerprint constraints, and transactional finalization/answer/failure functions.

Delivery V2 exposes exactly ready/completed, needs-more/awaiting, not-full/stopped, and Safety/stopped. Needs-more exposes only opaque clarification ID, bounded question metadata/copy, and `1 / 0 / 1` budget truth. It does not expose request/run IDs, Fact IDs, Provider IDs, source identity, or internal details.

The answer endpoint accepts only `{ "answer": ... }` at the opaque-ID URL and loads question/target/request authority server-side. The form implements preflight Product-scope feedback, one accessible target-specific control, visible one-question truth, keyboard operation, disabled/submission/error states, mobile/200% zoom-safe wrapping, reduced-motion handling, and customer-safe not-full/Safety no-charge copy. There is no second-question UI.

## Offline acceptance evidence

The machine-readable fixture set contains 28 cases covering the required 25 behaviors plus cadence alignment, no-second-question, and explicit atomic lifecycle evidence. It includes initial/retry/resume stage counts, same/different-answer behavior, capability construction, target isolation, no-clarification parity, malformed fail-close, deterministic repeat, and downstream-discard failure.

Provider / DB / Supabase / migration apply / Payment / deploy operations during this Task are `0 / 0 / 0 / 0 / 0 / 0`.

## Human review request

Confirm only V1-A2 implementation correctness and boundary fidelity. Do not infer V1-B/C/D completion, R2-C PASS, JPY980 Runtime readiness, Production Runtime activation, Payment readiness, Provider quality, deploy readiness, main integration, or Global Q0 completion from this packet.
