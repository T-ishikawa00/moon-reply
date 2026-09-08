# Final QA Runner Fix — evaluation infrastructure only

**Local Technical PASS — READY TO RESUME FINAL BLIND QA.**

Starting evidence HEAD: `dec7b652831731c930484d02e3af64aa3d2cd4d8`.
Candidate implementation authority remains `9c0fe90166b6ef3d8ccd8874afb7ad51b92dbffe`.

## Root cause and correction

The runner rejected terminal incomplete responses before recording received-response provenance. Its classifier also required `status=completed` for every session-level failure. Separately, PB04 accessed or canonicalized an arbitrary parsed JSON value before schema validation, so `null` caused a TypeError and an unclassified GLOBAL STOP.

The corrected runner records provenance only after durable receipt, successful usage accounting and model/service-tier verification. A terminal `incomplete` response, or a completed response missing output text, then becomes SESSION STOP. Failed, queued, cancelled, pending and unknown API states remain GLOBAL STOP. Missing or invalid usage, unknown outcomes and identity mismatches cannot use the incomplete-output allowance.

PB04 canonicalization runs only on objects; a malformed top-level or nested value reaches the unchanged schema validator. The same schema-error classification covers PB05/PB06 null or invalid values. No schema is relaxed, no output is converted to a completed answer, and no retry/sample/repair is added. Each failed session records its stop scope and provenance and withholds its Customer-facing intermediate content.

## Classification matrix

| Condition | Disposition |
|---|---|
| Received/accounted terminal incomplete model output | SESSION STOP |
| Completed response missing output text; invalid JSON/schema | SESSION STOP |
| PB04/PB05/PB06 parsed null or invalid output | SESSION STOP |
| Material fact/source, true action contradiction, case-specific Safety/meaning failure | SESSION STOP |
| Wrong model, service tier, candidate/version/hash or case/input | GLOBAL STOP |
| Mapping, budget or accounting corruption; hard cap exceed | GLOBAL STOP |
| Runner/inspection integrity failure; authentication/infrastructure failure or unknown outcome | GLOBAL STOP |
| Unintended Production/Customer connection | GLOBAL STOP; no such connection is constructed by this offline verification |

SESSION STOP ends that session permanently and allows the remaining cases. GLOBAL STOP prevents all subsequent dispatch. The existing narrow repair eligibility and post-repair delivery conditions are unchanged; these infrastructure fixes do not authorize additional repair.

## Verification evidence

All 13 required test groups passed: 16 SESSION fixture batches and 13 GLOBAL negative scenarios, including actual PB04/PB05/PB06 capture for both conditions. Additional malformed-type checks, the existing runner suite, independent read-only review and changed-file ESLint/diff checks passed. Full offline preflight passed with all 24 live slots unstarted. These counts are local fake tests, not additional model sessions or API samples.

- [Required routing integration tests](../verify-stop-routing.mjs) and [results](../runner-fix-results.json).
- [Existing runner regression results](../../runner-verification.json).
- [Full offline preflight](../verify-preflight.mjs) and [result](preflight-result.json).
- [Raw protected-file hashes captured before the change](protected-hashes.json).

The offline preflight renders 24 unstarted slots, with zero live sessions or calls, and verifies the empty budget ledger, mapping isolation, unchanged cases/expectations, unchanged renderer evaluation content and exact loaded catalog identities. Authored fake receipt tests remain separate from that unstarted fixture and are not model-quality or Human-preference evidence.

The previous preflight STOP artifact remains unchanged. Its finding is not rewritten into a historical PASS. No real batch, live mapping or one-shot lock has been created by this fix.

## Preserved authority

Product V19-L5; catalog/bundle v23; schemaSet v9; PB01 v6 / PB04 v8 / PB05 v13 / PB06 v11 remain unchanged. The snapshot covers 1,486 protected files, including 223 candidate/runtime source files checked both as raw bytes and against the frozen canonical SHA-256 identities.

The fixed 12 cases, expected dispositions, Human Review evaluation content, model `gpt-5.6-luna`, reasoning `low`, Standard (`default`), $6 hard cap and Production selection are unchanged. Reference maximum reservation remains $4.8983904 / 208 planned HTTP. Official pricing must still be checked immediately before the actual live batch; no fresh price assertion is made by this offline task.

API calls / credential reads / Production changes / push / deploy / remote migration = 0.

This work repairs the test infrastructure. It does not establish Human Quality Acceptance, Production Authorization or real-model narrow repair success rate.

## Changed files

- `final-qa/runner.mjs`: provenance, invalid-value handling and stop-scope evidence.
- `final-qa/verify-stop-routing.mjs`: the 13 required routing test groups.
- `final-qa/verify-preflight.mjs`: the full zero-API preflight.
- `final-qa/runner-fix-results.json` and `runner-verification.json`: test results.
- `final-qa/runner-fix-2026-09-09/protected-hashes.json` and `preflight-result.json`: preservation and preflight evidence.
- This report and the evaluation `README.md`: evaluation-only documentation.

Generated fake receipt directories and the unstarted UI fixture are retained as local test artifacts; their locations/hashes are recorded in the reports. The live batch is still unexecuted, and this task does not resume it.

**READY TO RESUME FINAL BLIND QA**
