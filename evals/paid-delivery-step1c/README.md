# STEP 1C — Evaluation Structured Output reference normalization

Product schema → unchanged existing projection → evaluation-only definition hoist → existing and public-subset checks → request serialization.

The shared evaluation `buildBody` now calls `adapter.mjs`. No Production transport, Product schema, V19-L5 prompt or candidate identity is edited. Schemas with no nested definitions pass through with identical JSON bytes. This is an interoperability workaround for the exact STEP 1B server reference-resolution rejection; it does not assert a public prohibition on all nested `$defs`.

`normalize.mjs` inventories schema nodes, retaining data/annotation objects as opaque values. Nested definition names derive from the SHA-256 of their original JSON Pointer, with deterministic collision suffixes and no overwrites. References are rewritten using the deepest moved target prefix, including references to subtrees. Scope-changing `$id`/anchor/dynamic-reference schemas are rejected for relocation. Existing recursive graph structure and unreachable definitions are preserved.

Semantic proof compares every original schema node against its relocated node, compares all non-placement fields and opaque annotation data exactly, and checks the relocated reference graph. Each moved definition and rewritten reference records graph equality. Literal subtrees containing `$ref` strings necessarily differ at the permitted reference spellings; the proof compares their resolved graph and all remaining values, not those strings as if unchanged. The graph inventory and cycle components must match.

Exact failure: 39 definitions moved, 55 references rewritten, 40 definitions retained, 288 schema nodes paired. Root output properties, required, types, enums, const, nullability, arrays/items, constraints, additionalProperties, descriptions, Safety and Product fields are unchanged. Unreachable definitions are retained and listed. Existing V17 PB-02 has three unreachable definitions, preserved in each catalog.

The all-catalog preflight covers 19 variants: 14 normal stage outputs, one Report fact-repair output and four retained Base/clarification schemas. Only V19-L5 PB-01/PB-04/PB-05 are changed (39/18/3 moved definitions and 55/33/9 rewritten references). All nine V17 variants pass through byte-identically. All contracts have resolved references, no nested-definition target references, deterministic/idempotent serialization, equivalent graphs and passing public-subset/limit checks.

Local checks:

```text
node evals/paid-delivery-step1c/preflight.mjs
node --test evals/paid-delivery-step1c/normalize.test.mjs
node --test evals/paid-delivery-step1c/smoke.test.mjs
node --test evals/paid-delivery-step1/compatibility.test.mjs
node --test evals/paid-delivery-step1b/diagnostic.test.mjs
node evals/guidance-quality-v19-l5/final-qa/verify-stop-routing.mjs --stdout-only
```

The historical schemas and receipts in `fixtures/` are copied evidence, not new evaluation cases. The diagnostic tests use authored fake responses. The acceptance smoke uses the exact prior GQ-05 / V19-L5 / PB-01 logical request with only `text.format.schema` changed; it is excluded from Final QA and Human quality evaluation.

`execute-once.mjs` is a task-specific, one-use entrypoint. It requires the fixed source state, official pricing less than one hour old, local PASS and independent review with a code-owned mandatory source list, exact prepared body identity and a persistent one-use lock. The transport accepts at most one POST, retries zero, redirects forbidden, and stores raw sanitized response/error/request ID. A consumed lock must never be removed or reused. No automatic Final QA or STEP 2 follows a successful smoke.

Current official references: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-5.6 Luna pricing](https://developers.openai.com/api/docs/models/gpt-5.6-luna). API acceptance evidence and final task disposition are in `REPORT.md` and `evidence/`.
