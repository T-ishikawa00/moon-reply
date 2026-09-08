# STEP 5A-1 B1: schema dependency proposal

Status: PROPOSAL ONLY. No SQL or runtime change is authorized by this document.
Source baseline inspected: `3a873b5a67e1d30592cb41e812d1ca39943d966a`.
Scope: production preparation/clarification wiring required to use the existing
V19-L5 contract. No prompt, Product judgment, repair rule or paid recovery
architecture change is proposed. Original migrations and historical evidence
remain unchanged.

## Two concrete database dependencies

1. `supabase/migrations/0010_rc1_production_fulfillment_core.sql:197`
   restricts `finalize_purchase_ready_assessment_v1` to bundle v17 / schema v6.
   A real persisted v23 / v9 initial or clarification-resume run cannot be
   finalized with this RPC. The STEP3 synthetic preparation shortcut did not
   exercise this operation.
2. `supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql:181`
   restricts `assessment_clarifications.target` to six legacy targets.
   The accepted V19-L5 target `original_message` cannot be persisted.

The smallest additive migration proposal is
`0036_v19_l5_production_preparation_compatibility.sql`, containing only:

- `CREATE OR REPLACE` of the existing
  `public.finalize_purchase_ready_assessment_v1(uuid,uuid,text,jsonb,bigint,bigint,bigint,bigint,numeric,timestamptz)`.
  Preserve its full body, signature, return type, security-invoker mode, empty
  search_path, row locks, source/status/model checks and update behavior. Replace
  only the two version predicates with the exact paired alternative:

  ```sql
  and (
    (prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
      and schema_set_version = 'pipeline-schema-runtime-v6.0.0')
    or
    (prompt_bundle_version = 'prompt-bundle-runtime-v23.0.0'
      and schema_set_version = 'pipeline-schema-runtime-v9.0.0')
  )
  ```

- Replace only `assessment_clarifications_target` with the same six values plus
  `original_message`. Preserve the unique request/question/ordinal constraints,
  immutable-question trigger, answer fingerprint, source identity and one-answer
  transaction. No existing row is rewritten.
- Preserve the function's owner and ACL; assert owner and runtime grants in the
  normal migration release gate. No PUBLIC/anon/authenticated grants are added.

The generic `finalize_needs_more_information_v1` and
`accept_assessment_clarification_v1` in 0006 accept target/answer JSON without
another target allowlist; their signatures need no change. The latter already
creates the resume run transactionally and returns duplicate/conflict according
to the stored fingerprint. Migration0034 already permits the exact v23/v9
initial and clarification-resume runtime identity. Existing production
preparation-state constraints already accept the V19 purchase authority.

This proposal needs an explicit scope decision because the current task names
0033–0035 as its required migration set. Editing those historical migrations to
hide this new dependency would invalidate their existing hashes and is not
proposed. If 0036 is approved, it must also join the official release-gate
inventory, order/hash checks, installer checks and runtime ACL matrix.

## Runtime bridge needed in addition to SQL

The SQL change alone does not complete original-message clarification.

| Required integration surface | Concrete behavior |
| --- | --- |
| `lib/assessment/production/application-runtime.ts` | Choose V19 for new production preparation without enabling the synthetic flag; retain the V17 executor/catalog for old persisted authority. |
| `lib/assessment/production/application.ts` | Route authenticated initial preparation and clarification using the stored preparation/run contract; preserve customer claim, continuation, one-answer acceptance and `finalizePrepaymentExecution`. |
| New `lib/assessment/production/v19-preparation-executor.ts` (suggested name) | Persist real run/stage evidence and map purchase_ready, clarification, Product stop and technical failure separately. Never turn a clarification into technical failure or silently map its target to a legacy target. |
| `lib/assessment/runtime/v19-l5-application.ts` | Add a persisted, preparation-only resume bridge; leave existing submit/provideOriginalMessage Product behavior unchanged. Retain Base and validate the supplied original via Candidate and Safety. Never invoke PB04 before payment. |
| `lib/assessment/runtime/supabase-repository.ts` | Read exact V19 initial/resume evidence and contract, including the raw PB01 envelope. The existing legacy `getInitialAuthorityForResume` assumes PB01C exists and legacy PB01 output shape; it cannot be used unchanged when the original draft was absent. |
| `lib/assessment/runtime/types.ts` | Add a production/persisted clarification-target union that includes original_message. Keep the legacy policy target union distinct so V17 policy tables and grounding schemas are not broadly relaxed. |
| `lib/assessment/production/types.ts` | Expose the versioned target and clarified purchase authority through the production outcome types. |
| `lib/assessment/production/recovery-candidate.ts` | Bind the accepted answer/fingerprint to the immutable initial request and derive the effective input used by the checkpoint; preserve exact verification during paid execution/recovery. |
| `lib/assessment/production/public-clarification-contract-v1.ts` | Add an original-text control and answer construction/validation; existing code requires a radio-choice value and otherwise rejects the answer. |
| `components/request/RequestForm.tsx` | Render and submit a bounded free-text original-message answer under the existing authenticated continuation. The existing target decoder rejects original_message. |

