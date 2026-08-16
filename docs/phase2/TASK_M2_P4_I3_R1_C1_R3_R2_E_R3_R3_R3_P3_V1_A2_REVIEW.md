# M2-P4 V1-A2 Clarification Integration — Review Packet

## Review disposition

- Authority: accepted V1-A2 R1 plan `9f397ed41f3f284e7a984ad139768af16373a747`.
- Implementation review: `NEEDS_CORRECTION` with 1 BLOCKER / 5 MAJOR / 1 MINOR at `3195c278d688bc866d2e0825df88cdf62b149547`.
- Correction status: `r1_runtime_integrity_corrected_pending_human_chatgpt_review`.
- Preserved implementation scope: `37/37` — 14 UPDATE + 23 NEW; DELETE / RENAME 0. Exact correction scope: `23/23` UPDATE; NEW / DELETE / RENAME 0.
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

The default capability uses 32 cryptographically secure random bytes (256 bits before encoding); request ID is never accepted as continuation authority. Target-specific validation supports all six accepted targets. `central_fear_or_decision_concern` accepts only `{ "kind": "concern", "value": "..." }` or `{ "kind": "none" }`; explicit none is non-resolving and never creates a hidden fear. Canonical fingerprinting normalizes only bounded structure, line endings, outer whitespace, and key order. For local timing, the fingerprint covers the user authority while elapsed time is derived separately from the trusted resume-run start and explicit IANA timezone.

## Same-request lifecycle and idempotency

Initial `needs_more_information` finalization and answer acceptance are transaction/RPC boundaries. Answer acceptance locks the clarification and request, persists the first answer, changes `awaiting_clarification → processing`, and creates exactly one `clarification_resume` run. A duplicate canonical fingerprint creates no run and replays the persisted continuation/result. A different fingerprint fails under `M2_CLARIFICATION_ALREADY_ANSWERED` with HTTP 409. Resume can finish ready, not-full, Safety, or technical failure; it never returns to awaiting and never creates a second clarification.

Lost initial responses are recovered by the original idempotency key: an awaiting request returns the same persisted Delivery V2 clarification ID and question snapshot without another request, run, or Provider call.

## Effective authority and downstream consumption

`EffectiveAssessmentAuthorityV1` is Application-owned derived authority, not a source of new facts. Immutable Base and Candidate keep their accepted source-integrity contracts and authority references. `sourceMap` is limited to Clarification overlays and genuinely derived effective values; each overlay uses exact `clarification:<opaque_id>:answer:1` identity, resolves its `sourceValuePath` to a real Grounding value, deep-equals that value, and names only the selected target. Known Base override, Candidate contamination, duplicate origin, unrelated-target mutation, false Base attribution, nonexistent path, wrong source identity, and value mismatch fail closed.

Target consumption is explicit:

| Target | V1-A / Effective Decision | PB-04 | PB-05 | PB-06 |
|---|---|---|---|---|
| material concern | materiality/scope | action context when relevant | Product understanding | provenance/fidelity |
| latest timing | effective timing | decision/reassessment | factual/uncertainty context | provenance/fidelity |
| usual cadence | effective cadence | decision/reassessment | factual/uncertainty context | provenance/fidelity |
| central concern | emotional sufficiency | rationale only when relevant | exact user concern for containment | no invented fear |
| relationship intent | user intent | action/draft rationale | relevant Product context | no other-person intent |
| requested tone | writing sufficiency | draft/edit rationale | draft context | tone authority fidelity |

`EffectiveDecisionPolicyV1` preserves current policy behavior without clarification and records only values it actually consults. A bounded elapsed bucket remains in Effective Authority for PB-04/PB-05 and never becomes an invented exact Decision Fact or resolves the exact-minute unknown. A local datetime may populate exact elapsed minutes only from explicit IANA timezone plus trusted resume-run start. PB-04, PB-05, and PB-06 receive explicit `clarification_consumption_contract` inputs. If clarification established ready but no materially relevant downstream path remains, Application integrity fails with `M2_CLARIFICATION_DOWNSTREAM_DISCARDED`; missing authority fails with `M2_CLARIFICATION_DOWNSTREAM_AUTHORITY_MISSING`.

