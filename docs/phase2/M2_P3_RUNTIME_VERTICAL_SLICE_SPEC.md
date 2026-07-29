# M2-P3 Runtime Vertical Slice Specification

## 1. Authority

Task `M2-P3-A` authorizes an internal, development-only AI assessment runtime structure. It supersedes the one-time paid calibration CLI as the active product-development path without deleting or rewriting that historical tooling.

The active path is:

`request sheet -> internal Next.js route -> PB-01..PB-06 -> Stage persistence -> assessment-note rendering`

The paid-once runner remains frozen as paused internal QA tooling. It is not required for M2-P3 acceptance, and no additional paid-once execution is currently planned.

## 2. Runtime boundary

Implemented internal surfaces:

- page: `GET /review/runtime`;
- route: `POST /api/internal/assessments`;
- Node.js runtime only;
- local development only;
- unavailable when `NODE_ENV=production`;
- unavailable unless `M2_INTERNAL_RUNTIME_ENABLED` equals exactly `true`;
- no public navigation entry;
- `noindex, nofollow`;
- synthetic/test content only.

The existing public `/request` behavior is unchanged.

## 3. Inputs

The route accepts exactly:

- `currentSituation`: required string, maximum 5,000 characters;
- `optionalMessage`: nullable string, maximum 2,000 characters;
- `relationship`: one allowlisted value;
- `requestedTopics`: one to three unique allowlisted values;
- `privacyAcknowledged`: exactly `true`.

Unknown fields, invalid JSON, oversized bodies, cross-origin requests, missing privacy acknowledgement, and an invalid UUID idempotency key fail closed.

## 4. Server architecture

Interfaces:

- `AssessmentRepository`;
- `AiStageTransport`;
- `AssessmentPipeline`.

Bindings:

- `SupabaseAssessmentRepository`;
- `OpenAiResponsesTransport`;
- `FakeAssessmentRepository`;
- `FakeAiStageTransport`.

The application layer owns idempotency and server-generated request/run UUIDs. The pipeline owns Stage ordering, local policy, persistence, stopping, usage accumulation, report saving, and run completion.

Product runtime code does not import the historical calibration scripts. Canonical Prompt and Schema assets are loaded from `ai/`, their hashes are verified, and only their versions/hashes—not complete Prompt text—are persisted.

## 5. Exact pipeline

Ready-case execution order:

1. PB-01 Structure
2. local Schema validation
3. PB-02 Safety Semantic
4. local Schema validation
5. PB-03 Eligibility
6. local Schema validation
7. deterministic Safety aggregation
8. deterministic eligibility gate
9. deterministic Decision Policy
10. PB-04 Decision Planning
11. local Schema and plan validation
12. PB-05 Report Writing
13. local Schema and report validation
14. PB-06 Semantic Validation
15. local semantic disposition
16. save final report
17. complete run

PB-07, retry, Repair, and model fallback are not present. Any failed Stage is recorded as failed, stops the pipeline, marks the run failed, and returns only a safe error code.

## 6. Safety and decision ownership

Eligibility values remain:

- `ready`;
- `needs_more_information`;
- `safety_blocked`.

Decision values remain:

- `reply_now`;
- `send_now`;
- `wait_and_reassess`;
- `pause_additional_contact`.

The application computes the strictest Safety result and the allowed decision deterministically. The model cannot add a decision, override Safety, create confidence/probability output, assert another person's feelings, or exceed three additional question codes. `safety_blocked` and `needs_more_information` stop before PB-04.

## 7. Persistence

Every Stage has a row before provider invocation. Completion or failure persists:

- Stage status and sequence;
- request, Prompt, and Schema hashes;
- provider response ID and returned model;
- usage and latency;
- output JSON, including invalid output needed to diagnose a Schema failure;
- safe error code.

The run records aggregate usage, usage-derived cost estimate, eligibility, decision, returned model, completion/failure, and safe error code. The repository never stores API keys, Authorization headers, raw environment state, internal reasoning text, chain of thought, raw provider error bodies, or full Prompt text.

## 8. Usage-derived cost estimate

`lib/assessment/runtime/cost.ts` isolates the versioned Luna planning calculation. It charges all input tokens conservatively, applies no cached discount, charges provider `output_tokens` once, and does not add `reasoning_tokens` again. The result is a `usage-derived cost estimate`, not final billed cost.

## 9. M2-P3-A validation mode

Automated validation uses only the fake transport and fake repository. It covers:

- development fixture `WAIT-003`;
- a `needs_more_information` case;
- a `safety_blocked` case;
- Stage Schema failure;
- returned-model mismatch;
- duplicate idempotency submission;
- database write failure;
- PB-05 failure proving PB-06 is not called.

The verifier records zero actual OpenAI calls, zero actual Supabase calls, USD 0 API spend, and zero real-user records. Live bindings exist structurally but remain unconfigured.

## 10. Explicit exclusions

M2-P3-A does not authorize payment, RevenueCat, authentication, email, production/public release, real-user processing, analytics, PDF/download/share/print, background work, queue, cron, mobile API, public history, retry, PB-07/Repair, fallback model, Supabase project setup, API-key creation, or deployment.