These are ten core implementation surfaces, including one new bridge module,
plus the additive migration, official gate registration and focused tests. A
separate helper for original-message fingerprint/provenance may be preferable
to expanding legacy `clarification-evidence-v1.ts`; that is an implementation
choice, not a reason to change legacy policy semantics.

Do not globally widen `Jpy980ClarificationTarget` without auditing its exhaustive
consumers: `effective-decision-policy-v1.ts`, `effective-assessment-authority-v1.ts`,
`effective-assessment-authority-integrity-v1.ts`, `clarification-grounding-v1.ts`,
`runtime-result-normalization-v2.ts`, and `components/runtime/RuntimeAssessmentForm.tsx`.
They implement the six legacy targets. The production bridge should keep the
new original-message branch separate instead of inventing a legacy grounding.

## Binding and compute details that must be preserved

- `V19L5LocalApplication.prepare()` returns clarification and stopped as well as
  purchase_ready. `prepareV19L5PaidCandidate()` rejects non-ready outcomes and is
  insufficient as the complete production preparation adapter.
- `provideOriginalMessage()` currently calls execute with preparationOnly=false.
  It would cross into PB04/PB05/PB06 if called directly from unpaid production
  continuation. A preparation-only bridge is necessary.
- Its pending Base exists only in process memory. A later HTTP request must
  reconstruct it from persisted, hash-verified initial evidence. The resumed
  result currently omits the retained PB01 receipt, while fulfillPrepared expects
  one exact saved upstream receipt for each replayed stage. The production
  checkpoint must preserve a complete replayable evidence chain.
- An original-message answer changes effective optionalMessage but must not
  overwrite the immutable initial assessment request. Current paid validation
  requires authority.request == persisted request == checkpoint.evidence.input.
  Clarified authority must explicitly bind the accepted answer and effective
  input; changing only checkpoint input causes a paid input-mismatch stop.
- Every actual unpaid Provider call must acquire `computeFence(stageId,attempt)`
  before invocation and call `permit.finish(responseReceived)` in finally.
  A returned but invalid response still releases concurrency; thrown/unknown
  Provider outcomes retain the bounded lease. Consumed units never reset.
  Persistence failure after a response must not disguise that response as an
  unknown Provider outcome. Replay-only stages consume no new Provider unit.
- Persist preparation runs with the exact v23/v9 identity and stage request,
  prompt and schema hashes; use `finalizePurchaseReadyPreparation`,
  `finalizeNeedsMoreInformation` and the existing failure/stop lifecycle, then
  finalize the authenticated preparation. Do not substitute result_json edits
  for the actual lifecycle RPCs.

## Legacy-target clarification is a separate discovered limitation

The local V19-L5 sufficiency policy can return one of the six predecessor
clarification targets. The application retains pending state only when target
is original_message (`v19-l5-application.ts:172`) and exposes no generic resume
method. Its authority/sufficiency calls currently pass clarificationGrounding
as null. Therefore generic V19 clarification continuation is not implemented by
calling provideOriginalMessage or by changing a target CHECK.

To preserve existing generic clarification behavior, use the existing validated
answer and PB01 clarification-grounding contract, retain original Base/Candidate,
and feed the verified clarification authority through the existing V19-L5
Safety/sufficiency/decision inputs. The bridge must carry the same authority into
the purchase checkpoint and paid replay. The legacy pipeline resume method
cannot simply receive a v23/v9 context: its schema identity guard expects v6 for
that branch. This additional wiring must be reviewed before claiming B1
clarification regression zero. Mapping clarification to stopped or to V17
fallback would change the intended Product behavior and is not proposed.

## Focused acceptance evidence

In addition to the task's B1 cases: persist original_message, resume through a
new application instance, perform Candidate/Safety only before payment, retain
the same Base and one-answer fingerprint, reject conflicting second answers,
complete a paid clarified V19 purchase, and preserve V17 clarification resume.
Exercise a genuine predecessor-target V19 clarification separately. Demonstrate
that invalid Provider responses release unpaid concurrency while unknown
outcomes retain a lease, and that neither path restores consumed units.

Database checks must prove v23/v9 ready-finalization succeeds, V17 still succeeds,
mixed v17/v9 and v23/v6 fail, original_message persists, unknown targets fail,
one-answer/immutable-question guards remain, and non-superuser installer plus
service-role/anon/authenticated ACL behavior is unchanged.
