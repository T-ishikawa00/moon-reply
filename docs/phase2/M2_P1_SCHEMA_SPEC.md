# M2-P1 Schema Specification

## Status

- Version: `pipeline-schema-v1.0.0`
- Dialect: JSON Schema Draft 2020-12
- State: nine draft schemas created; Human / ChatGPT review pending
- Runtime use: not authorized

## Global rules

Every schema:

- declares Draft 2020-12;
- uses root `additionalProperties: false`;
- closes nested data objects unless a bounded standard object requires otherwise;
- names required fields;
- enumerates policy vocabulary;
- represents nullable values explicitly;
- avoids arbitrary free-form extension objects; and
- excludes confidence, probability, romantic-interest scores, and model override fields.

Schema validity is necessary but not sufficient for delivery. Cross-object policy and semantic checks remain separate gates.

## Schema inventory

### `eval-case.schema.json`

Owns the full committed evaluation case, including input, evaluation-only oracle, assessment meanings, question expectations, a strict counterfactual group ID, and one or more unique `contrast_set_ids`. Contrast-set IDs match `CS-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{2}`. It encodes eligibility, decision, draft, Safety, split, and case-type enums plus key wait/pause/information invariants.

`payment_allowed` is described as policy eligibility only. Neither `eval-case.schema.json` nor `eligibility-result.schema.json` enables runtime payment or represents payment capability.

### `structured-intake.schema.json`

Owns normalized input:

- relationship stage and user goal;
- timeline;
- boundaries and context;
- observed facts with `fact_id`, source refs, and support;
- assumptions and emotions;
- material unknowns;
- Safety signals; and
- untrusted-instruction detection.

It has no decision, advice, message draft, probability, or confidence field.

### `safety-assessment.schema.json`

Separates:

- deterministic rule result;
- model semantic result;
- optional moderation result; and
- application-owned aggregate result.

The aggregate records `strictest_classification_wins`. Reason and response vocabularies are allowlisted. It contains no user-facing free-form Safety response.

### `eligibility-result.schema.json`

Owns the three eligibility states, approved question codes, material gaps, and flow/payment/report flags.

Conditional rules enforce:

- ready: zero questions and allowed flow;
- needs-more-information: one to three questions and prohibited flow; and
- safety-blocked: zero questions and prohibited flow.

### `decision-policy-result.schema.json`

Represents application-owned policy output:

- allowed decisions;
- disallowed decisions with reason codes;
- follow-up exception;
- message-draft policy;
- later-draft mode;
- pause reason; and
- resume policy.

There is no model override field.

### `decision-plan.schema.json`

Owns:

- selected decision;
- decision reason fact IDs;
- possibility-only interpretations;
- actions to take and avoid;
- eligible message draft;
- exactly three ordered day-plan entries;
- change conditions;
- review timing;
- unknowns; and
- limitations.

Pause requires a null draft. Reply/send require a current-use draft. Wait cannot produce a current-use draft.

### `report-content.schema.json`

Owns variable AI-generated prose only. Renderer-owned product name, brand name, decision label, chapter titles, client nickname, date, fixed disclaimer, Safety copy, Legal copy, and save-card name are absent by design.

### `validation-result.schema.json`

Separates deterministic checks from semantic findings and supports application-owned:

- final disposition;
- repair strategy; and
- failed codes.

`semantic_findings_only` permits PB-06 to report findings with null final fields. Only the application produces `complete` disposition.

### `eval-run-manifest.schema.json`

Supports reproducibility and cost/failure analysis:

- run and timestamps;
- Git SHA;
- dataset version/hash/split/count;
- policy/schema/prompt/validator/Safety/renderer versions;
- provider and API family;
- requested and returned model identifiers;
- `store: false`;
- bounded parameters;
- response ID, attempt, latency, token usage, cost, refusal, and gate results; and
- aggregate summary.

It has no API key, secret, raw full consultation text, or provider-payload oracle field.

## Schema versus policy

JSON Schema handles structure, enums, bounded arrays, nullability, and selected local conditionals. The permanent verifier handles cross-case and cross-file invariants. Future runtime deterministic validation owns cross-object identity and delivery logic. PB-06 owns semantic finding enumeration only.

No verifier or prompt duplicates the full future decision-policy implementation.

## Change control

- Major: incompatible decision/Safety meaning, required-field removal, object responsibility change, or gate change.
- Minor: backward-compatible field, new validator, or new allowed enum under accepted policy.
- Patch: non-semantic correction or clarification.

Every change requires manifest refresh and the applicable Human review.
