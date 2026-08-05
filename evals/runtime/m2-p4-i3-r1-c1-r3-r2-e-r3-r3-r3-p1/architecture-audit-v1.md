# v12 Implementation Architecture Audit

Task: M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P1

Status: v12_implementation_decomposition_ready_pending_human_chatgpt_review

Baseline: 366b99b19ccf7f2aabe92fa760d07521de5e4104

This is a read-only architecture audit and planning decomposition. It changes no Runtime, Prompt, Catalog, Schema, evaluator, semantic disposition, UI, API route, payment path, fixture, migration, Active Service, Active Runtime, or main state. Provider / DB / Supabase operations are 0 / 0 / 0.

## Authority and integrity

Preflight passed before branch creation:

- Expected source branch, HEAD, upstream, and parent matched.
- HEAD and upstream were 366b99b19ccf7f2aabe92fa760d07521de5e4104.
- Parent was f0b5dff36b63a9deaf5f87f8825911b0510ac0b1.
- main and origin/main were 61e33a10e195fad17e253a6b9719217e1992f273.
- Worktree and stash were empty.
- Evidence Commit B remains an ancestor.
- Existing Review Packet 11/11, frozen Evidence 10/10, and frozen Package 7/7 were unchanged.
- The consumed marker was present and unchanged.
- Authorization remained consumed and rerun_authorized=false.
- The existing Product Owner decision verifier passed 39/39.

The source contract records Git blob SHA, raw SHA-256, and byte count for all 44 authorities used. It includes the Product Owner decision and charter, frozen accepted-result evidence, Runtime types and pipeline, every catalog identity from v2 through v11, legacy and split Schemas, API/service/repository wiring, the current renderer, and the actual request/purchase surfaces.

## Executive finding

The current active service is internally consistent only because it still loads legacy catalog v4. The repository already contains inactive split catalogs v9 through v11 and the pipeline can return SplitCompletedAssessment, but the UI lies to TypeScript by declaring every ready result to be legacy CompletedAssessment.

This is not a theoretical typing nicety. A split ready result reaches RuntimeAssessmentNote and deterministically fails at decisionPlan.three_day_plan.length because split results expose aftercare_plan instead. If that first failure were patched alone, message_temperature=null would produce another property-access exception. A passing static typecheck currently masks both defects.

The customer-facing presentation has a second architecture problem: there is no projection boundary. The complete persisted report is handed directly to a fixed eight-part renderer. requestedTopics changes navigation links and limited draft-absence copy, but it does not select visible sections. Internal evidence exists for audit, yet the UI treats field existence as a mandate to render it.

The payment finding is equally clear: payment is absent. The repository has a fixture-only purchase preview with transactionState=not_started, provider=unselected, a disabled button, no checkout/payment API route, and no payment SDK dependency. Therefore this repository cannot establish implemented-and-verified pre-payment Safety. It can only establish that no request, blocked or otherwise, can currently be charged.

## A. Runtime result union

### Exact ready and stop shapes

| Variant | Discriminator | Exact payload |
| --- | --- | --- |
| Legacy ready | eligibility=ready and report.schemaVersion=m2-p3-runtime-report-v1 | requestId, runId, eligibility, decision, RuntimeReport with DecisionPlan v1 and ReportContent v1, decisionCard, duplicate, usage |
| Split ready | eligibility=ready and report.schemaVersion=m2-p4-split-runtime-report-v1 | requestId, runId, eligibility, decision, SplitRuntimeReportV1 with SplitDecisionPlanV2 and SplitReportContentV2, decisionCard, duplicate, usage |
| Safety blocked | eligibility=safety_blocked | requestId, runId, eligibility, questionCodes=[], duplicate, usage; no decision, report, or decisionCard |
| Needs more information | eligibility=needs_more_information | requestId, runId, eligibility, zero to three questionCodes, duplicate, usage; no decision, report, or decisionCard |

eligibility alone is insufficient for ready-result discrimination because both ready members share the same value. report.schemaVersion is the required second discriminator.

### Runtime identity to output mapping

