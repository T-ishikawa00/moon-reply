# M2-P2-B1-A State Machine and Stop Policy

## State contract

Canonical states are `created`, `preflight_validating`, `preflight_passed`, `stage_pending`, `stage_replaying`, `stage_output_validating`, `stage_completed`, `local_step_running`, `local_step_completed`, `completed_offline`, and `stopped`.

`completed_offline` is the only successful terminal state. Every failure transitions exactly once to `stopped`. Neither terminal state has an outgoing transition. No retry, Repair, fallback, or automatic continuation transition exists.

## Ordered execution

1. PB-01 replay
2. PB-01 Schema validation
3. PB-02 replay
4. PB-02 Schema validation
5. PB-03 replay
6. PB-03 Schema validation
7. local Safety aggregation
8. local eligibility assertion
9. local Decision Policy
10. PB-04 replay
11. PB-04 Schema and plan validation
12. PB-05 replay
13. PB-05 Schema and report validation
14. PB-06 replay
15. PB-06 Schema and semantic-validation checks
16. final contract, budget, approval-lock, and artifact checks
17. `completed_offline`

PB-07 is absent. Each replay Stage occurs once. Every replay receipt must be synthetic, completed, non-refusal, valid JSON, Schema-valid, and linked to accepted synthetic usage and B0 contract hashes.

## Failure policy

The exact 20-case catalog covers identity, CLI, approval-lock, budget, Stage order, incomplete/refusal/usage, invalid JSON, Schema, Safety, decision, fact fidelity, and cumulative budget failure. All failures retain actual provider calls 0 and API spend USD 0. The matrix records the expected code, actual code, last completed Stage, terminal state, and one-stop invariant.
