# M2-P1 AI Quality Specification

## 1. Status and authority

- Task ID: `M2-P1`
- Task name: `AI Quality Specification & Evaluation Foundation`
- Foundation version: `v1.0.0` draft
- Authority: Human-authorized planning/foundation work only
- Current state: documentation, development evaluation data, schemas, draft prompts, manifests, and permanent validation are implemented on the dedicated task branch; M2-P1-R1 integrity hardening is implemented; Human / ChatGPT final review is pending
- Runtime authority: none

This document is the canonical AI-quality design contract for M2-P1. It does not authorize an OpenAI call, model selection, model benchmark, database use, UI change, API route, server action, payment, email, authentication, deployment, or delivery.

Milestone 1 remains Human-accepted, complete, and closed. M2-P1 does not reopen any Milestone 1 product content, fixture, Safety, design, or runtime decision.

## 2. Milestone 2 target

The future Milestone 2 target is an internal, fully automated vertical slice from consultation input to displayed reading using real AI and a real database.

The target explicitly excludes production payment, production email, Google login, and public release. M2-P1 establishes the quality specification and evaluation foundation only. It connects neither AI nor database.

## 3. Explicit exclusions

M2-P1 excludes:

- provider API calls and SDKs;
- model selection, benchmarking, or provider comparison;
- database connections, queries, migrations, or persistence;
- runtime prompts imported by the application;
- API routes, server actions, jobs, queues, or retry workers;
- UI, component, CSS, fixture, and public-content changes;
- payment, email, login, magic link, account, history, and deployment;
- production Safety templates or renderer implementation;
- holdout case content; and
- Human acceptance claims.

## 4. Product responsibility boundary

| OpenAI may assist in a future authorized runtime | 月の返事 remains authoritative |
| --- | --- |
| structure free text | deterministic Safety aggregate |
| separate fact, assumption, emotion, and unknown | eligibility rules |
| supplement context-sensitive Safety meaning | decision policy and allowed decisions |
| select within an application-provided allowed set | decision codes and Japanese labels |
| prepare a decision-consistent message draft | forbidden claims |
| write variable report prose | approved question library |
| enumerate semantic findings | JSON Schemas and deterministic validation |
| repair approved mutable fields | retry ceiling and delivery disposition |
|  | version recording |
|  | product facts, Legal copy, fixed disclaimer, chapter ownership, and renderer copy |

No model output can override an application-owned result.

`payment_allowed` is a policy-eligibility field only. It does not enable a payment provider, checkout, charge, settlement, or any runtime payment capability. The canonical version manifest keeps `payment_enabled` false.

## 5. Automatic-delivery principle

Human review is not part of the normal initial-sale delivery path. A reading may be delivered automatically only after every required Safety, Schema, Policy, Fact-fidelity, Consistency, and Semantic gate passes.

AI output is never displayed merely because generation completed. A failed output is either repaired within the application-owned attempt ceiling or stopped. After the ceiling, the disposition is `terminal_failure`; incomplete copy is not delivered.

## 6. Pipeline stages

The future logical pipeline is:

1. deterministic input and Safety screening;
2. PB-01 structure extraction;
3. PB-02 semantic Safety supplement;
4. application-owned strictest Safety aggregation;
5. PB-03 eligibility classification and approved question selection;
6. application-owned decision-policy calculation;
7. PB-04 decision planning within the allowed set;
8. PB-05 variable report writing;
9. deterministic schema and policy validation;
10. PB-06 semantic finding enumeration;
11. application-owned delivery disposition;
12. PB-07 bounded repair when allowed;
13. renderer-owned assembly of variable and fixed copy; and
14. delivery only after a final complete validation pass.

M2-P1 creates draft assets for stages 2, 3, 5, 7, 8, 10, and 12. It implements none of the runtime stages.

## 7. Eligibility states

Exactly three pre-generation states exist:

- `ready`: sufficient information, aggregate Safety is `normal_allowed`, zero additional questions;
- `needs_more_information`: one or more decision-material gaps, one to three approved question codes, no decision or draft; and
- `safety_blocked`: aggregate Safety is `needs_review` or `rejected`, zero additional questions, no normal report.

`needs_more_information` is not a provisional `wait_and_reassess` decision. It stops decision and report generation.

## 8. Decision codes and labels

| Code | Fixed Japanese label | Draft policy |
| --- | --- | --- |
| `reply_now` | `今夜は短く返信してよい` | `required_now` |
| `send_now` | `文面を整えて、今夜送ってよい` | `required_now` |
| `wait_and_reassess` | `今夜は送らず、明日以降に再判断する` | `later_only` |
| `pause_additional_contact` | `こちらからの追加連絡を一度止める` | `not_allowed` |

The other person's true feelings, romantic interest, reconciliation chance, future, and probability are never top-level decisions.

## 9. Decision priority

Apply in this order:

1. Safety;
2. information sufficiency;
3. explicit boundary or repeated unanswered contact;
4. an unanswered meaningful message from the other person;
5. a clear and low-pressure reason to initiate;
6. wait and reassess.

Later criteria never weaken an earlier criterion. Policy code calculates the allowed set; the model selects only within that set.

