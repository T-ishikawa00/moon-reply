# M2-P4-I3-R1 Interaction, Relationship & Voice Fidelity Final Plan

## 1. Status and authority

- Task ID: `M2-P4-I3-R1-FINAL-PLAN`
- Baseline / prior planning commit: `ec7cd53884ab4056c78d2596c609baef5701274a`
- Final planning review correction base: `3bfd436dec7edf150408533a610f359035c218a9`
- Branch: `docs/m2-p4-i3-r1-final-planning`
- Status: final planning pending Human / ChatGPT review
- Task type: planning finalization only
- Runtime implementation authorized: no
- Achieved quality score: none
- OpenAI calls / DB operations / migrations / holdout use / external evaluation material / real-user data: `0 / 0 / 0 / 0 / 0 / 0`

The I3 implementation is offline accepted at `c85d6d122ad71569532a55887b9a3b6d93f8a288`. One separately Human-authorized synthetic live smoke succeeded. Final I3 acceptance and merge to `main` remain pending. This package does not change or authorize Runtime, Prompt, Schema, UI, application-owned Policy, Safety, Supabase, migrations, provider execution, holdout work, or E1.

Acceptance of this package finalizes the planning boundary only. A future Runtime implementation may be considered only in a separately authorized task after this package is accepted.

## 2. Scope and Layer 1 preservation

The six dedicated v1 plan/review/JSON/capability assets introduced by the nine-path commit at `ec7cd53884ab4056c78d2596c609baef5701274a` are immutable Layer 1 foundation. The same commit also updated three rolling status documents; those three documents are updated again only because they are explicitly included in this task's exact manifest. In particular:

- `evals/quality/m2-p4-i3-r1-contrast-suite-v1.json` remains the exact 32-case source;
- all v1 case IDs, expected values, and case content are copied into the v2 canonical suite without modifying the v1 file;
- the six-axis relationship taxonomy and ten-dimension style rubric remain versioned v1 foundations; and
- no dedicated v1 plan, review, taxonomy, rubric, suite, or capability asset is edited by this task.

This task is restricted to the exact 12 paths listed in `evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json`. No wildcard or successor-path authority is implied.

## 3. Canonical product principle

月の返事の返信案は、AIが一般的に綺麗だと考えた文章ではない。

目標は、その人が普段の自分のまま、今回伝えたい意味を変えず、相手との関係に合った距離感で、後悔しにくい形に整えた文章である。

Two voices are deliberately separate:

- Draft voice: the user's own messaging persona.
- Report voice: the calm adult polite voice of 月の返事.

The report may be composed in calm adult polite Japanese. The recommended draft must not be normalized into the report's voice.

## 4. Final writing precedence

Draft generation precedence is fixed in this order:

1. Safety, consent, explicit boundaries, and legal or professional limits
2. What the user explicitly does not want to do
3. What the user wants to achieve in this consultation
4. Unanswered questions and practical reply obligations from the other person
5. The candidate's meaning and strength of promises, invitations, affection, apology, and pressure
6. The candidate's own surface voice
7. Explicit relationship, hierarchy, and intimacy facts
8. The actual incoming message's temperature, length, and dialogue role
9. A broad relationship chip
10. A neutral initial style when information is insufficient

Consequences:

- The candidate outranks a broad relationship chip but never outranks Safety or an explicit boundary.
- The draft does not imitate the other person's style by changing the user's persona.
- Consultation narrative prose is not evidence of the user's LINE or DM voice.
- Probable typos and unnaturalness are not preserved as identity.
- Dialect, sentence endings, emoji, and short-message patterns are not mechanically standardized.
- Coercion, threat, manipulation, or deception is never strengthened as style.

## 5. Context taxonomy v2

`evals/quality/m2-p4-i3-r1-context-taxonomy-v2.json` preserves the six relationship dimensions:

- `romantic_stage`
- `social_role`
- `hierarchy`
- `familiarity`
- `communication_context`
- `observed_register`

Every dimension carries `effect_class`, `explicit_evidence`, `inferred_evidence`, `unresolved`, and `source_refs`. Confidence prose or numeric confidence is prohibited. Missing material remains `unknown`; general advice and stereotypes cannot fill it.

Relationship facts are classified per typed fact, not per entire relationship:

