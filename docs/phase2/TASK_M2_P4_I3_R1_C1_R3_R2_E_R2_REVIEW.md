# M2-P4-I3-R1-C1-R3-R2-E-R2 Directional Guidance and Semantic Materiality Review

## 1. Status

Status is `implementation_pending_human_chatgpt_review`. The exact `21/21` implementation is offline-complete on the inactive successor branch. It is not Human / ChatGPT accepted, activated, or live-validated.

## 2. Product impact

The successor organizes delivery as `facts -> plausible_interpretations -> recommended_current_direction -> immediate_next_step -> reassessment_condition`. It protects factual, speaker, boundary, Privacy, and Safety ownership while allowing bounded ambiguity in human-language classification. The product target is a useful current direction, a concrete action tonight, and an observable condition for reconsideration.

## 3. Exact scope

The implementation changes exactly the authorized `21/21` paths: two existing Runtime files, nine new Runtime/Prompt/Catalog files, one unapplied migration, four evaluation records, two scripts, one review record, and three synchronization documents. No additional path is authorized.

## 4. Accepted Doctrine authority

The accepted doctrine remains: 月の返事は、恋の唯一の正解や相手の本心を断定するサービスではない。相談者が迷って動けないときに、今ある事実と複数の見方を整理し、今の時点で最も進みやすい方向を一つ示す鑑定ノートである。

Product Owner decisions remain `4/4`: dual practical meaning, `asks_for_reply != reply_demand`, apology `low/medium` flexibility, and `neutral_polite/mixed` register flexibility.

## 5. Runtime v10 identity

- Catalog: `runtime-stage-catalog-v10.0.0`
- Prompt bundle: `prompt-bundle-runtime-v10.0.0`
- Schema set: `pipeline-schema-runtime-v4.0.0`
- Topology: `split-base-candidate-v1`
- Catalog SHA-256: `f083224e2a9c7602197187ba7b043a7f2b6aa03cc0de3874231e71ca4701dc1c`

PB-02 and PB-03 are deep-equal to v9. All seven output Schema paths and hashes are unchanged. The new loader is inactive; Active Service remains `loadM2P4ProductQualityRuntimeStageCatalog`.

## 6. Grounding v2

`m2-p4-base-structured-intake-grounding-v2` calls accepted v1, deep-clones the result, filters only known resolved entries from `decision_facts.information_state.unresolved_fields`, preserves unsupported paths for fail-closed validation, and recomputes `used_context_inference`. It does not inspect natural-language text or Candidate data and does not alter semantic values. Synthetic grounding fixtures pass `8/8`; SHA-256 is `6f3c69370344f7b13a9a3426038b40d94e86a3067b3ff5abb255993772f0e6e1`.

## 7. PB-01 semantic responsibilities

PB-01 v2 preserves all v1 Base/source-isolation responsibilities and adds explicit hierarchy, qualitative cadence independent of exact elapsed minutes, resolved/unresolved consistency, and the fact-only directional-product boundary. No advice, reply, prediction, Candidate content, or interpretation-as-fact is permitted.

## 8. PB-01C semantic responsibilities

PB-01C v2 preserves Candidate isolation and Safety separation. It emits all independently supported practical meanings, separates an ordinary request for a response from a pressured reply demand, evaluates apology independently, and aggregates register across the full Candidate.

## 9. PB-04 Directional Guidance

PB-04 maps facts to reason IDs and `pre_action_check`, plausible readings to `possible_interpretations`, one current direction to `selected_decision`, tonight's first meaningful step to `actions_to_take`, and observable reconsideration to aftercare, change conditions, and review timing. Policy authority, nullable draft modes, minimal Candidate editing, degraded Candidate behavior, and final draft authority at `decision_plan.recommended_message_draft.text` remain intact.

## 10. PB-05 Directional Report