The offline A2 claim is deliberately narrow: it establishes correct authority injection, target-limited consumption contracts, target isolation, and fail-closed PB-06 validator plumbing. A static `consumed_effective_paths` declaration is not proof that Japanese Product prose or a draft semantically reflected the answer. A fake PB-06 major fidelity finding blocks delivery; actual Provider semantic fidelity remains unestablished until a later separately authorized Product evaluation.

PB-05 changes only authority availability. This slice does not add semantic-depth sections, alternatives, emotional prose architecture, generic expansion, or repetition doctrine; those remain V1-B/V1-C work.

## Resume reuse and stage counts

Resume reuses immutable initial Base grounding, Candidate lane/analysis, Base Safety, Candidate Safety, and original request input. It does not rerun PB-01C, PB-02, or PB-03.

- Initial ready without Candidate: Provider-stage IDs PB-01, PB-02, PB-03, PB-04, PB-05, PB-06; PB-01C is a deterministic `candidate_absent` skip.
- Initial one-gap with Candidate: PB-01, PB-01C, PB-02, PB-03; PB-04/05/06 are not invoked.
- Ready resume: PB-01, PB-04, PB-05, PB-06; PB-01C/PB-02/PB-03 are deterministic `reused_initial_authority` skips.
- Not-full or Safety resume: PB-01 only, followed by terminal routing; no Product stages.

Offline fake transport records `actualProviderCalls=0`; stage invocation lists are deterministic simulated evidence, not live Provider execution.

If resume fails after any stage, Pipeline—not Application—finalizes the run exactly once with the actual last returned model, accumulated input/cached/output/reasoning tokens, derived cost, and safe error code. A PB-01 clarification success followed by PB-04 failure retains nonzero PB-01 usage. Application no longer overwrites this authority with null/zero values or double-finalizes.

## Persistence, API, delivery, and UI

Migration `0006_m2_p4_jpy980_clarification_lifecycle.sql` remains unchanged and unapplied. It adds request awaiting state, run kind/result authority, four run eligibilities, skip provenance, exactly one clarification per request, immutable question authority, fingerprint constraints, and transactional finalization/answer/failure functions. Repository completion now uses the V1-A2 atomic stopped-result RPC only when first-class `resultJson` exists; historical resultJson-less needs-more and Safety callers keep the accepted pre-V1-A2 completion path. Ready remains on `finalizeCompletedAssessment`.

Delivery V2 exposes exactly ready/completed, needs-more/awaiting, not-full/stopped, and Safety/stopped. Needs-more exposes only opaque clarification ID, bounded question metadata/copy, and `1 / 0 / 1` budget truth. It does not expose request/run IDs, Fact IDs, Provider IDs, source identity, or internal details.

The answer endpoint accepts only `{ "answer": ... }` at the opaque-ID URL and loads question/target/request authority server-side. The form implements preflight Product-scope feedback, one accessible target-specific control, visible one-question truth, keyboard operation, disabled/submission/error states, mobile/200% zoom-safe wrapping, reduced-motion handling, and customer-safe not-full/Safety no-charge copy. There is no second-question UI.

## Offline acceptance evidence

The original 28 machine-readable fixture intentions are retained. Eight R1 regressions expand evidence to `36/36`: actual self-contained V12 prompts; bucket/no-exact and trusted local-datetime/exact timing; five provenance mutants; PB-06 fidelity blocking; accumulated resume-failure usage; historical completion compatibility; and structured central-concern none.

The verifier loads the actual V12 catalog and inspects each actual `StageDefinition.developerPrompt`. PB-01/04/05/06 contain the full predecessor responsibility sections plus clarification deltas; merely naming or referring to an accepted predecessor contract is not accepted as inheritance. No live Provider call is used.

Provider / DB / Supabase / migration apply / Payment / deploy operations during this Task are `0 / 0 / 0 / 0 / 0 / 0`.

## Human review request

Confirm only V1-A2 implementation correctness and boundary fidelity. Do not infer V1-B/C/D completion, R2-C PASS, JPY980 Runtime readiness, Production Runtime activation, Payment readiness, Provider quality, deploy readiness, main integration, or Global Q0 completion from this packet.