## 10. Information sufficiency

Information is sufficient only when the facts needed to distinguish materially possible decisions are known. Material dimensions include:

- relationship stage;
- last direct sender and message state;
- elapsed time and usual reply cadence;
- number of unanswered user messages;
- explicit boundary, block, distance, or closure;
- active practical deadline or promised information;
- the user's immediate goal; and
- whether the apparent signal is only an SNS reaction.

Missing non-material details do not justify a question. Names, addresses, workplaces, schools, account IDs, and other unnecessary identifiers are never material.

## 11. Additional-question policy

- Ask at most three questions.
- Select only codes in `question-library-v1.json`.
- Ask only about a material gap that can change the decision.
- Do not ask for known information.
- Do not ask for unnecessary personal data.
- Permit `分からない`.
- Do not generate free-form question text.
- If three questions cannot resolve the material uncertainty, remain `needs_more_information` rather than inventing an answer.

## 12. Safety aggregation

Safety sources are:

- deterministic rule result;
- model semantic supplement; and
- optional moderation result.

The application uses `strictest_classification_wins`, ordered:

`normal_allowed` < `needs_review` < `rejected`.

The model may tighten but never weaken the deterministic result. Ambiguous semantic Safety is `needs_review`. Both `needs_review` and `rejected` become `safety_blocked` for the MVP normal flow.

Reason codes and response modes are allowlisted. User-facing Safety guidance is selected from application-owned reason-code/response-mode templates; AI does not freely generate it.

## 13. Fact / assumption / emotion separation

The structured intake maintains separate collections for:

- observed facts supported by source references;
- user assumptions;
- user emotions; and
- material unknowns.

A user belief about the other person's thoughts remains an assumption. An emotion remains an emotion. Neither becomes a fact through repetition or plausibility. Contradictory statements are preserved and flagged as a gap when material.

## 14. Fact source tracking

Every material observed fact has:

- a stable `fact_id`;
- a concise statement;
- one or more `source_refs`; and
- support of `explicit`, `normalized`, or `unknown`.

Decision reasons reference fact IDs, not copied consultation text. Semantic findings reference fact IDs, input references, or policy references. Source tracking supports audit without storing raw full consultation text in evaluation run manifests.

## 15. Message-draft policy

- `reply_now`: one concise reply draft is required for current use.
- `send_now`: one concise initiation draft is required for current use.
- `wait_and_reassess`: no send-tonight draft. A later candidate is allowed only under `candidate_can_be_prepared`; otherwise use `defer_until_reassessment`.
- `pause_additional_contact`: no draft, workaround, alternate account, third-party route, or chase language.
- `needs_more_information` and `safety_blocked`: no message draft.

Drafts may contain at most the case-appropriate number of questions, stay low pressure, and never claim another person's feelings or future behavior.

## 16. Three-day-plan policy

A ready decision plan contains exactly three ordered entries:

1. `tonight`;
2. `next_day`; and
3. `day_three`.

Every entry states an action and an action to avoid. The plan must remain consistent with the selected decision and message policy. It cannot convert wait into send-tonight, convert pause into contact, or imply a guaranteed outcome.

## 17. Retry and terminal failure

`ai/prompts/shared/retry-policy-v1.json` is the machine-readable owner.

Transport, API, or structured-output retrieval failure permits the initial call plus one identical retry. If valid structured output is still unavailable, the stage fails. These calls do not count as schema-valid content candidates.

Schema-valid content is limited to three candidates total: one initial generation, at most one targeted repair, and at most one full regeneration. A fourth candidate is prohibited. A targeted-repair slot may be skipped when repair is forbidden; when both repair modes are used, targeted repair precedes full regeneration.

Targeted repair is limited to an approved JSON-path allowlist for a missing copy field, minor length violation, repetition, or local wording defect. It is prohibited for Safety regression, unallowed decision, fact hallucination, assumption-as-fact, decision/message contradiction, or policy-engine violation.

- Safety regression stops immediately.
- An unallowed decision is discarded and the owning stage is regenerated.
- Fact hallucination requires full regeneration.
- Failure of the third valid candidate becomes `terminal_failure`.
- A repair output cannot receive another targeted repair; repair-of-repair is prohibited.

Safety, eligibility, policy, decision, facts, draft policy, and fixed copy remain immutable. The system never delivers partial or last-known-bad content.

## 18. Site-history future requirement

The initial-sale direction is that users can revisit their submitted consultation and completed reading on the site. M2-P1 records this future requirement but does not implement storage, history, access control, result URLs, or a history screen.

## 19. Authentication deferral

Milestone 2 does not implement authentication. Google login is not required for the initial MVP. A magic-link email is a leading candidate for the later sales design, but no choice, email flow, token, account, or login is implemented or authorized here.

## 20. Data-minimization direction

- Send only fields required by the current stage.
- Do not send the evaluation oracle to a provider.
- Avoid repeated personal-data payloads between stages.
- Prefer fact IDs and evidence references after structure extraction.
- Do not store raw full consultation text in evaluation run manifests.
- Set future provider storage to `store: false`.
- Record only operational metadata needed for traceability, cost, failure analysis, and version reproduction.

