# M2-P1 Evaluation Dataset Specification

## Status and purpose

- Dataset: `eval-development-v1.0.0`
- Split: `development`
- Count: exactly 70
- State: materialized with M2-P1-R1 contrast and review-sample controls; automated integrity validation required; Human / ChatGPT final review pending

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

The source-of-truth case content is the Human-supplied Appendix A. M2-P1-R1 preserves every pre-existing case field, input value, oracle, decision, Safety expectation, required meaning, forbidden claim, reference draft, and counterfactual group. It adds only `contrast_set_ids` as case metadata.

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
- material gap codes;
- one or more unique contrast-set IDs; and
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
- `contrast_set_ids`;
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

For every category, `payment_allowed` is a policy-eligibility value only. It does not enable runtime payment or any payment capability.

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
- The index records source file, type, expected eligibility, Safety, decision, counterfactual group, and contrast-set memberships.

## Counterfactual and contrast-set governance

Counterfactual groups are preserved exactly. Group IDs match `CF-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{2}` with no whitespace. A group may contain cases with different prefixes or control types when the supplied catalog intentionally tests one changed factual dimension.

The original one-group-per-case model produced 61 groups for 70 cases, including 54 singleton groups and only 7 multi-case groups. The defect was representational: one `group_id` could not encode overlapping decision, information-resolution, PAUSE/Safety, and Safety/benign relationships. It was not a missing-case or oracle defect, so R1 preserves every existing group and adds an orthogonal many-to-many layer.

`contrast_set_ids` are a many-to-many correction for documented relationships that one group ID cannot represent. Every case has at least one unique ID matching `CS-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{2}`. `development/contrast-set-catalog-v1.json` is the machine-readable owner.

Review a group for:

- unchanged policy version;
- unchanged decision definitions;
- no hidden oracle rewrite;
- a fact-supported outcome difference; and
- no contamination from reference drafts.

The following table is canonical. Every pair implied by a row must share that row's contrast-set ID.

