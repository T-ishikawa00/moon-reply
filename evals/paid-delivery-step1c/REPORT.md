# Paid Delivery Guarantee STEP 1C — Technical and API acceptance PASS

## 1. Implemented normalization

The shared evaluation request builder now invokes an evaluation-only adapter after the unchanged Product schema projection. Nested `$defs` move to root; internal references follow the relocated targets. Names derive deterministically from original definition paths, with collision suffixes. Product schemas and Production transport are untouched. This addresses the exact STEP 1B reference-resolution rejection; no fictitious universal rule was added to the public-subset validator.

## 2. 39 definitions

Exact GQ-05 / V19-L5 / PB-01: **39/39 hoists preserved**. All 40 definitions remain (39 moved plus the existing `legacy_base`). No discarded or overwritten definition. Full move proof（参照原本はPrivate保全・候補には非同梱）.

## 3. 55 references

**55/55 rewritten references preserve their resolved graphs**; all 56 references resolve, including the unchanged `legacy_base` root reference. The old `#/$defs/legacy_base/$defs/relationship_stage` reference is absent; its target resolves from root `$defs`.

## 4. Collision / graph safety

Duplicate flattened names **0**, unresolved/dangling refs **0**, overwrites **0**, new cycles **0**. Determinism and idempotence PASS. Unreachable definitions are retained and reported: the exact failing PB-01 has none; PB-02 contains three existing unreachable definitions in each catalog. Collision, namespaces, escaped pointers, subtree references, recursion and unsafe reference scopes have dedicated tests.

## 5. Semantic preservation

**288/288 schema nodes are paired** in the exact PB-01 graph proof. Root fields, required, types, enums, const, nullability, arrays/items, min/max/string constraints, additionalProperties, descriptions/annotations, Safety and Product fields retain exact values. Every node and reference target is checked, including unreachable nodes. Literal `$ref` strings are the explicitly permitted difference; their resolved graph is compared rather than claiming the old and new strings are identical.

Existing valid / invalid enum / extra-property fixtures: **3/3 equivalent results**. Normalization tests **18/18**, public compatibility tests **34/34**, STEP 1B diagnostics **11/11**, acceptance transport **6/6**; runner regression **13/13 groups**, including mapping isolation, accounting, SESSION/GLOBAL STOP and case/input hashes. Syntax and diff checks PASS. Local verification（参照原本はPrivate保全・候補には非同梱）.

## 6. All evaluation schemas

**19/19 PASS**: 14 normal output contracts, one narrow Report repair contract and four retained Base/clarification variants. Every schema passes compatibility/limits, reference resolution, topology, graph-preservation and deterministic serialization checks through the actual `buildBody` pipeline.

| Contract | Definitions moved | References rewritten |
|---|---:|---:|
| V19-L5 PB-01 | 39 | 55 |
| V19-L5 PB-04 | 18 | 33 |
| V19-L5 PB-05 | 3 | 9 |
| Other 16 variants | 0 | 0 |

All **9 V17 variants pass through byte-identically**. Complete preflight（参照原本はPrivate保全・候補には非同梱）.

## 7. API acceptance smoke

**PASS — HTTP 200, model response status `completed`**. Same GQ-05 / V19-L5 / PB-01 logical request, with only `text.format.schema` changed. Model `gpt-5.6-luna`, reasoning `low`, service tier `default`, SDK `openai@7.1.0`; retries 0 and no alternate request. The output is excluded from Final QA and Human quality evaluation.

Timestamp `2026-09-08T18:01:09.009Z` (2026-09-09 03:01 JST). Receipt（参照原本はPrivate保全・候補には非同梱） / raw response metadata（参照原本はPrivate保全・候補には非同梱）. The one-time lock remains consumed; no further API call is authorized by this result.

| SHA-256 convention | Normalized schema | Request body |
|---|---|---|
| Insertion-order JSON / wire identity | `6cb36513ce0dbc49331db0881e989879055e3a1ff8d3e0754b9245f607e7b814` | `35abc47d02b380ff41bcfd57307a5a20dd1bc303438c86fdd418de2cd202526e` |
| Recursive key-sort canonical JSON | `9c4b8d52ed48780c201067bd40b65e8d089bf052c794ec33106b1be4c1ac4b02` | `d2c6ecc33699c49a688eb847db148527a888ea710cf433ae7c060d0a287df335` |

## 8. HTTP / request ID / tokens / cost

- HTTP **1**; retry **0**; additional sample **0**.
- Request ID: `req_86d20bc411874e3ca8131e6af300b5b2`.
- Response ID: `resp_0044ac96825c0bee016aa04d59082887d0b46de88bdbc8e8b8`.
- Input **8,978** (cache writes 8,975; cached reads 0), output **1,248** (reasoning 144 included), total **10,226** tokens.
- Usage-derived cost **USD 0.00374195**; retained pre-call reservation USD 0.0219304; hard cap USD 0.20.

[Official pricing](https://developers.openai.com/api/docs/models/gpt-5.6-luna) was rechecked immediately before the call. Per million: ordinary input $0.20, cache writes $0.25, cached reads $0.02, output including reasoning $1.20. Cost derives from the complete returned usage; no billing API was accessed.

## 9. Changed files

The only modified pre-existing file is `evals/guidance-quality-wave1/real-pilot/transport.mjs` (two-line adapter connection). New normalization, tests, preflight/acceptance instrumentation, frozen synthetic fixtures and evidence/docs are under `evals/paid-delivery-step1c/`. Previously untracked STEP 1 compatibility files and the STEP 1B diagnostic helper are included unchanged as evaluation dependencies. The exact local commit manifest is `evidence/commit-manifest.json`.

Existing historical runs, candidate source, fixed cases, expected dispositions, blind mapping and earlier evidence remain unchanged. Generated fake-test receipts remain local/untracked.

## 10. Candidate identity

**UNCHANGED**: implementation `9c0fe90166b6ef3d8ccd8874afb7ad51b92dbffe`; V19-L5 catalog/bundle v23.0.0, schemaSet v9.0.0, PB01 v6 / PB04 v8 / PB05 v13 / PB06 v11. All **223 candidate source hashes** match. Normalized provider schema hashes are evaluation adapter artifacts, not new Product candidate versions.

## 11. Commit / final HEAD

The permitted local evaluation-only commit follows both local and API acceptance PASS. Starting HEAD was `d418702c7acd8b08d0bf01707c2a460a0ce15d96` on `codex/guidance-quality-final-v19-l5`. Final commit and worktree status are recorded in `evidence/final-state.json` after commit. No push or deploy.

## 12. Production unchanged evidence

**5,054 pre-existing files outside the one allowed evaluation transport edit remain byte-identical**, including all 223 candidate source hashes and frozen cases. The commit manifest contains evaluation files only. No Product/PB semantics, Payment/Auth, Production runtime, DB or F002/F007/F008/F009 delivery implementation changes. Production operations / push / deploy / migration = **0**; no other worktree/global configuration edits.

This completes STEP 1 infrastructure recovery. It does not establish answer quality or authorize Final QA. STEP 2 — V19-L5 Final Quality + Narrow Repair Verification — requires separate Human authorization and was not started.

READY FOR PAID DELIVERY GUARANTEE STEP 2