- `writing_only`: ordinary friend, new acquaintance, ordinary senior/junior, or established-partner wording calibration.
- `decision_material`: an explicit relationship end, reply duty, changed access, or professional restriction that may enter a future application-owned decision contract.
- `safety_material`: explicit no-contact, evaluation authority, teacher/student authority, a minor, professional boundary, coercion or harassment, block/restriction, or authority used to obtain compliance.

A broad chip alone cannot create decision or Safety authority. Future application-owned contracts remain responsible for decisions and Safety.

### Message ownership and conversation phase

Every message is typed by:

- `message_id`
- `author`: `user / other_person / third_party / unknown`
- `status`: `incoming / sent_by_user / unsent_candidate / quoted_history / consultation_narrative / unknown`
- `sequence`
- explicit, inferred, or unresolved evidence state
- `source_refs`

The model must not confuse an unsent candidate with a sent message, another person's wording with the user's persona, quoted history with the current turn, or consultation narrative with a style sample.

### Dialogue acts and reply obligations

Allowed dialogue acts are:

`answer`, `question`, `thanks`, `apology`, `invitation`, `schedule_coordination`, `practical_notice`, `affection_expression`, `boundary`, `decline`, `hold`, `conversation_closure`, `promised_future_contact`, `other`, and `unknown`.

Typed fields retain unanswered obligations, practical requirements, closure signals, response expectations, and source references. A concrete incoming question is answered before optional warmth. A closure or other-person-led future contact is not reopened by adding a question.

### Candidate intent, user goal, and explicit constraints

Candidate communicative intent separately types gratitude, apology, question count, invitation presence and specificity, affection, commitment, response pressure, boundary strength, closure, and practical requirements.

User goal values include polite response, moving closer, maintaining distance, schedule only, apology, conflict repair, decline without false hope, ending contact, affection expression, relationship clarification, other, and unknown.

Explicit user constraints include no emoji, no self-invitation, no late-night send, no phone call, no private work contact, no follow-up, and preserved polite or casual register. Only explicit constraints are hard requirements.

### Pattern, channel, language, repeat state, and privacy

Communication patterns cover usual register, length, emoji use, response cadence, initiator, reciprocal style, evidence, and unresolved fields. They apply only when explicitly supplied.

Channels are LINE, Instagram DM, matching app, SMS, work chat, email, other, or unknown. Relative timing is immediate, same day, late night, next day, delayed, or unknown. Timing alone never forces a send/wait decision, and exact time is never fabricated.

Language context preserves primary and mixed language, established dialect or shared expression, intentional nonstandard expression, probable typo, and unresolved material. Supported dialect and idiolect are not normalized away.

Repeat state distinguishes first assessment, repeated without material change, repeated with material change, and unknown. Privacy markers record only categories such as name, phone, email, account, workplace, school, address, or third-party sensitive detail; raw PII is not stored in planning assets.

## 6. Surface voice and communicative-intent fidelity

`evals/quality/m2-p4-i3-r1-style-intent-rubric-v2.json` preserves all ten v1 surface dimensions:

1. register
2. sentence length
3. sentence ending
4. punctuation
5. emoji usage
6. exclamation usage
7. softness
8. directness
9. invitation style
10. reply pressure

Style Delta compares the unsent candidate with the recommended draft. Communicative Intent Delta separately compares gratitude, apology, question count, invitation presence and specificity, affection, commitment, response pressure, boundary, closure, and practical-requirement fulfillment.

Proposed deterministic signals include character-length ratio, sentence count, question-mark count, emoji count, exclamation count, register level, invitation presence, apology presence, added commitment, added affection, and added reply pressure. These are evidence signals; a large length ratio alone is not a universal failure.

## 7. Hard fails v2

The ten v1 hard fails remain:

- `UNJUSTIFIED_REGISTER_SHIFT`
- `PERSONA_DISCONTINUITY`
- `HIERARCHY_MISMATCH`
- `UNSUPPORTED_INTIMACY_INCREASE`
- `UNSUPPORTED_INTIMACY_DECREASE`
- `CANDIDATE_MEANING_CHANGED`
- `RELATIONSHIP_STEREOTYPE`
- `INCOMING_QUESTION_UNANSWERED`
- `RELATIONSHIP_ONLY_WRONG_DECISION`
- `OPTIONAL_MESSAGE_IGNORED`