| Catalog | Service state | Topology | Ready output |
| --- | --- | --- | --- |
| v2 | historical/inactive | legacy-six-v1 | legacy ready |
| v3 | inactive | legacy-six-v1 | legacy ready |
| v4 | active | legacy-six-v1 | legacy ready |
| v5 | inactive | legacy-six-v1 | legacy ready |
| v6 | inactive | legacy-six-v1 | legacy ready |
| v7 | inactive | legacy-six-v1 | legacy ready |
| v8 | inactive | legacy-six-v1 | legacy ready |
| v9 | inactive | split-base-candidate-v1 | split ready |
| v10 | inactive | split-base-candidate-v1 | split ready |
| v11 | inactive | split-base-candidate-v1 | split ready |

The active service imports loadM2P4ProductQualityRuntimeStageCatalog, which loads runtime-stage-catalog-v4.0.0, prompt-bundle-runtime-v4.0.0, and pipeline-schema-runtime-v3.0.0. The split loaders are present but not selected by the active service.

The frozen E-R3 accepted structures confirm the split shape rather than merely suggesting it: E-R3-01, E-R3-02, and E-R3-04 contain split ready reports; E-R3-03 contains only safety_blocked; E-R3-05 and E-R3-06 have no accepted final_result.

## B. Current type narrowing

Result: unsafe.

RuntimeAssessmentForm defines isCompleted as eligibility===ready while declaring the result to be legacy CompletedAssessment. AssessmentExecutionResult actually has two ready members. The function is therefore a false user-defined type predicate.

The masking chain is:

1. response.json is treated as unknown.
2. payload.data is cast directly to AssessmentExecutionResult without runtime decoding.
3. isCompleted claims every ready member is legacy.
4. RuntimeAssessmentNote accepts only CompletedAssessment.
5. TypeScript checks the renderer against the false predicate, not the wire shape.

SplitCompletedAssessment can therefore reach RuntimeAssessmentNote. Static typecheck does not prove runtime compatibility.

Duplicate hydration has the same weakness at a second boundary. SupabaseAssessmentRepository returns report_json and decision_card_json through a direct cast to CompletedAssessment | SplitCompletedAssessment without validating report.schemaVersion or the nested shape.

Required correction:

- Decode the wire and persisted union.
- Discriminate non-ready by eligibility.
- For ready, discriminate by report.schemaVersion.
- Reject mixed, unknown, or incomplete shapes.
- Project either valid ready shape into a single CustomerAssessmentProjection.
- Never repair an invalid payload by silently assuming legacy.

## C. Rendering compatibility

The complete machine-readable matrix is in runtime-output-compatibility-matrix-v1.json. The material findings are:

| Consumer concept | Legacy source | Split source | Split nullability | Current result |
| --- | --- | --- | --- | --- |
| Final draft | decisionPlan.message_draft | decisionPlan.recommended_message_draft | nullable | Split draft is silently omitted because only the legacy path is checked |
| Immediate/aftercare plan | decisionPlan.three_day_plan | decisionPlan.aftercare_plan | array; split avoid may be null | Split ready throws when three_day_plan.length is read |
| Plan commentary | content.three_day_plan_commentary | content.aftercare_commentary | split array may be empty | Split field is undefined under the current legacy access |
| Message temperature | content.message_temperature | same path | nullable in split | No guard; null causes a property-access exception |
| Relationship summary | content.relationship_summary | same path | nullable in split | React renders null as empty, leaving a blank semantic section |
| Decision | decisionPlan.selected_decision | same path | non-null | Compatible |
| Review timing | decisionPlan.review_timing.when | same path | non-null | Compatible |
| Change conditions | decisionPlan.change_conditions | same path | non-null | Structured conditions are ignored; commentary alone is rendered |
| Final draft surface | ArtifactMessageDraft blockquote | no current split surface | nullable | No explicit copy control; split draft is unavailable |

The first deterministic split-ready failure occurs before JSX rendering when threeDayPlanAligned reads decisionPlan.three_day_plan.length. This means every valid split ready result is currently incompatible with RuntimeAssessmentNote, regardless of whether nullable fields are populated.

The adapter must map by semantic role, not by positional coincidence:

- message_draft or recommended_message_draft becomes finalDraft.
- actions_to_take/actions_to_avoid plus the tonight plan entry become immediateAction.
- review_timing plus structured change_conditions become reassessment.
- three_day_plan day values and aftercare_plan phase values are normalized explicitly.
- three_day_plan_commentary and aftercare_commentary remain optional secondary detail.
- relationship_summary and message_temperature become explicitly nullable projection fields.

## D. Presentation density and boundary model