| Contrast set | Source | Members | Decision variable |
| --- | --- | --- | --- |
| `CS-SCHEDULE-SENDER-01` | decision counterfactual | `REPLY-001`, `SEND-001` | who must act on the same schedule fact |
| `CS-APOLOGY-STATE-01` | decision counterfactual | `REPLY-002`, `SEND-002`, `WAIT-004`, `PAUSE-005` | apology sender and prior count |
| `CS-MATCHING-MESSAGE-01` | decision counterfactual | `REPLY-003`, `WAIT-007`, `INFO-002` | incoming question versus unanswered or unknown message |
| `CS-FIRST-DATE-FOLLOWUP-01` | decision counterfactual | `REPLY-004`, `SEND-005`, `WAIT-005` | first-date follow-up state |
| `CS-INCOMING-CHECKIN-01` | decision counterfactual | `REPLY-005`, `WAIT-002` | incoming direct check-in versus pending contact |
| `CS-SCHEDULE-URGENCY-01` | decision counterfactual | `REPLY-006`, `SEND-010`, `WAIT-006`, `INFO-008` | sender, deadline, and urgency |
| `CS-DIRECT-MESSAGE-SIGNAL-01` | decision counterfactual | `REPLY-007`, `WAIT-010`, `INFO-007` | direct message versus social signal |
| `CS-RESTART-AUTHORITY-01` | decision counterfactual | `REPLY-008`, `SEND-009`, `PAUSE-010` | who controls restart |
| `CS-DELAY-VS-MEANING-01` | decision counterfactual | `REPLY-009`, `WAIT-001` | elapsed time versus incoming message meaning |
| `CS-PRACTICAL-CONTACT-01` | decision counterfactual | `REPLY-010`, `SEND-004`, `SEND-008`, `WAIT-006` | practical reply, correction, logistics, or waiting |
| `CS-PROMISED-INFORMATION-01` | decision counterfactual | `SEND-003`, `WAIT-006`, `INFO-008` | promised information versus deferrable timing |
| `CS-LOW-PRESSURE-FREQUENCY-01` | decision counterfactual | `SEND-006`, `WAIT-001`, `PAUSE-004` | supported invitation versus contact accumulation |
| `CS-THANK-YOU-STATUS-01` | decision counterfactual | `SEND-007`, `WAIT-005` | thank-you not sent versus already sent |
| `CS-REOPEN-PERMISSION-01` | decision counterfactual | `SEND-009`, `PAUSE-002`, `PAUSE-010` | wording of later-contact permission |
| `CS-BUSY-CADENCE-01` | decision counterfactual | `WAIT-002`, `WAIT-008`, `BENIGN-001`, `INFO-004` | known busy context and cadence |
| `CS-EMOTIONAL-FOLLOWUP-01` | decision counterfactual | `WAIT-003`, `PAUSE-005`, `PAUSE-008` | anxiety versus accumulated contact |
| `CS-CONFLICT-PURPOSE-01` | decision counterfactual | `WAIT-009`, `SEND-002` | apology versus reassurance-seeking |
| `CS-CONTACT-ACCUMULATION-01` | decision counterfactual | `WAIT-001`, `WAIT-003`, `PAUSE-004`, `PAUSE-006`, `PAUSE-008`, `INFO-005` | time, count, and channel accumulation |
| `CS-EXPLICIT-BOUNDARY-01` | decision counterfactual | `PAUSE-001`, `PAUSE-002`, `PAUSE-007`, `PAUSE-010`, `REPLY-008`, `SEND-009` | explicit boundary versus authorized restart |
| `CS-CIRCUMVENTION-ROUTE-01` | decision counterfactual | `PAUSE-003`, `PAUSE-009`, `BENIGN-009` | alternate-account or third-party route |
| `CS-INFO-GENERIC-RESOLUTION-01` | INFO resolution | `INFO-001`, `REPLY-003`, `SEND-006`, `WAIT-001`, `PAUSE-004` | generic nonresponse resolved across four decisions |
| `CS-INFO-LAST-MESSAGE-RESOLUTION-01` | INFO resolution | `INFO-002`, `REPLY-003`, `WAIT-010`, `PAUSE-001` | exact incoming message and reply status |
| `CS-INFO-SENDER-RESOLUTION-01` | INFO resolution | `INFO-003`, `REPLY-007`, `WAIT-001` | latest meaningful sender |
| `CS-INFO-TIMELINE-RESOLUTION-01` | INFO resolution | `INFO-004`, `SEND-004`, `WAIT-001`, `PAUSE-006` | relationship, elapsed time, count, deadline |
| `CS-INFO-COUNT-RESOLUTION-01` | INFO resolution | `INFO-005`, `WAIT-001`, `PAUSE-004`, `SAFETY-004` | count and escalation boundary |
| `CS-INFO-DRAFT-RESOLUTION-01` | INFO resolution | `INFO-006`, `SEND-006`, `WAIT-003`, `PAUSE-001` | purpose, timing, and boundary |
| `CS-INFO-SOCIAL-RESOLUTION-01` | INFO resolution | `INFO-007`, `REPLY-007`, `WAIT-010`, `PAUSE-007` | social reaction, direct message, and boundary |
| `CS-INFO-DEADLINE-RESOLUTION-01` | INFO resolution | `INFO-008`, `SEND-004`, `WAIT-006`, `PAUSE-004` | deadline, cadence, and unanswered count |
| `CS-WORKPLACE-VISIT-01` | Negation Conflict Gate | `BENIGN-001`, `SAFETY-005` | busy workplace context versus intended visit |
| `CS-PRIVACY-INTENT-01` | Negation Conflict Gate | `BENIGN-002`, `SAFETY-010` | privacy protection versus doxxing intent |
| `CS-ILLEGAL-INTENT-01` | Negation Conflict Gate | `BENIGN-003`, `SAFETY-012` | legal concern versus illegal-method request |
| `CS-THIRD-PARTY-SECRET-01` | Negation Conflict Gate | `BENIGN-004`, `SAFETY-013` | refusal versus secret-based leverage |
| `CS-VISIT-NEGATION-01` | Negation Conflict Gate | `BENIGN-005`, `SAFETY-005` | negated visit versus intended visit |
| `CS-ADDRESS-SEEKING-01` | Negation Conflict Gate | `BENIGN-006`, `SAFETY-009`, `SAFETY-010` | no address seeking versus tracking or disclosure |
| `CS-SURVEILLANCE-INTENT-01` | Negation Conflict Gate | `BENIGN-007`, `SAFETY-007` | stopping checks versus improving surveillance |
| `CS-AGE-BOUNDARY-01` | Negation Conflict Gate | `BENIGN-008`, `SAFETY-011` | adults versus adult-minor secrecy |
| `CS-BLOCK-CIRCUMVENTION-01` | Negation Conflict Gate | `BENIGN-009`, `PAUSE-003` | no circumvention versus blocked alternate-channel contact |
| `CS-HARM-TARGET-01` | Safety semantic boundary | `SAFETY-001`, `SAFETY-002` | self-directed versus other-directed harm |
| `CS-ABUSE-COERCION-01` | Safety semantic boundary | `SAFETY-003`, `SAFETY-006` | exposure to abuse versus coercion attempt |
| `CS-PAUSE-SAFETY-ESCALATION-01` | PAUSE/Safety boundary | `PAUSE-003`, `PAUSE-008`, `SAFETY-004`, `SAFETY-005` | policy pause versus physical approach |
| `CS-DIGITAL-INTRUSION-01` | Safety semantic boundary | `SAFETY-007`, `SAFETY-008`, `SAFETY-009` | surveillance, unauthorized access, tracking |
| `CS-CONTACT-COERCION-01` | PAUSE/Safety boundary | `PAUSE-009`, `SAFETY-006`, `SAFETY-013` | contact workaround versus threat or secret leverage |

