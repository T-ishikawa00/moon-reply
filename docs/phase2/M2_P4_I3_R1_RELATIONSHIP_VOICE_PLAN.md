# M2-P4-I3-R1 Relationship & Voice Fidelity Plan

## 1. Status and authority

- Task ID: `M2-P4-I3-R1-PLAN`
- Baseline: `c85d6d122ad71569532a55887b9a3b6d93f8a288`
- Status: planning pending Human / ChatGPT review
- Task type: planning only
- Implementation authorized: no
- OpenAI calls / DB operations / migrations / holdout use in this task: `0 / 0 / 0 / 0`
- Achieved quality score: none

This package defines the evaluation and typed-context boundary for a future I3-R1 successor. It does not change or authorize Prompt, Schema, Runtime, UI, application-owned decision Policy, Safety, Supabase, migration, provider execution, E1, or holdout work.

The I3 implementation at `c85d6d122ad71569532a55887b9a3b6d93f8a288` is offline accepted. One separately Human-authorized synthetic live smoke succeeded and showed major improvement. Final I3 acceptance and merge to `main` remain pending. The observed remaining product-quality issues are repetition, irrelevant heavy change conditions, AI-facing user actions, insufficient explanation of candidate-edit value, persona preservation, relationship-aware wording, and nuance contrast coverage. This planning package authorizes only the design of the I3-R1 correction boundary.

## 2. Canonical product principle

月の返事の返信案は、「AIが考えた一般的に綺麗な文章」ではない。

目標は、その人が普段の自分のまま、相手との関係に合った距離感で、後悔しにくい形に整えた文章である。

Draft-writing precedence is fixed in this order:

1. `user_supplied_optional_message`の本人文体
2. 明示された関係性・上下関係・親密度
3. 相手から届いた実際の文面の温度と内容
4. 今回の送信目的
5. 広いrelationship chip
6. 情報不足時の中立的な初期文体

The optional candidate is the strongest source for the user's messaging voice. The consultation narrative is not evidence of the user's LINE or DM style. A candidate's typos, unnatural phrasing, excessive apology, pressure, or overlong explanation are defects to correct minimally; they are not persona traits to preserve.

The following invariants apply:

- a relationship chip alone never decides polite versus casual speech;
- a partner is not automatically casual;
- a senior contact is not automatically addressed in rigid business language;
- a former partner never implies reconciliation intent;
- a supplied candidate keeps priority over a broad relationship chip;
- no emoji, affection, invitation, question, nickname, or intimacy is added without evidence;
- register, warmth, interest, or invitation strength is not weakened without a concrete reason; and
- relationship context must never override the application-owned decision Policy.

## 3. Relationship representation

`evals/quality/m2-p4-i3-r1-relationship-taxonomy-v1.json` represents relationship context as six independent axes rather than one overloaded label:

| Axis | Values |
| --- | --- |
| `romantic_stage` | `none`, `new_acquaintance`, `dating_before_relationship`, `ambiguous`, `partner`, `former_partner`, `unknown` |
| `social_role` | `stranger`, `acquaintance`, `friend`, `close_friend`, `work_contact`, `school_contact`, `other`, `unknown` |
| `hierarchy` | `user_is_junior`, `peer`, `user_is_senior`, `none`, `unknown` |
| `familiarity` | `first_contact`, `early`, `developing`, `established`, `former`, `unknown` |
| `communication_context` | `matching_app`, `private`, `work`, `school`, `mixed`, `other`, `unknown` |
| `observed_register` | `polite`, `neutral_polite`, `casual`, `mixed`, `unknown` |

Each axis records its definition, permitted evidence, prohibited inference, effect on wording, non-effect boundary, and unknown handling. The axes may adjust register, distance, intimacy, display of affection, invitation strength, whether to add a question, and caution around boundaries. They must not select, widen, narrow, or override an application-owned decision.

Unknown values remain explicit. The system must not fill hierarchy, romantic stage, familiarity, or register from stereotypes. When evidence conflicts, the future extractor must retain source references, separate explicit from inferred material, and mark unresolved fields instead of silently choosing a convenient value.

## 4. Candidate-style preservation

`evals/quality/m2-p4-i3-r1-style-preservation-rubric-v1.json` fixes ten observable candidate-style dimensions:

1. `register`: polite / neutral polite / casual / mixed
2. `sentence_length`: terse / short / medium / long
3. `sentence_ending`: formal / neutral / soft / playful / mixed
4. `punctuation`: sparse / standard / expressive
5. `emoji_usage`: none / restrained / frequent
6. `exclamation_usage`: none / restrained / frequent
7. `softness`: low / medium / high
8. `directness`: indirect / balanced / direct
9. `invitation_style`: none / tentative / direct / practical
10. `reply_pressure`: low / medium / high

Preservation means maintaining the candidate's recognizable voice and intended meaning, not copying every surface defect. A future implementation must not normalize every case into the same polished polite register. It must not flip casual and polite speech, mechanically add or delete emoji, materially change punctuation energy, raise emotional temperature without support, or suppress expressed interest or an invitation without support. It may correct typos and unnaturalness and may lightly reduce over-explanation, excessive apology, or pressure.

## 5. Evaluation rubric and hard gates

The future evaluator scores each applicable axis from 1 to 5:

- `relationship_fit`
- `persona_preservation`
- `incoming_message_fit`
- `hierarchy_fit`
- `intimacy_control`
- `purpose_fulfillment`
- `candidate_meaning_fidelity`
- `naturalness`
- `copy_meaning_fidelity`
- `copy_readiness`
- `non_stereotyping`
- `jpy_980_value`

The following are hard fails:

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

Future acceptance is proposed as:

- hard fails: `0`;
- `relationship_fit >= 4` for every relationship contrast case;
- `persona_preservation >= 4` and `candidate_meaning_fidelity >= 4` for every candidate-present case;
- `hierarchy_fit >= 4` for every hierarchy case;
- overall average `>= 4.2`, without rounding up;
- exact expected decision for every decision-scored case; and
- holdout use `0`.

This planning task does not run the evaluator and claims no achieved score.

## 6. Exact synthetic contrast suite

`evals/quality/m2-p4-i3-r1-contrast-suite-v1.json` contains exactly 32 synthetic cases:

| Category | Count | Controlled change |
| --- | ---: | --- |
| `RELATIONSHIP_ONLY` | 8 | Relationship dimensions only |
| `CANDIDATE_STYLE_ONLY` | 8 | Candidate style only |
| `INCOMING_MESSAGE_ONLY` | 8 | Incoming wording and response obligation only |
| `PRECEDENCE_INTERSECTION` | 8 | Deliberate tension between candidate voice and relationship context |
| Total | 32 | — |

Every case is fictional. The suite contains no real person, real user, raw database record, full UUID, or external evaluation case. Implementations may not branch on case IDs or map exact input strings to expected output. The suite evaluates general behavior from typed material.

The relationship-only cases keep the meaningful unanswered incoming message, consultation purpose, absent candidate, normal Safety, and absent boundary fixed. Their decision remains `reply_now`; wording varies primarily in register, closeness, invitation strength, explanation, and length.

The candidate-style cases keep relationship, incoming message, purpose, Safety, and boundary fixed. Decision and core meaning remain fixed while voice is preserved and only defects are minimally corrected. The eight results must not collapse into one generic polite style.

The incoming-message cases keep relationship and candidate fixed. They distinguish an invitation, conditional openness, soft closure, direct availability question, warm thanks, other-person-led next contact, expressive invitation, and practical schedule confirmation. `また連絡するね` and a low-obligation `また機会があれば` are not forced into `reply_now`; their expected `wait_and_reassess` decisions follow the accepted Policy because no unanswered meaningful message with a reasonable response expectation is present.

The precedence cases test that candidate voice remains recognizable, relationship context supplies a ceiling on unsupported intimacy and a correction for distance or hierarchy, incoming wording controls content and response obligation, and a broad relationship label never rewrites the user's persona.

## 7. Current UI decision

Relationship chips are not expanded in this task.

Encoding every senior, junior, close friend, first meeting, or other nuance as a chip would make the form rigid and cognitively expensive. Users can describe relationship nuance naturally in free text. A future PB-01 successor should first extract typed relationship detail from free text, while the broad chip remains a fallback and contradiction-detection signal. Only if contrast evaluation shows unstable extraction should a later task consider the minimum additional UI.

Possible future inputs may include:

- 普段の話し方: 落ち着いた / やわらかい / 明るめ
- 関係の補足: 任意free text

These are candidates only. This plan does not adopt them and does not recommend a large new chip set.

## 8. Proposed typed writing context

A future versioned PB-01 successor may add a `writing_context` object separate from `decision_facts`:

- `relationship_dimensions`
- `candidate_style_profile`
- `incoming_message_profile`
- `explicit_style_evidence`
- `inferred_style_evidence`
- `unresolved_style_fields`
- `source_refs`

The separation is mandatory:

- `writing_context` is input to writing quality only and is not input to decision Policy;
- candidate style is extracted only from `user_supplied_optional_message`;
- explanatory prose in the consultation body is not treated as the user's message style;
- relationship nuance may use both free text and the broad chip;
- explicit, inferred, and unresolved material remain distinguishable;
- hierarchy and intimacy are never inferred without support;
- decision selection never uses raw consultation-text keywords; and
- source references must point to typed evidence, not to case IDs or expected results.

Candidate future Prompt successors are:

- PB-01 v4: typed writing-context extraction
- PB-04 v4: relationship-aware, persona-preserving draft
- PB-05 v4: relationship-aware explanation
- PB-06 v3: persona discontinuity, hierarchy, and intimacy validation

These names are planning candidates. Prompt, Schema, and Runtime changes require a separate task after planning acceptance.

## 9. Future execution sequence

1. Phase A — Human / ChatGPT acceptance of this R1 planning package.
2. Phase B — typed writing-context implementation with OpenAI calls `0` and DB operations `0`.
3. Phase C — offline structural and accepted-Policy validation of all 32 cases.
4. Phase D — separately Human-authorized 12-case provider diagnostic: relationship-only 4, candidate-style 3, incoming-message 3, precedence intersection 2.
5. Phase E — R1 correction only if evidence requires it.
6. Phase F — the existing E1 12-case diagnostic, 70-case regression, and 20-case Human review under their own authorization.

This task does not start provider execution, E1, the 70-case run, the 20-case review, or any external evaluation.

## 10. Planning acceptance checks

Planning review must verify:

- the relationship taxonomy has all six axes and all required evidence/inference boundaries;
- the style taxonomy has all ten dimensions;
- the rubric has the fixed 1–5 scale, all hard fails, and future thresholds;
- the suite parses and contains exact category counts `8 / 8 / 8 / 8`, total `32`;
- duplicate case IDs are `0`;
- no case contains real-person data, raw database material, or full UUIDs;
- no implementation guidance permits case-ID routing or input-string mapping;
- runtime, Prompt, Schema, UI, Policy, accepted snapshot, development-set, and external-evaluation diffs are `0`;
- exact mutation scope is `9/9`; and
- `git diff --check` passes.

Acceptance of this document would accept planning only. It would not accept I3 finally, merge I3 or I3-R1 to `main`, authorize implementation, or complete Milestone 2.