### Current state

requestedTopics currently controls:

- navigation links;
- whether draft-absence explanatory copy is eligible.

It does not control whether the following visible sections render:

- current answer;
- immediate action and action rationale;
- short letter and anxiety reframe;
- decision reason, relationship summary, and selected fact commentary;
- message temperature and possible interpretations;
- three-day plan and commentary;
- change-condition commentary;
- closing, review timing, and fixed limitation.

The current renderer therefore exposes internal evidence fields regardless of requested topic or semantic necessity. It also repeats the same decision meaning across reason summary, fact commentary, action rationales, aftercare, and closing.

### Required four-layer separation

1. Internal audit model

   Raw stage records, grounded stage data, policies, semantic findings, fact IDs, usage, and diagnostic evidence. This remains complete and is never shortened for presentation.

2. Persisted Product report

   The complete RuntimeReport or SplitRuntimeReportV1 plus DecisionCard. It remains byte/deep unchanged after projection and retains all structured audit value.

3. CustomerAssessmentProjection

   A deterministic, versioned, display-only model created from one validated full report plus requestedTopics. It contains only semantically necessary customer material and explicit optional detail.

4. Customer-facing visual sections

   Renderer-owned labels, hierarchy, disclosure, copy interaction, and responsive layout. It consumes only CustomerAssessmentProjection, never the raw persisted report.

Deleting structured audit fields to shorten the UI is rejected. The defect is the missing projection boundary, not the existence of structured data.

## Required projection decision

Decision: adopt the following boundary.

Full structured report → deterministic CustomerAssessmentProjection → UI

The full report remains the persisted authority. Projection is a pure function and is not written back over the report.

### Projection contract

CustomerAssessmentProjection must expose:

- projectionSchemaVersion;
- sourceReportSchemaVersion;
- requestedTopics;
- decision code and renderer-owned label;
- primaryReason copied from decision_reason_summary;
- finalDraft as one normalized nullable field containing exact source text, policy, and use timing;
- immediateAction as one normalized field containing selected exact-source action and avoid strings;
- reassessment as one normalized field containing review timing and structured condition/direction entries;
- nullable relationshipSummary;
- nullable messageTemperature;
- optionalDetails selected from existing source fields;
- fixedLimitation.

It must not expose or select by case ID, request ID, run ID, usage, Provider response ID, fact ID as customer copy, or diagnostic verdict.

### Deterministic selection rules

- Always include decision, primary reason, immediateAction, and reassessment for a ready result.
- Include finalDraft when non-null. When the user requested a draft but policy requires null, use renderer-owned absence copy keyed only by decision, never generated factual copy.
- Include message-reading detail only when requestedTopics contains message_impact and source messageTemperature or interpretations are available.
- Include relationship detail only when requestedTopics contains relationship and relationshipSummary is non-null.
- Include emotional-support detail only when requestedTopics contains organize_emotions and the source provides relevant material.
- Include expanded next-step detail only when requestedTopics contains next_three_days.
- Keep supporting observed facts and commentary in secondary disclosure and select only material support for the primary reason.
- Do not impose one word-count ceiling. Proportionality comes from semantic section selection, source availability, decision/draft policy, and disclosure hierarchy.
- Never branch on case IDs or fixture IDs.
- Preserve source strings. Selection and ordering are allowed; invention, factual rewrite, inferred causality, and chronology repair by paraphrase are not.

### Normalized immediate action

For legacy:

- primary source is the tonight entry in three_day_plan;
- fallback is the first actions_to_take item;
- avoid sources are the tonight avoid value and actions_to_avoid.

For split:

- primary source is the aftercare_plan entry with phase=tonight;
- fallback is the first actions_to_take item;
- avoid sources omit null and otherwise use the tonight avoid value and actions_to_avoid.

Exact duplicate strings may be removed after whitespace normalization. Semantic paraphrase or fuzzy deduplication is not allowed in v1.

### Normalized reassessment

For both shapes:

- when is copied from review_timing.when;
- each structured change condition preserves condition and resulting_direction;
- split supporting_fact_ids remain internal evidence and are not rendered as customer text;
- commentary may be attached by index only as optional detail and cannot replace the structured direction.

### Additional text generation

No additional bounded text-generation stage is necessary for customer projection. Existing fields are sufficient for deterministic selection and composition. Adding another Provider stage would add latency, cost, nondeterminism, and a new source of factual drift without solving the actual boundary defect.

