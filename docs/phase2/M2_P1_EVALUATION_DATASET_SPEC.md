# M2-P1 Evaluation Dataset Specification

## Status and purpose

- Dataset: `eval-development-v1.0.0`
- Split: `development`
- Count: exactly 70
- State: materialized; automated integrity validation required; Human / ChatGPT oracle review pending

The development dataset evaluates policy fidelity, not open-ended romance advice. It is repository-visible and may be used for prompt iteration and continuous regression. It is not runtime fixture data and is not imported by the application.

## Exact layout and distribution

| Source file | Case IDs | Case type | Count |
| --- | --- | --- | ---: |
| `reply-now.json` | `REPLY-001`–`REPLY-010` | `decision` | 10 |
| `send-now.json` | `SEND-001`–`SEND-010` | `decision` | 10 |
| `wait-and-reassess.json` | `WAIT-001`–`WAIT-010` | `decision` | 10 |
| `pause-additional-contact.json` | `PAUSE-001`–`PAUSE-010` | `decision` | 10 |
| `needs-more-information.json` | `INFO-001`–`INFO-008` | `information` | 8 |
| `safety-blocked.json` | `SAFETY-001`–`SAFETY-013` | `safety` | 13 |
| `benign-safety-controls.json` | `BENIGN-001`–`BENIGN-009` | `benign_safety_control` | 9 |
| **Total** |  |  | **70** |

The source-of-truth case content is the Human-supplied Appendix A. Materialization preserves every input value, oracle, required meaning, forbidden claim, reference draft, and counterfactual group.

## Required case shape

Every case includes:

- stable case identity and split;
- input payload;
- evaluation-only oracle;
- required and forbidden extraction meanings;
- required reasoning meanings;
- forbidden claims;
- message-draft constraints;
- Safety response requirements;
- expected additional question codes;
- material gap codes; and
- counterfactual metadata.

`required_reasoning_meanings` is a list of externally assessable rationale meanings. It is not private chain-of-thought. A reference draft is a semantic comparison aid and not an exact-string success condition.

## Oracle ownership and isolation

The oracle is Human-owned. It is available only to the offline evaluator. A provider-facing projection excludes:

- `oracle`;
- `required_extractions`;
- `required_reasoning_meanings`;
- `forbidden_extractions`;
- `forbidden_claims`;
- `message_draft_constraints`;
- `safe_response_requirements`;
- `additional_question_expectations`;
- `material_gap_codes`;
- `counterfactual`; and
- evaluation-only tags.

The permanent verifier creates the projection in memory and asserts that `oracle` and expected fields are absent. The model never receives reference drafts or expected labels.

## Category invariants

### Decision cases

- eligibility is `ready`;
- Safety is `normal_allowed`;
- normal flow, payment, and report generation are allowed;
- primary decision matches the source category;
- reply/send require a current draft;
- wait uses `later_only` and a non-null later mode; and
- pause has no draft, a pause reason, and a resume policy.

### Information cases

- eligibility is `needs_more_information`;
- primary decision is null;
- draft is `not_allowed`;
- normal flow and payment are false;
- report generation is prohibited;
- one to three approved question codes are present; and
- questions correspond to material gap codes.

### Safety cases

- eligibility is `safety_blocked`;
- classification is `needs_review` or `rejected`;
- at least one approved risk reason is present;
- primary decision is null;
- draft, normal flow, payment, and report generation are prohibited; and
- response mode is application-template-owned and not `none`.

### Benign Safety controls

- classification is exactly `normal_allowed`;
- Safety reason codes are empty;
- response mode is `none`;
- the case remains eligible for its non-Safety decision; and
- no false-positive Safety block is allowed.

## IDs and ordering

- IDs are unique and immutable.
- An ID is never reused, even after retirement.
- `development/index.json` owns stable sort order 1–70.
- Stable order is Appendix order: reply, send, wait, pause, information, Safety, benign.
- The index records source file, type, expected eligibility, Safety, decision, and counterfactual group.

## Counterfactual governance

Counterfactual groups are preserved exactly. A group may contain cases with different prefixes or control types when the supplied catalog intentionally tests one changed factual dimension. Groups cannot cross development and holdout.

Review a group for:

- unchanged policy version;
- unchanged decision definitions;
- no hidden oracle rewrite;
- a fact-supported outcome difference; and
- no contamination from reference drafts.

## Version and hash ownership

`evals/version-manifest.json` records:

- dataset and component versions;
- exact counts;
- SHA-256 for each development JSON file and the index;
- aggregate dataset SHA-256;
- expected external holdout count; and
- generation metadata.

Each file hash uses canonical UTF-8 text with CRLF normalized to LF (`sha256-utf8-lf`). Aggregate hashing uses the listed relative file paths and canonical file hashes in manifest order. The verifier recomputes both deterministically across Windows and Unix checkouts.

## Holdout

The expected holdout count is 15. Holdout case content is external-only and not committed. A later authorized runner may receive an external path, but M2-P1 performs no holdout run.

An exposed holdout case is retired and replaced. The repository may retain only version, expected count, and external hash metadata.

## Change control

Oracle changes require:

1. Human review;
2. written rationale;
3. counterfactual review;
4. dataset version bump; and
5. changelog.

Model failure alone is not a reason to change an oracle.
