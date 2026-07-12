# TASK_M1_I1_R1_REVIEW.md

## Status

Task M1-I1-R1 User-facing Copy Cleanup is completed and awaiting Human review. M1-I1 is not yet finally accepted.

## Base commit

`953173a3eb0cc6a8781e04d0395ccfd288f06eed`

The task started from a clean working tree with `HEAD` and `origin/main` matching the base commit.

## Human visual decision

Human approved the M1-I1 desktop visual direction. The approved LP structure, visual hierarchy, and design direction remain controlling. Mobile, `/request`, and `/review` Human review remain.

## User-facing copy issues found

- The save-report preview exposed the internal English term `presentation`.
- Ordinary LP navigation exposed internal review and implementation-status wording through `審査用プレビュー一覧`, `実装状況を確認`, `今後の審査ページ`, and `審査用一覧`.
- The sample-report status and legal/contact status were inspected and already used compliant user-facing wording at the base commit.

## Copy changes

- `別 presentation の構成見本` → `保存向けに再構成した見本`
- `審査用プレビュー一覧` → `公開準備プレビュー`
- `実装状況を確認` → `準備状況を確認`
- `今後の審査ページ` → `今後公開予定のページ`
- `審査用一覧` → `公開準備`
- Existing `現在準備中です`-equivalent sample wording and `公開に向けて準備中` legal/contact wording were preserved.

## /review terminology preserved

The `/review` page retains M1-I2 through M1-I6, `未実装`, `後続 slice`, route inventory, and Human review gate terminology. Its structure and status inventory are unchanged.

## Design unchanged

No section, color, font, heading size, spacing, layout, CTA position, English eyebrow, Web鑑定ノート preview, 保存用鑑定書 preview, header/footer structure, or `/request` behavior was changed. No CSS change was required.

## Files changed

- `app/page.tsx`
- `components/layout/SiteFooter.tsx`
- `components/layout/SiteHeader.tsx`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/TASK_M1_I1_REVIEW.md`
- `docs/phase1/TASK_M1_I1_R1_REVIEW.md`

## Validation

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with zero warnings.
- `npm.cmd run build`: passed. The restricted first run was blocked by environment-level `EPERM` on `.next/trace-build`; the permitted rerun compiled and statically generated `/`, `/request`, and `/review` successfully.
- HTTP `/`: 200, 48,425 bytes.
- HTTP `/request`: 200, 35,917 bytes.
- HTTP `/review`: 200, 27,484 bytes.
- The local server was stopped after the checks; port 3000 had no remaining listener.
- `git diff --check`: passed.
- Ordinary LP/internal-term search: no match for `M1-I`, `slice`, `presentation`, `Milestone`, or `Task` in `app/page.tsx` and `components/layout`.
- `/review` retained M1-I2 through M1-I6, `未実装`, `後続 slice`, route inventory, and Human gate terminology.
- Package, `components/request`, `lib`, `fixtures`, and `supabase` diffs: empty.
- `next-env.d.ts` remained unchanged after validation.

## Prohibited work confirmed

- No M1-I2 implementation or later-slice implementation.
- No `/request`, Safety rule, or age-choice change.
- No route, fixture, image, package, API route, server action, database runtime, OpenAI, payment, email, analytics, free/ad, or approved-price change.
- No LP redesign or major-section removal.
- No in-app browser use.

## Next Human gate

Human confirms the M1-I1-R1 copy cleanup, mobile LP, `/request`, and `/review` before finally accepting M1-I1. M1-I2 remains unauthorized.
