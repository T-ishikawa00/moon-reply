# M2-P2-B1-B1 Request and Response Contract

## Deterministic request construction

For PB-01 through PB-06, the builder reads the accepted developer Prompt, all accepted shared Prompt assets, the accepted Stage input projection, the accepted output Schema, and the B0 Stage cap. It excludes the oracle, holdout data, real-user data, PB-07, tools, conversation state, previous response state, prompt-cache assumptions, and safety/user identifiers.

Every Stage records SHA-256 values for:

- developer Prompt;
- shared assets;
- input payload;
- output Schema;
- request body; and
- request contract.

The registered request manifest is exact. Unknown fields or mutations to case, model, Stage, cap, Schema, Prompt, B0 contract, storage, tools, streaming, background, service tier, truncation, or reasoning are rejected.

The preview may show only the required header names. Its authorization entry is fixed to `[REDACTED_NOT_BOUND]`; no secret-shaped placeholder is used.

## Strict synthetic Response parser

A successful synthetic response must have:

- `object: response`;
- `status: completed`;
- null error and incomplete details;
- non-empty response ID and returned model;
- exactly one assistant message;
- exactly one `output_text` item and no refusal;
- JSON output valid against the Stage Schema; and
- coherent non-negative input, cached-input, output, reasoning, and total usage.

Failed, incomplete, queued, in-progress, cancelled, refused, ambiguous, missing, malformed, Schema-invalid, usage-incoherent, or returned-model-mismatched responses stop. No retry, Repair, or fallback follows.

## Returned model

The requested and synthetic returned model are both `gpt-5.6-luna`. A future different returned value is recorded on the current receipt and then stops with `RETURNED_MODEL_MISMATCH`. No alias, snapshot, fallback, or second request is assumed.

## Usage ledger and budget

The ledger records input, cached, uncached input, output, reasoning, and total tokens plus requested model, returned model, Stage, and response ID. All input is conservatively priced at USD 1.00 per million and all output at USD 6.00 per million. Cached discounts are ignored for approval protection, and reasoning tokens are not added twice.

The result is a `usage-derived conservative cost estimate`, never final billed cost.

Before a future Stage:

```text
cumulative_usage_derived_cost
+
remaining_registered_stage_hard_caps
<=
USD 1.00
```

The original USD 0.213223 static hard cap must also remain at or below USD 0.30. B1-B1 uses synthetic receipts only and actual spend remains USD 0.
