# M2-P2-B1-B2-A Dormant OpenAI Live-Binding Specification

## Authority and status

- Task: `M2-P2-B1-B2-A`
- R1 correction: Human / ChatGPT accepted and complete at `fa222917f0e6ff4a4e25d11da239717c062af6d0`
- Dormant live-binding implementation: Human / ChatGPT accepted and complete at `76ceb4a25cc565e84b9537bd25dbe703f87bd342`
- Automated validation: complete
- Human / ChatGPT final review: complete
- Case: `WAIT-003`
- Calibration candidate: `gpt-5.6-luna`
- Product/baseline model selected: no
- Provider stages: PB-01 through PB-06
- Maximum future provider calls: 6
- B0 contract hash: `c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2`
- Live execution authorized: false
- Paid run authorized: false
- Actual provider calls: 0
- API spend: USD 0

This task adds dormant, network-capable binding code. It does not add a true approval record, API key, OpenAI Project or billing configuration, paid execution, application route, server action, UI integration, provider SDK, retry, Repair, fallback, Batch, PB-07, holdout execution, or real-user execution. M2-P2-B1-B2-B remains unauthorized.

## Binding architecture

The future runner is ordered and fail-closed:

1. validate the exact Git execution receipt;
2. validate the paid Human approval record and expiry;
3. bind the approved runner SHA, B0 hash, `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, request hashes, pricing freshness, and budget limits;
4. atomically consume the one-time approval marker outside the repository;
5. resolve the single environment secret;
6. invoke the accepted B1-B1 provider adapter sequentially;
7. parse, Schema-check, verify returned model and usage, update conservative cost, and recheck the next-Stage ceiling;
8. write one sanitized bundle through an injected filesystem; and
9. complete once.

B1-B2-A stops at step 2 with `HUMAN_APPROVAL_MISSING`. Its blocked command uses fixture Git state, does not invoke the child-process binding, and reports zero environment reads, secret resolutions, HTTPS requests, provider calls, and spend.

## Request preservation

The accepted B1-B1 request builder is imported unchanged. The fixed request body uses `store: false`, no tools, no streaming, no background execution, default service tier, disabled truncation, low reasoning effort, and strict JSON Schema output. It has no previous response, conversation, Batch, prompt-cache assumption, oracle, holdout, or real-user content.

Stage caps remain PB-01 4000, PB-02 800, PB-03 700, PB-04 4500, PB-05 8000, and PB-06 2500. Registered request hashes remain owned by B1-B1.

The accepted historical static hard cap remains USD 0.213223. The cache-write-protected live execution guard is USD 0.26079625, below the USD 0.30 preflight ceiling and the future USD 1.00 absolute Human ceiling. USD 0.26079625 is a conservative preflight estimate, not actual usage or billed cost.

## Evidence interpretation

Checked-in evidence proves only deterministic protocol, capability confinement, fixture-only failure handling, and the expected blocked state. It does not prove provider availability or compatibility, API-key validity, actual token usage, latency, billing, model quality, product-model selection, or baseline-model selection.