Fifteen v2 hard fails are added:

- `MESSAGE_OWNER_CONFUSION`
- `SENT_UNSENT_STATUS_CONFUSION`
- `CONVERSATION_ORDER_CONFUSION`
- `DIALOGUE_ACT_UNFULFILLED`
- `USER_CONSTRAINT_VIOLATED`
- `UNSUPPORTED_QUESTION_ADDED`
- `UNSUPPORTED_INVITATION_ADDED`
- `UNSUPPORTED_INVITATION_STRENGTHENED`
- `UNSUPPORTED_AFFECTION_STRENGTHENED`
- `UNSUPPORTED_COMMITMENT_ADDED`
- `MANIPULATIVE_TACTIC_AMPLIFIED`
- `PII_REPRODUCED_UNNECESSARILY`
- `DIALECT_OR_IDIOLECT_ERASED`
- `REPEAT_CONSULTATION_ESCALATION`
- `DIRECT_SEND_WITHOUT_USER_CONFIRMATION`

A hard fail requires a material change to meaning, persona, relationship fit, dialogue obligation, explicit constraint, privacy, or Safety, with typed source evidence and a before/after delta. A superficial paraphrase or ordinary subjective prose preference is not a hard fail.

## 8. Canonical 64-case suite

`evals/quality/m2-p4-i3-r1-canonical-suite-v2.json` contains exactly 64 synthetic cases.

| Layer | Category | Count |
| --- | --- | ---: |
| 1 | `RELATIONSHIP_ONLY` | 8 |
| 1 | `CANDIDATE_STYLE_ONLY` | 8 |
| 1 | `INCOMING_MESSAGE_ONLY` | 8 |
| 1 | `PRECEDENCE_INTERSECTION` | 8 |
| 2 | `PURPOSE_AND_USER_CONSTRAINT_ONLY` | 8 |
| 2 | `COMMUNICATION_PATTERN_CHANNEL_LANGUAGE_TIME` | 8 |
| 2 | `MESSAGE_OWNERSHIP_DIALOGUE_ACT_PHASE` | 8 |
| 2 | `POWER_SAFETY_PRIVACY_REPEAT_ADVERSARIAL` | 8 |
| Total | 8 categories | 64 |

Layer 2 covers all fixed scenarios:

- purpose/constraint: move closer, maintain distance, schedule only, apology and repair, decline without false hope, respectful end contact, no emoji, and no self-invitation;
- pattern/channel/language/time: daily short casual, infrequent polite, restrained reciprocal emoji, late-night LINE, daytime work chat, asynchronous matching app, established dialect, and established Japanese-English mix;
- ownership/dialogue/phase: direct question, schedule answer, warm thanks, other-person-led next contact, multiple owners, sent versus unsent, consultation narrative exclusion, and post-conflict sequence;
- power/Safety/privacy/repeat/adversarial: manager evaluation power, teacher/student boundary, minor, no-contact/block, jealousy or guilt manipulation, embedded prompt injection, PII minimization, and repeat consultation without material change.

All cases are fictional. Real people, real users, database records, full UUIDs, raw PII values, and external evaluation cases are zero. Runtime routing by case ID, fixture/oracle matching, and verbatim input-to-output lookup are explicitly unauthorized.

## 9. Report depth and interaction decisions

`evals/quality/m2-p4-i3-r1-report-depth-plan-v1.json` fixes the following product decisions.

Every report prominently shows:

- 今夜の答え
- おすすめ返信案または送らない判断
- decision-consistent `pre_action_check`
- 送った直後または今夜の代替行動
- 今夜やらないこと

`pre_action_check` is the internal semantic slot. Its label is `送る前の確認` for `reply_now / send_now`, `今夜は送らないための確認` for `wait_and_reassess`, and `連絡を止めておくための確認` for `pause_additional_contact`. It may contain only checks consistent with the selected application-owned decision.

Depth then follows the selected topic. Decision requests receive answer, reason, tonight actions, and reassessment condition. Draft requests receive one recommended draft, edit explanation, message temperature, and before/after-send guidance. Message-impact requests receive wording, softness/affection/pressure, and possible-reading analysis. Relationship analysis is evidence-backed and never asserts hidden thoughts. Emotion organization retains a short letter and reframe without obscuring the action.