PB-05 moves the reader through known facts, plural plausible readings, one gently decisive current direction, tonight's concrete action, and an observable reassessment condition. It remains explanation-only, uses natural Japanese polite voice, avoids unsupported certainty and generic self-care, and never treats `report_content` as draft authority or claims JPY 980 value in prose.

## 11. PB-06 Materiality

PB-06 retains the fourteen-code vocabulary, exact authorities, Policy and Safety validation, Candidate fidelity, current/future distinction, and no-repair boundary. It adopts Hard factual/Safety, Flexible semantics, and Product Outcome tiers. Internal labels are not final authority; original Candidate meaning is compared with the final draft.

## 12. Semantic Disposition v4

Hard codes block regardless of Provider severity. Candidate register/apology-only internal paths are nonblocking; practical-label-only paths are conditional. `TEMPLATE_GENERICITY` and `REPETITION` are nonblocking defaults. `BRAND_TONE` blocks only for major/critical material personality drift at the final draft. Major/critical final-output materiality blocks, accepted temporal false positives remain ignored, and PB-06 findings remain persisted. Fixtures pass `12/12`; SHA-256 is `68524d4235513826e42b02eb05c3c34f548f5ac2685359a17a4e7019877c604b`.

## 13. Frozen E replay

All eight frozen PB-01 raw outputs retain their recorded hashes and pass raw Schema/source integrity, Grounding v2, grounded Schema/source integrity, and post-v2 Contextual Intake Integrity. Contextual Integrity moves from the frozen bookkeeping state `5/8` to `8/8`; only unresolved-field bookkeeping is removed, semantic values are unchanged, and Provider-output mutations remain `0`. Frozen E assets remain immutable `11/11` and the original machine verdict remains `FAIL / 6 of 14`.

## 14. v10 Fake results

All `10/10` deterministic Fake split flows match expectation: Candidate absent and dual-meaning ready flows complete; flexible register/apology and conditional practical-label findings do not independently fail; material Candidate meaning loss, missing current direction, missing immediate action, missing reassessment, and unsupported certainty fail closed. External Provider calls are `0`.

## 15. v9 parity

Ready, Safety-blocked, and semantic-blocking v9 flows are deep-equal to their committed expectations `3/3`. v9 continues to use Grounding v1 and Semantic Disposition v3. Catalog v9, v1 split Prompts, Schemas, migration 0004, and Active Runtime assets are unchanged.

## 16. Migration 0005

Migration `0005_m2_p4_directional_guidance_runtime.sql` statically admits v9 and v10 only under the split topology with Schema set v4, rejects both split bundles under legacy-six, preserves six/seven-stage orders and PB-01C skip invariants, and replaces the topology trigger/function with v2 authority. It performs no historical table UPDATE. SHA-256 is `830f375f9e1f02c95a08f3bcbf598f2a5b4a81bf11bbb80df544a9999e62e36e`; `migration_applied=false`.

## 17. Validation

Offline results: Grounding `8/8`, frozen PB-01 replay `8/8`, Materiality `12/12`, v10 Fake flows `10/10`, v9 parity `3/3`, Prompt responsibilities `12/12`, mutation rejection `14/14`, migration static PASS, Product Doctrine PASS, Product Owner decisions `4/4`, and Provider / DB / Supabase `0 / 0 / 0`.

## 18. Acceptance boundary

Automated implementation PASS is not Human / ChatGPT acceptance and does not establish Provider quality, live DB compatibility, or live Product Outcome quality. The successor remains inactive. No Runtime activation, migration application, PR, or main integration occurred.

- No Provider quality claim.
- No live DB compatibility claim.
- No live Product Outcome quality claim.
- No R4 readiness claim.
- No Runtime activation.

## 19. Provider retest unauthorized

Provider quality is unestablished. `provider_retest_ready=true` records only offline technical readiness; `provider_retest_authorized=false`. No Provider request or response was created in this task.

## 20. R4 unauthorized

`r4_ready=false` and `r4_authorized=false`. C2 and the next bounded diagnostic are also unauthorized. Active Service and main remain unchanged.
