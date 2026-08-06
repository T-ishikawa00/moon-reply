# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P2 Review

## Status

`runtime_projection_implemented_pending_human_chatgpt_review`

Package A only. Package B through F, Provider execution, Runtime activation, R4, C2, PR, and main integration remain unauthorized.

## Git authority

- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-runtime-projection`
- Exact baseline: `7810861cec9036d5a131dcdf810e6b5e0e74cac5`
- Baseline parent: `366b99b19ccf7f2aabe92fa760d07521de5e4104`
- Main / origin-main: `61e33a10e195fad17e253a6b9719217e1992f273`
- Exact mutation scope: 14/14

## Implemented contract

The wire and persistence boundaries now decode the complete runtime result union. Ready results require both `eligibility=ready` and an exact supported `report.schemaVersion`. Legacy ready, split ready, Safety stop, and needs-information stop are explicit variants. Unknown versions, mixed fields, missing nested fields, malformed nullable fields, invalid DecisionCard data, ready-without-Report, and non-ready-with-Report fail closed.

`CustomerAssessmentProjectionV1` is a pure deterministic selection boundary. It preserves the complete persisted Report as authority and exposes only:

- the source schema version and authoritative requested topics;
- Decision code without a customer-facing Japanese label;
- exact-source primary reason and nullable final draft;
- normalized immediate action and reassessment;
- requested, available relationship and message-temperature material;
- selected optional detail and the fixed limitation.

The projection does not receive case IDs and does not expose request IDs, run IDs, usage, fact IDs, Provider identifiers, diagnostic verdicts, machine verdicts, or internal Stage data.

## RequestedTopics authority

- Initial delivery uses the exact server-validated `AssessmentInput.requestedTopics`.
- Duplicate delivery requires `authoritativeRequestedTopics` hydrated from the persisted original request.
- When a duplicate request body conflicts, projection selection uses the persisted original topics and records `requestedTopicsAuthority=persisted_original_request`.
- Mutable post-response React form state is not passed to the renderer.

## Normalization

- Legacy `message_draft` and split `recommended_message_draft` normalize to exact `text`, `policy`, and `useTiming`; null remains null and no fallback draft is generated.
- Immediate action selects semantic `tonight`, falls back only to the first `actions_to_take`, omits null avoids, and removes whitespace-normalized exact duplicates without fuzzy matching.
- Reassessment preserves `review_timing.when` and every structured `condition` / `resulting_direction`; split `supporting_fact_ids` remain internal.

## Delivery and preview boundaries

`CustomerAssessmentDeliveryV1` has strict ready, Safety-stop, and needs-information variants. Stop variants contain no Projection, Report, or draft. The client decodes the API payload before state storage. `RuntimeAssessmentProjectionPreview` receives Projection only and owns the local Decision-label map. `RuntimeAssessmentNote.tsx` is unchanged. The preview is technical and is not final Customer UI.

## Offline fixture coverage

- Ready: legacy 1, split 4
- Stop: Safety 1, needs information 1
- Rejected invalid runtime shapes: 8
- Rejected invalid delivery shapes: 3
- Decisions: `reply_now`, `send_now`, `wait_and_reassess`, `pause_additional_contact`
- Nullable split coverage: message temperature only, relationship summary only, and both null
- Behavioral coverage: deep-freeze mutation detection, serialized/deep immutability, repeat determinism, duplicate topic mismatch, and case-ID independence

E-R3-01, E-R3-02, E-R3-03, and E-R3-04 accepted final structures are shape provenance only. Test copy is synthetic. E-R3-05 and E-R3-06 intermediate outputs are not labeled accepted final Product.

## Automated evidence

| Gate | Result |
| --- | --- |
| Dedicated Package A verifier | PASS 20/20 |
| Decision Policy | PASS 40/40 |
| Typecheck | PASS |
| Lint | PASS |
| Build | PASS |
| `git diff --check` | PASS |

## Operations and authorization

- Provider / DB / Supabase: `0 / 0 / 0`
- Runner rerun / package-check / retry / repair / fallback: `false / false / false / false / false`
- Active Runtime: v4, unchanged and not activated
- Customer UI finalized: false
- Package B / C / D / E / F authorized: false
- Provider rerun authorized: false
- R4 / C2 authorized: false / false
- PR / main merge / force push: unauthorized

## Required next action

Human / ChatGPT review of Package A runtime projection. No adjacent package or activation follows automatically.