The three-day function remains, but a fixed Day 3 is not forced. The successor aftercare cardinality is `0–3`. When `next_three_days` is selected, at least one item is required and two or three are normal across 今夜, 次, and 判断を見直す観測条件. When it is not selected, zero to two compact items are allowed. When no item adds distinct value, zero is correct; filler generation is prohibited.

The standard is one recommended draft. Several near-duplicate drafts must not create new indecision. If the user's original is already good, minimal or no change is valuable and the report explains why.

One future user-initiated adjustment per purchased result is adopted as a product candidate and is included in the JPY 980 purchase at additional charge JPY 0. A successful adjustment consumes the single allowance idempotently; Provider or technical failure does not consume it. Manual user editing has no limit. Allowed AI adjustments are shorter, softer, brighter, slightly softer honorifics, or explicitly bounded emoji changes. The adjustment cannot change decision, purpose, invitation presence, affection, commitment, pressure, boundary, or Safety. It is not automatic retry, Repair, or fallback, and no UI is implemented here.

The AI never sends externally. The user reads, optionally edits, copies, and personally sends the draft.

## 10. Successor Schema plan

The current Schema remains unchanged. Its minimum counts can force unnecessary possibilities, heavy change conditions, disclaimer repetition, a fixed three-day shape, and a long ending.

The future Decision Plan proposal allows:

- one recommended draft when applicable;
- draft-edit metadata only with a draft;
- aftercare plan: 0–3 items across `tonight / next / reassessment_condition`, with minimum 1 and normally 2–3 only when `next_three_days` is selected, 0–2 otherwise, and 0 when no distinct value exists;
- change conditions: 0–4;
- material unknowns: 0–4;
- model-generated limitations: 0–2; and
- one fixed general limitation owned by the renderer.

The future Report Content proposal allows:

- short letter: 1–3;
- possible interpretations: 0–3;
- anxiety reframe: 0–2;
- action rationales: 0–4;
- draft context only when a draft exists;
- aftercare commentary: 0–3, exactly index-aligned with the plan; plan 0 requires commentary 0;
- change-condition commentary: 0–4;
- `unknowns_commentary`: removed;
- closing lines: 1–2; and
- topic-dependent empty arrays or null while selected-request fulfillment remains mandatory.

The future Structured Intake successor candidate is `pipeline-schema-v4.0.0` and requires top-level `writing_context`. Its fields are relationship dimensions, message ownership, incoming profile, candidate style and communicative intent, user goal and explicit constraints, communication pattern, channel/timing, language/expression, repeat state, privacy markers, unresolved writing fields, and source references. `writing_context` remains separate from `decision_facts` and cannot select a decision by itself. Consultation narrative is not candidate-style evidence; explicit/inferred/unresolved remain separate; raw PII and raw candidate text are not copied into profiles; source references never point to case IDs or oracles.

Implementation requires a separate task.

## 11. Application-owned quality disposition

`evals/quality/m2-p4-i3-r1-quality-gate-plan-v1.json` separates subjective prose QA from material user-facing failure.

Always nonblocking QA findings are `TEMPLATE_GENERICITY`, `BRAND_TONE`, and `REPETITION`. Even if a model labels one major, it is logged for improvement and does not terminally block an ordinary consultation by itself.

Material `FACT_FIDELITY`, `ASSUMPTION_AS_FACT`, `DECISION_ALLOWED`, `SAFETY_REGRESSION`, `UNSUPPORTED_CERTAINTY`, `ACTION_CONSISTENCY`, `THREE_DAY_PLAN_CONSISTENCY`, `MESSAGE_POLICY_CONSISTENCY`, and `REVIEW_CONDITION_PRESENT` remain blocking.

`REQUIRED_SECTION_MEANING` blocks when the selected request is substantively unanswered; weaker warmth or specificity is nonblocking. `MESSAGE_POLICY_CONSISTENCY` is nonblocking when usable but slightly stiff, and blocking when not copy-ready, candidate meaning changes, the decision is contradicted, or an explicit constraint is violated.

Deterministic candidates cover absent draft, owner/status mismatch, added question/invitation/emoji, register shift, length ratio, invitation/commitment increase, explicit-constraint violation, and decision/draft consistency. This task does not implement them.

