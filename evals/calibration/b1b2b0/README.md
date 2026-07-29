# M2-P2-B1-B2-B0 One-Time Paid Calibration Execution Package

This directory defines the deterministic, zero-network execution package that can connect the accepted dormant B1-B2-A bindings to a separately authorized future one-time paid calibration.

The repository approval file is a non-executable template. A true approval must be external, expire within 30 minutes, bind exact final `main` and `origin/main`, bind the B0 contract and six registered request hashes, and be consumed atomically before any secret resolution.

The only Task-time runner is the blocked preflight. It stops with `EXTERNAL_APPROVAL_NOT_PRESENT`. The paid entrypoint is present for later authorization but is not executed by this Task.

Fixed boundary:

- case `WAIT-003`;
- candidate `gpt-5.6-luna`;
- PB-01 through PB-06;
- maximum 6 provider calls;
- historical static cap USD 0.213223;
- live guard USD 0.26079625;
- preflight ceiling USD 0.30;
- absolute Human ceiling USD 1.00;
- no retry, Repair, fallback, Batch, PB-07, holdout, or real-user execution.

These files are protocol and safety evidence only. They do not prove an API connection, credential validity, model availability, token use, latency, billed cost, model quality, or product/baseline selection.