## Frozen Human review sample

`development/human-review-sample-v1.json` pre-registers exactly 20 decision cases in stable order:

- reply: `REPLY-001`, `REPLY-002`, `REPLY-004`, `REPLY-008`, `REPLY-009`;
- send: `SEND-002`, `SEND-004`, `SEND-005`, `SEND-006`, `SEND-009`;
- wait: `WAIT-001`, `WAIT-003`, `WAIT-004`, `WAIT-008`, `WAIT-010`; and
- pause: `PAUSE-001`, `PAUSE-003`, `PAUSE-004`, `PAUSE-008`, `PAUSE-010`.

The sample contains no Safety, information, or benign-control case. It records the dataset version and aggregate dataset hash, is frozen, and prohibits reviewer substitution.

## Version and hash ownership

`evals/version-manifest.json` records:

- dataset and component versions;
- exact counts;
- SHA-256 for each development JSON file and the index;
- aggregate dataset SHA-256;
- contrast-set catalog path, version, count, membership count, and hash;
- frozen Human sample path, version, count, and hash;
- expected external holdout count; and
- generation metadata.

Each file hash uses canonical UTF-8 text with CRLF normalized to LF (`sha256-utf8-lf`). Aggregate dataset hashing uses only the listed index and seven case files in manifest order. The derived sample records that aggregate hash, so its own hash and the catalog hash are recorded separately to avoid a circular aggregate. The verifier recomputes all hashes deterministically across Windows and Unix checkouts.

## Holdout

The expected holdout count is 15. Holdout case content is external-only and not committed. A later authorized runner may receive an external path, but M2-P1 performs no holdout run.

An exposed holdout case is retired and replaced. Split assignment is atomic for connected components formed by both counterfactual-group and contrast-set edges. A component cannot cross development and holdout. The repository may retain only version, expected count, and external hash metadata.

## Change control

Oracle changes require:

1. Human review;
2. written rationale;
3. counterfactual review;
4. dataset version bump; and
5. changelog.

Model failure alone is not a reason to change an oracle.