All 25 hard fails now have a planning ownership record with primary owner, secondary owner, runtime-blocking candidacy, required evidence, and deterministic feasibility. Allowed owners are application deterministic checks, semantic validators with application disposition, Provider diagnostics only, and Human review only. Subjective persona or dialect quality alone is not terminal. Fact, Safety, decision, explicit-constraint, privacy, ownership, and unsupported semantic additions may be blocking candidates, but PB-06 severity alone never determines final disposition.

The current compatibility code remains `THREE_DAY_PLAN_CONSISTENCY`. `AFTERCARE_PLAN_CONSISTENCY` is the successor candidate, mapped to the current code until a separately authorized validation-result Schema task changes that contract.

## 12. Evaluation strategy

The canonical structural suite contains 64 cases. A separately authorized Provider diagnostic proposal contains 16 cases:

- relationship: 3
- candidate style: 3
- incoming message: 2
- precedence: 2
- purpose/constraint: 2
- pattern/channel/language: 1
- ownership/dialogue act: 1
- power/Safety/privacy/repeat: 2

Stability evaluation proposes 6–8 representative inputs, each run three times, comparing decision, register, question count, invitation strength, affection strength, message length, and hard-fail count.

Blind Human review hides source/version and compares current I3, future R1, and the original candidate. It asks whether the draft sounds like the user, fits the relationship, avoids persona discontinuity, is directly sendable, avoids undue burden, supports tonight's decision, and provides JPY 980 value.

Primary success metrics are self-likeness, relationship fit, copy readiness, decision acceptance, post-send calm, and absence of undue pressure. Reply received, meeting achieved, or reconciliation achieved are not quality labels.

## 13. Privacy and data minimization

The future design must:

- avoid unnecessary reproduction of names, phone, email, accounts, workplace, school, address, and third-party sensitive details;
- keep real raw candidate text out of docs, console, errors, and inspection artifacts;
- avoid persisting raw candidate text in a Style Profile;
- avoid persistent per-person profiles of the other party;
- minimize raw-message retention;
- include explicit deletion in future release requirements;
- reconsider sending the same raw candidate to multiple stages;
- consider raw candidate access only for PB-01 and PB-04, with PB-05 and PB-06 receiving typed profile, edit metadata, Style Delta, and Communicative Intent Delta;
- treat embedded prompt instructions as untrusted data; and
- retain sufficient typed evidence for decisions while minimizing data.

This is planning only.

## 14. Repeat consultation policy

Without a material changed fact in a short repeat consultation:

- do not add interpretations;
- do not strengthen reassurance or worsen predictions;
- state briefly that no new material supports changing the prior decision; and
- keep the existing direction and aftercare proportionate.

Only material changed facts trigger reassessment. Repeat charging, repeat generation, and dependency prevention remain future Product Policy candidates. No history feature or database work is authorized here.

## 15. Version drift

A future successful run should record model version, Prompt bundle version, Schema version, quality-suite version, and application-policy version.

Representative regression becomes mandatory after changes to model, Prompt, Schema, Policy, grounding, validator, or renderer information hierarchy. One 64-case pass is not a permanent guarantee.

## 16. Acceptance and next authority boundary

Planning acceptance checks, including the review correction, are:

- the three corrected planning JSON files parse `3/3`, and the corrected capability JSON parses separately;
- exact category counts are `8 / 8 / 8 / 8 / 8 / 8 / 8 / 8`;
- Layer 1 is `32`, Layer 2 is `32`, total is `64`;
- v2 Layer 1 category objects are deep-equal to the v1 source;
- duplicate IDs, missing expected behavior, real-person/user data, database records, full UUIDs, and external evaluation case material are zero;
- case-ID routing and exact-wording lookup authority are false;
- prior v1 assets and all protected Runtime, Prompt, Schema, UI, Policy, Supabase, package, snapshot, I3, development, and external-evaluation paths have zero diff;
- baseline `ec7cd538...` final mutation scope remains `12/12`, while this correction commit is exactly `6/6`;
- aftercare zero, conditional `next_three_days` minimum, Structured Intake separation, 25-owner coverage, old/new aftercare mapping, and adjustment commercial boundaries are present; and
- `git diff --check` passes.

Acceptance does not accept I3 finally, merge anything to `main`, authorize Runtime implementation, start E1, authorize provider execution, or complete Milestone 2.
