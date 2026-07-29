# M2-P2-B1-B2-B0 Operator Runbook

## 1. Current B0 instruction

M2-P2-B1-B2-B0 Human / ChatGPT final review is complete, and the execution package is accepted and complete. Do not execute `scripts/run-m2-p2-b1-b2-b-paid-once.mjs` during acceptance synchronization or afterward unless M2-P2-B1-B2-B1 receives separate explicit authorization.

The sole runnable B0 preflight is the fixed blocked command:

```powershell
node scripts/run-m2-p2-b1-b2-b0-preflight-blocked.mjs `
  --mode paid-preflight-blocked `
  --case WAIT-003 `
  --model gpt-5.6-luna `
  --contract-hash c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2 `
  --confirm MOON_REPLY_B1_B2_B0_NO_PAID_EXECUTION
```

Expected stop: `EXTERNAL_APPROVAL_NOT_PRESENT`.

## 2. Future prerequisites

The paid command remains prohibited until all of the following are independently complete:

1. B0 Human / ChatGPT final review and acceptance.
2. B0 fast-forward to `main`.
3. Exact final `main` SHA known.
4. `HEAD == main == origin/main`.
5. Entire worktree/index/untracked state clean.
6. Current price snapshot independently confirmed within 24 hours.
7. A new true external approval explicitly authorized and valid for no more than 30 minutes.
8. The external approval bound to the final SHA, registered request hashes, fixed candidate, fixed stages, call limit, and ceilings.
9. A separate Human-controlled process holding the credential.
10. M2-P2-B1-B2-B1 execution expressly authorized.

Project, billing, credential, true approval, and paid-run decisions are not implied by B0 acceptance.

## 3. Future exact command shape

Only after the separate gate:

```powershell
node scripts/run-m2-p2-b1-b2-b-paid-once.mjs `
  --mode paid-one-case `
  --case WAIT-003 `
  --model gpt-5.6-luna `
  --contract-hash c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2 `
  --approval-file <fixed external approval path> `
  --confirm I_APPROVE_ONE_PAID_WAIT_003_RUN_UNDER_USD_1
```

There is no credential argument and no override for path, stage, cap, budget, endpoint, host, model, case, retry, Repair, fallback, or Batch.

## 4. Expected safety behavior

- Any preflight mismatch stops before secret resolution.
- The one-time marker is consumed before the first provider request.
- Six calls are the absolute maximum.
- Requests run sequentially.
- Retry, Repair, fallback, and automatic continuation are absent.
- A crash after marker consumption requires a new approval.
- Sanitized artifacts are external and write-once.

## 5. Incident handling

If the branch, SHA, remote, worktree, approval, price, hash, budget, path, or marker check differs, stop. Do not repair the state inside the paid command. Do not delete a marker to retry. Do not widen a CLI flag. Obtain a new Human decision.

If any credential exposure or unexpected provider activity is suspected, terminate the operator process, revoke the credential through the Human-controlled provider account, preserve non-sensitive evidence, and do not rerun.

## 6. B0 evidence boundary

The deterministic B0 blocked preflight and failure matrix are not proof that a future provider call will succeed. Provider compatibility, availability, billing, latency, actual usage, and output quality remain unknown.

## 7. Accepted B0 status

- Accepted correction commit: `30c05ca2c383641676a3c1fde680e2e83d44397f`
- Accepted implementation commit: `e8b369baa14ff417fed19d75f31c733dd5c8d240`
- Repository approval template: non-executable
- True external approval: absent
- One-time marker: absent
- Calibration run artifacts: absent
- Paid CLI: not executed
- OPENAI_API_KEY reads: 0
- Actual provider calls: 0
- API spend: USD 0
- Product model: unselected
- Baseline model: unselected
- M2-P2-B1-B2-B1: unauthorized and not started