Package C may still revise the existing PB-05 writing successor for unsupported causality, chronology, fact/interpretation separation, negative enumeration, and generic aftercare. That is content-quality work inside the existing stage topology, not a new presentation stage.

## E. Safety and payment

Payment implementation state: absent.

Evidence:

- The only API route is app/api/internal/assessments/route.ts.
- No checkout or payment API route exists.
- package.json includes no payment SDK.
- The public RequestForm performs local Safety checks and ends at a disabled purchase control.
- The review purchase route accepts only a fixed normal_allowed fixture.
- Its transaction state is not_started, provider is unselected, and delivery timing is unresolved.
- ReviewPurchaseConfirmation states that no payment provider or transaction function is connected and renders a disabled button.

### Actual current sequences

Public local request UI:

input → client classifySafetyInput → non-normal stop, or normal memo/email confirmation → disabled purchase-unavailable control

There is no payment, Product generation, or delivery transition.

Fixture review:

fixed normal_allowed request fixture → request confirmation → purchase preview → disabled purchase control

There is no transaction.

Internal Runtime review:

input → internal assessment API → active v4 PB-01/PB-02/PB-03 → Safety eligibility → safety_blocked without Report, or ready PB-04/PB-05/PB-06 → persist full report → internal UI

This path has no purchase or payment step and is not a customer commerce path.

### Can a Safety-blocked request reach payment now?

No. No request can reach payment because payment is absent. In addition, the local request UI and review fixtures prevent non-normal states from reaching purchase confirmation.

This is not equivalent to implemented-and-verified pre-payment Safety. Once a real payment capability exists, the ordering must be independently enforced server-side.

### Required future sequence

input
→ application-owned Safety eligibility, including structured contact-boundary state
→ blocked: nonjudgmental stop with no draft, workaround, payment, generation, or delivery
→ eligible purchase
→ payment
→ full Product generation and delivery

Until payment exists, the only valid eligible terminal state is eligible_payment_unavailable. The UI must not imply successful purchase, payment, generation, or delivery.

Package E should use a structured contact-boundary answer rather than a case ID or broad free-text phrase matcher. explicit_no_contact, blocked_or_restricted, relationship_closed, and unknown must fail closed. Ordinary absence remains none and must not be converted into unknown.

## Future Packages A through F

The exact responsibilities, prerequisites, branches, pairwise-disjoint path manifests, non-goals, tests, acceptance gates, Provider requirements, and Human visual-review requirements are machine-readable in implementation-work-packages-v1.json.

Summary:

- Package A: decode the full result union and build the deterministic projection.
- Package B: render a proportional customer note and copyable final draft on a non-active review surface.
- Package C: repair PB-05 factual precision and anxiety-safe writing without another Provider stage.
- Package D: repair deterministic certainty evaluation and semantic disposition while preserving real blockers.
- Package E: implement and visually review the pre-payment Safety gate while truthfully retaining payment=absent.
- Package F: run consolidated offline regression and prepare the successor Product Owner packet without Provider execution.

All package path manifests are pairwise disjoint. Each package consumes only accepted predecessor contracts. Runtime activation, Provider execution, R4, C2, PR, and main integration remain separate future decisions.

## Acceptance

acceptance-matrix-v1.json defines 24 offline cases, including every mandatory case:

- legacy and split ready;
- both split nullable fields;
- all decision/draft modes;
- safety_blocked and needs_more_information without Report;
- explicit no-contact;
- simple business correction, ordinary waiting, polite thank-you, and Kansai/persona preservation;
- unsupported causality and chronology;
- anxiety-amplifying enumeration;
- certainty false positive and temporal reassessment;
- real current-direction contradiction;
- absent payment;
- full-report immutability;
- requestedTopics semantic selection without case IDs or a fixed word-count rule.

Automated PASS does not replace Product Owner acceptance. Product Owner review of actual successor final outputs and the assembled customer-facing Product view remains mandatory before Runtime activation.

## Authorization boundary

- v12 implementation authorized: false
- Provider rerun ready / authorized: false / false
- Active Runtime activated: false
- R4 authorized: false
- C2 authorized: false
- main changed: false
- Next action: Human / ChatGPT review of this v12 implementation decomposition

No implementation follows from this document without fresh explicit authority.
