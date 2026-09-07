# GQ29-P3 targeted real-model verification

Authority: current Human authorization, received after V19-L3 local Technical PASS. This is a new two-condition diagnostic experiment, separate from the stopped Fresh Blind Pilot. It does not reopen that run, reveal its A/B mapping, complete its missing sessions, or authorize Production.

- Execution source: `cc899b92e94e26b71d83eae3a747f0b849874ddc` plus frozen, evaluation-only files in this directory.
- Fixed synthetic GQ29-P3 PB01–PB04 and original PB05 input. Both conditions receive exactly the same PB05 user input. No prior PB05 output, finding, Human preference, expected direction or editorial answer is generation input.
- V19-L2: catalog/bundle v20, PB05 v10. V19-L3: catalog/bundle v21, PB05 v11. Both schemaSet v6 and PB06 v9. All non-PB05 definitions identical.
- Each condition: PB05 once, then PB06 once on that condition's newly generated report after unchanged Application grounding. No generated upstream, repair, retry, additional sample, clarification answer or attempt 2/3.
- Exact model `gpt-5.6-luna`, reasoning `low`, Standard (`default`), max 4 HTTP, USD $0.15 hard cap. Official prices confirmed in `verified-pricing.json`; conservative reservation $0.1094912.
- One shared existing append-only evaluation ledger. Reserve full call maximum before dispatch. Keep all reservations after success, failure or unknown outcome. Reconcile actual usage and reload journal after execution. No Production budget/quota/DB.
- A material quality failure remains a failure for that condition. It does not prevent the other authorized condition from running once. A recorded PB05 fact defect may be passed unchanged to the one PB06 diagnostic call; this cannot turn it into a deliverable answer. PB06 empty findings cannot erase an observed defect.
- Global STOP: model/version/schema/budget/accounting/HTTP/timeout/incomplete output or unexpected adapter failure. No STOP reset, automatic retry or replacement model.
- Manual receipt checkpoints reuse the existing checkpoint. For this profile, the decision also records `materialFindings` and observations. An instruction in the old checkpoint text about repair has no authority here: repairs are zero.
- No Customer data, Production/DB/Payment/Email operations, runtime changes, push or deploy. Only new experiment evidence is written.

## Interpretation

Compare input fact → PB05 wording → PB06 interpretation. Check meaning-level escalation from sent to confirmed receipt/read/understanding/intentional silence, without banning a word. Preserve grounded reasons, three-day direction, no extra send now, natural language, temporal consistency, and Safety/boundaries. Diagnostic stage completion is not fulfillment, Human preference acceptance, or Production authorization. One sample per condition cannot establish a general failure rate.

## Local gates before the first API call

The new adapter must capture exact frozen PB05 input for both catalogs and capture PB06 through existing Application grounding, never a fake PB06 verdict. Fake checks cover shared cap, pre-dispatch rejection, unknown-outcome reservation retention, no retry, condition quality isolation, global infrastructure stops, raw defect preservation and one-shot lock. Independent code review precedes live execution.
