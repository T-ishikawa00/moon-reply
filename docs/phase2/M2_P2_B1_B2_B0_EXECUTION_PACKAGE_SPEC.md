# M2-P2-B1-B2-B0 One-Time Paid Calibration Execution Package Specification

## 1. Authority and lifecycle

M2-P2-B1-B2-B0 is the zero-network, zero-spend execution package between the accepted dormant B1-B2-A bindings and a possible future M2-P2-B1-B2-B1 one-time paid calibration. The historical B1-B2-A scope remains frozen at `fa222917f0e6ff4a4e25d11da239717c062af6d0..76ceb4a25cc565e84b9537bd25dbe703f87bd342`. The separate correction commit `30c05ca2c383641676a3c1fde680e2e83d44397f` is unchanged.

The correction commit `30c05ca2c383641676a3c1fde680e2e83d44397f` and implementation commit `e8b369baa14ff417fed19d75f31c733dd5c8d240` completed Human / ChatGPT final review and are accepted and complete. This acceptance authorizes fast-forward-only synchronization to `main`; it does not authorize a true approval record, paid run, API-key access, provider call, or model selection. M2-P2-B1-B2-B1 remains unauthorized and not started.

## 2. Fixed calibration target

- Case: `WAIT-003`
- Candidate: `gpt-5.6-luna`
- Product model: unselected
- Baseline model: unselected
- Provider stages: PB-01 through PB-06
- Maximum provider calls: 6
- B0 contract hash: `c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2`
- Historical static cap: USD 0.213223
- Cache-write-protected live guard: USD 0.26079625
- Preflight ceiling: USD 0.30
- Absolute Human ceiling: USD 1.00

PB-07, retry, Repair, fallback, Batch, 14-case, 70-case, holdout, and real-user execution remain prohibited.

## 3. Capability ownership

The nine B0 successor scripts are the exact paths registered by the preceding correction. Only `scripts/lib/m2-p2-b1-b2-b0-local-filesystem.mjs` directly owns filesystem, path, and OS capabilities. No B0 successor directly owns network, TLS, environment-secret, or child-process capability.

The future paid entrypoint injects the accepted B1-B2-A owners for:

- the exact Git command guard;
- the opaque environment-secret provider;
- the fixed OpenAI HTTPS executor;
- the dormant live Runner;
- runtime redaction and sanitized artifact output.

Importing a B0 module performs no filesystem read/write, secret resolution, child-process invocation, or network request.

## 4. Repository and external state

The repository contains only a non-executable approval template. A true approval must be stored at:

`%LOCALAPPDATA%\moon-reply\calibration-approvals\m2-p2-b1-b2-b1-one-time-approval.json`

The one-time marker root is:

`%LOCALAPPDATA%\moon-reply\calibration-authorizations\`

The future run-artifact root is:

`%LOCALAPPDATA%\moon-reply\calibration-runs\`

Arbitrary paths, relative paths, parent traversal, UNC/device paths, alternate roots, and reparse-point escape are rejected. This Task creates none of these external directories.

## 5. Pre-network order

The paid CLI fixes the following sequence:

1. Parse CLI.
2. Verify fixed CLI values.
3. Verify the fixed approval path.
4. Load and Schema-validate the approval.
5. Verify approval status.
6. Verify expiry.
7. Verify confirmation hash.
8. Verify branch `main`.
9. Verify exact `HEAD`.
10. Verify exact `origin/main`.
11. Verify a clean index/worktree including untracked files.
12. Verify exact runner-SHA binding.
13. Verify the B0 contract hash.
14. Verify registered request hashes.
15. Verify case/model/stages/call limit.
16. Verify price snapshot hash and freshness.
17. Verify the long-input guard.
18. Verify the live guard is within USD 0.30.
19. Verify the absolute Human ceiling is USD 1.00.
20. Verify the one-time marker is unused.
21. Atomically consume the marker.
22. Resolve the environment secret.
23. Begin PB-01.

No secret resolution occurs before step 22. No HTTPS request occurs before step 23.

## 6. Task-time runnable boundary

The only B0 runner executed by this Task is:

```powershell
node scripts/run-m2-p2-b1-b2-b0-preflight-blocked.mjs `
  --mode paid-preflight-blocked `
  --case WAIT-003 `
  --model gpt-5.6-luna `
  --contract-hash c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2 `
  --confirm MOON_REPLY_B1_B2_B0_NO_PAID_EXECUTION
```

Its required result is `EXTERNAL_APPROVAL_NOT_PRESENT`, interpreted as an expected PASS with zero real environment reads, secret resolutions, HTTPS requests, provider calls, and spend.

The paid entrypoint `scripts/run-m2-p2-b1-b2-b-paid-once.mjs` must not be executed in this Task.

## 7. Deterministic evidence

The prepare command generates a byte-stable repository template, blocked-preflight report, approval preview, 24-scenario CLI rejection matrix, Markdown summary, and registered report hashes. No repository report contains a current timestamp.

Every failure scenario stops before secret resolution and HTTPS with zero calls, zero spend, and no retry, Repair, or fallback.

## 8. Evidence interpretation

This package is executable-contract and safety evidence. It is not evidence of an actual OpenAI connection, credential validity, Project model availability, token use, latency, billed cost, or model quality. It selects neither a product nor baseline model.
