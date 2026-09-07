# Fresh Blind Pilot authorization — 2026-09-08

Current Human approval: fixed GQ05/GQ24/GQ13/GQ29-P3 × V17/V19-L3, each once, max8 sessions/72 HTTP/USD2. Exact model gpt-5.6-luna, low, Standard. No HTTP retry, clarification answer, attempt3 or extra sample. This is not Production authorization.

Implementation baseline cc899b92e94e26b71d83eae3a747f0b849874ddc remains V19-L3. Execution HEAD b62e1a9ac3794344925e2fef8d1fed71c99fb48f adds only targeted evaluation assets. Preflight proves ancestry, path-limited evidence-only diff and exact stored catalog hashes. Production V17/Paid/Customer traffic unchanged. Candidate catalog/bundle v21, schemaSet v6, PB05 v11/PB06 v9.

New neutral run `evals/blind-runs/2026-09-08-fresh-01`. New random per-case A/B assignment, new UUIDs/ledger/lock/outputs. No prior session/output/mapping or Human preference used in generation. Only the four frozen synthetic input objects reach initial PB01. All stages are newly generated. Common synthetic Application time remains the prepared fixed timestamp, identically for both conditions; it is scenario time, not a claim of current external state.

## Stop scope

SESSION STOP: material fact/source/decision/meaning integrity, raw ACTION_CONSISTENCY major/critical, model-origin schema-invalid/incomplete output, case-specific Safety. Persist failure and stop that session before repair/retry. Later independent synthetic sessions may proceed. Unknown validity/grounding/config errors are not automatically treated as model schema failure: provenance must match the actual response and definition.

GLOBAL STOP: model/version/hash/input/mapping/settings mismatch, budget/accounting or source integrity problem, API/authentication/HTTP/timeout/infrastructure failure, unexpected runner exception, unintended DB/Customer/Production activity. Preserve reservations; never reset a global STOP. No new budget per session.

Reuse existing `executeSession`, `AssessmentApplication`, `EvaluationTransport`, `createLiveSender`, `ReservationLedger`, receipt checkpoint and Customer renderer. New facade changes only evaluation stop scope. It is not a runtime classifier allow-list. F007 remains OPEN; genuine contradictions cannot proceed through repair/exhaustion in this pilot. Existing single repair for nonmaterial style/completeness remains within the previous caps, never for a SESSION STOP.

## Budget and evidence

Existing stage caps: PB01 1×42000/8192; PB01C 0; PB02 1×24000/3072; PB03 1×24000/2048; PB04 2×48000/8192; PB05 2×64000/8192; PB06 2×96000/4096 (input/output including reasoning). Thus at most9 HTTP/session,72 total. No unnecessary stage is invoked to consume the cap.

Current official rates in pricing.json: USD/M input0.20, cached0.02, cache-write0.25, output1.20. All inputs conservatively reserved at0.25/M before dispatch, output cap includes reasoning. Max total reservation$1.5330112<$2. Reservations are never refunded, even on timeout/unknown. Usage is stored and journal reloaded; missing cache-write usage retains cost uncertainty. No Production budget/quota/DB used.

Each session saves new PB01/PB04/PB05/PB06 receipts, entry state, initial direction, reassessment, final state, findings, usage/cost and anonymous output. Internal evidence index links GQ29 input fact→PB05→PB06. Public review contains only A/B outputs or explicit completed/clarification/stopped/not-started states and four unanswered Human questions. Partial/stopped report text stays internal. Versions/mapping and quality conclusions remain hidden until Human finishes review. Styling phrases are not preset FAIL labels.

Pre-API acceptance: independent source/stop-policy review, fake budget/isolation/schema/incomplete/global guard/blind rendering checks, source lint and diff check. fake results are not actual response quality evidence.

Production/Customer/DB/Payment/Email operations, push/deploy/remote migration0. No edits to old candidates or old run artifacts.
