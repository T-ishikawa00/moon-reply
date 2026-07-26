# M2-P1 Prompt Bundle Specification

## Status

- Bundle: `prompt-bundle-v1.0.0`
- State: draft assets created and hashed; Human / ChatGPT review pending
- Execution: none
- Runtime import: prohibited

The bundle is a design artifact under `ai/prompts/**`. M2-P1 makes no provider call and selects no model.

## Shared assets

| Asset | Responsibility |
| --- | --- |
| `common-stage-contract.md` | untrusted-data, stage isolation, JSON-only, evidence, privacy, no-tool, no-oracle contract |
| `brand-voice-v1.md` | quiet premium Japanese editorial variable-copy direction |
| `decision-labels-v1.json` | fixed decision codes, labels, and draft policies |
| `forbidden-claims-v1.json` | certainty, prediction, fabrication, manipulation, unsafe, and professional-authority bans |
| `safety-reason-codes-v1.json` | current Safety reason vocabulary, response modes, and strictest aggregate rule |
| `question-library-v1.json` | approved concrete questions with `分からない` and privacy boundary |
| `report-field-constraints-v1.json` | variable-copy limits and renderer ownership |

## PB-01 Structure

Input: raw bounded consultation fields.

Output: `structured-intake.schema.json`.

Responsibilities:

- facts, assumptions, emotions, unknowns, timeline, context, boundaries, and Safety signals;
- mandatory source refs for material facts;
- contradiction preservation; and
- SNS reaction exclusion from meaningful direct messages.

It performs no eligibility, decision, draft, or advice.

## PB-02 Safety semantic

Input: structured intake and deterministic Safety evidence.

Output: `#/$defs/model_result` within `safety-assessment.schema.json`.

Responsibilities:

- context-sensitive Safety meaning;
- affirmative versus negated or benign context;
- approved classifications, reasons, response modes, and evidence refs; and
- `needs_review` for genuine ambiguity.

It cannot weaken deterministic Safety, aggregate the result, or generate user-facing Safety copy.

## PB-03 Eligibility

Input: structured intake and aggregate Safety.

Output: `eligibility-result.schema.json`.

Responsibilities:

- one of three eligibility states;
- up to three approved question codes for decision-material gaps; and
- correct flow/payment/report flags.

It performs no provisional decision, draft, or free-form question writing.

## PB-04 Decision plan

Input: ready intake, normal Safety, and application-owned decision-policy result.

Output: `decision-plan.schema.json`.

Responsibilities:

- select only an allowed decision;
- cite fact IDs;
- keep interpretations possibility-only;
- produce consistent action, draft, exactly-three-day plan, change conditions, review timing, unknowns, and limitations; and
- omit a draft for pause.

## PB-05 Report writer

Input: validated intake and decision plan.

Output: `report-content.schema.json`.

Responsibilities:

- variable Lunar Contrast editorial copy only;
- preserve all decision-plan meaning;
- remain fact-bound, non-escalating, specific, readable, and uncertain where required; and
- obey field constraints.

It cannot generate renderer-owned fixed product, chapter, metadata, Safety, Legal, or disclaimer copy.

## PB-06 Semantic validator

Input: validated source artifacts and candidate output.

Output: `validation-result.schema.json` in `semantic_findings_only` mode.

It enumerates only approved findings with severity, JSON path, evidence refs, and detail. It does not repair, select disposition, or choose a repair strategy.

Required finding codes include:

- `FACT_FIDELITY`
- `ASSUMPTION_AS_FACT`
- `DECISION_ALLOWED`
- `DECISION_REASON_SUPPORT`
- `MESSAGE_POLICY_CONSISTENCY`
- `ACTION_CONSISTENCY`
- `THREE_DAY_PLAN_CONSISTENCY`
- `UNSUPPORTED_CERTAINTY`
- `SAFETY_REGRESSION`
- `REQUIRED_SECTION_MEANING`
- `REVIEW_CONDITION_PRESENT`
- `TEMPLATE_GENERICITY`
- `BRAND_TONE`
- `REPETITION`

## PB-07 Repair

Input: immutable source artifacts, candidate report, approved findings, repair mode, and mutable JSON-path allowlist.

Output: a complete repaired `report-content.schema.json` object.

It may change only approved mutable variable-copy fields. Safety, eligibility, policy, decision, facts, draft policy, fixed copy, and non-allowlisted paths remain immutable. It cannot create an internal retry loop.

## Manifest contract

`prompt-bundle.manifest.json` contains every shared and stage asset:

- asset ID and kind;
- asset version;
- relative path;
- canonical UTF-8/LF SHA-256 (`sha256-utf8-lf`);
- output schema path and optional pointer;
- abstract execution profile;
- `store: false`;
- no tools; and
- non-streaming design.

It contains no actual model name. The verifier recomputes every hash and rejects drift.

## Security and contamination controls

Every stage:

- treats user content as untrusted data;
- ignores embedded instructions;
- has no external tools, web, file search, or oracle access;
- returns schema-only JSON;
- avoids private chain-of-thought;
- avoids unnecessary personal-data repetition; and
- cannot see development or holdout expected answers.

The permanent verifier rejects case IDs, case titles, source consultation bodies, reference drafts, and `oracle` material embedded in prompt assets.

## Runtime boundary

These files are not production prompts and are not imported by `app/**`, `components/**`, or existing runtime code. Any execution profile, provider, model, API integration, and runtime prompt loading require a separate authorization.