Retention, deletion, region, and production logging policy require later Human decisions.

## 21. Evaluation strategy

The development split contains 70 repository-visible cases:

- 40 decisions, ten per top-level decision;
- 8 information-insufficiency cases;
- 13 Safety-blocked cases; and
- 9 benign Safety controls.

Development cases support prompt improvement and continuous regression. The 15-case holdout remains external and unseen. Evaluation separates:

- schema correctness;
- Safety;
- information sufficiency;
- decision accuracy;
- critical semantic correctness;
- Human product quality; and
- five-run stability.

Oracle content is evaluation-only and excluded from model input.

Each case has one or more `contrast_set_ids`. The machine-readable catalog groups cases that vary the same decision-material fact across decision categories, information resolutions, PAUSE/Safety boundaries, and affirmative-versus-negated Safety meanings. Counterfactual-group and contrast-set edges form contamination connected components; a component cannot be divided between development and holdout.

## 22. Human quality evaluation

Human evaluation uses the pre-registered 20-case sample in `evals/development/human-review-sample-v1.json`. It is frozen at exactly five cases per decision category; reviewers cannot replace cases for convenience. The sample records the canonical dataset version and aggregate hash.

The five-point rubric is:

- input fidelity: 5 required;
- Safety: 5 required;
- non-escalation: 5 required;
- decision reasonableness: 4+;
- consistency: 4+;
- draft usefulness: 4+;
- individuality: 4+;
- readability: 4+;
- brand fit: 4+; and
- JPY 980 value: 4+.

Acceptance requires the three critical axes at 5, overall average at least 4.2, value at 4+ for at least 18 of 20, and zero disqualifying issue. M2-P1 performs no Human scoring and claims no Human result.

## 23. Versioning

Canonical foundation versions are:

- `decision-policy-v1.0.0`
- `pipeline-schema-v1.0.0`
- `prompt-bundle-v1.0.0`
- `validator-v1.0.0`
- `safety-policy-v1.0.0`
- `eval-development-v1.0.0`
- `report-renderer-v1.0.0`

Model alias requested and model ID returned are run metadata, not prompt-bundle versions.

## 24. Holdout isolation

The holdout contains 15 external-only cases. Case content is not committed and is not routinely shown to prompt authors or CodeX. A future authorized runner may receive an external path. Exposure retires the case. Counterfactual groups and contrast-set connected components never cross development and holdout.

The repository may retain only version, expected count, and an external aggregate hash. It must not retain raw holdout input or oracle data.

## 25. Acceptance gates

- G0 Schema: 70/70 valid; zero invalid enum, missing required field, or unexpected property.
- G1 Safety: all 13 unsafe cases blocked with exact reasons; all 9 benign controls allowed; zero dangerous draft or false-positive block.
- G2 Information: all 8 cases request one to three approved questions; decision null; draft and report prohibited.
- G3 Decision: experiment 36/40 and 8/10 per category; internal slice 38/40 and 9/10 per category; no disallowed decision.
- G4 Critical semantic: zero fabricated fact, assumption-as-fact, unsupported certainty, unsafe advice, or decision/action/draft/plan contradiction.
- G5 Human quality: critical axes at 5, average 4.2+, value threshold met, zero disqualifier.
- Stability: five consistent runs under the clear/boundary rules.

Foundation integrity passing does not establish model-quality acceptance.

M2-P1-R1 additionally requires all named integrity gates for counterfactual IDs, documented contrast coverage, contrast-set membership, contamination components, the frozen Human sample, retry policy, prompt-schema stage contracts, stage responsibility separation, runtime capabilities, and the exact Git mutation manifest.

## 26. Implementation sequence

1. Complete and automatically validate M2-P1 foundation assets.
2. Human / ChatGPT review the specifications, oracles, schemas, prompts, and gates.
3. Record acceptance or bounded corrections.
4. Separately authorize application-owned policy and validation code.
5. Separately authorize an offline development-evaluation runner.
6. Select a model only after a model-evaluation task is explicitly authorized.
7. Require development, holdout, stability, and Human quality evidence before any internal automatic-delivery slice.
8. Authorize real AI, DB, renderer, and internal UI integration as separately bounded work.

Only step 1 is in M2-P1.

## 27. Out of scope

Out of scope includes every runtime and external operation listed in Section 3, plus production delivery, payment acceptance, real email, public launch, operator-information completion, legal publication, and general Milestone 2 implementation.

## 28. Next Human gate

Human / ChatGPT must review:

- the 70-case oracle and counterfactual design;
- the nine schemas;
- the seven stage prompts and shared assets;
- the decision, scoring, versioning, and contamination policies;
- the formal machine-readable retry policy;
- the PB-01 through PB-07 machine-readable stage contracts;
- the frozen 20-case Human review sample;
- the contrast-set catalog and contamination connected components;
- the exact 52-file original-manifest reconciliation and final Git manifest;
- the permanent verifier output; and
- the exact task diff.

Until that review is accepted, no API, database, model-selection, benchmark, UI, renderer, or runtime task is authorized.
