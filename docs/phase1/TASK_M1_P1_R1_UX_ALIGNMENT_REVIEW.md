# TASK_M1_P1_R1_UX_ALIGNMENT_REVIEW.md

## Status

Task M1-P1-R1 documentation alignment is completed and awaiting Human review.

Task M1-P1 remains pending final Human acceptance. The two planning tasks are to be reviewed together. Milestone 1 implementation has not started, and M1-I1 is not authorized.

## Base Commit

`05c02efeb90a53caaf603f7a4e983a7bc5c7914b`

At task start, `HEAD` and `origin/main` matched this commit and the working tree was clean.

## Human discussion summarized

The Human clarified the product's emotional objective, vertical LP structure, price/CTA clarity, text-only initial input, conversation-paste/anonymization UX, image-upload deferral, free/ad exclusions, complete recommendations, separate Web/save report experiences, Safety-before-payment, exceptional downstream refund handling, two-level review banner, and the permitted boundary for external UX references.

The supplemental screenshots changed no implementation scope. Only extracted UX decisions were documented; no screenshot or reference-site asset was added.

## Decisions aligned

- Reduce anxiety and restore the user's ability to choose the next action.
- Use a vertical LP with one value per section, product previews, wide spacing, and mid/final CTAs.
- Keep the LP and `/request` separate.
- Show `税込980円`, one request/one report, one-shot purchase, and no automatic renewal clearly.
- Use the external reference for hierarchy and explanation patterns only, never for imitation.

The controlling detail is `docs/phase1/M1_UI_UX_DECISION_REGISTER.md`.

## Input decision

The initial paid Web MVP is text-only. The form may accept free text, necessary copied conversation excerpts, a planned message, and context/question selections. It must guide anonymization and must not add a file input, screenshot upload, OCR, image analysis, storage, or automatic masking.

One-page versus multi-step form layout remains a Human gate before M1-I2.

## Free/ad decision

The initial MVP has no free complete reading, ad-supported complete reading, ads, free tickets, free coins/points, or repeatable first-free mechanism. The primary free experience is the fictional `/sample-report`, supported by short LP excerpts and product previews.

## Report split

- `月の返事 鑑定ノート`: long-form, chaptered Web reading for understanding reasoning, message drafts, the three-day plan, limits, and cautions.
- `保存用鑑定書`: separately composed quick-reference presentation based on the same future structured result. It is not a Web screenshot or compressed full report.

## Save-preview route

Planning route: `/review/save-report/result-normal-001`.

It belongs to M1-I4 and remains unimplemented. M1-I4 may provide an A4-oriented deterministic fixture preview only after explicit authorization.

## Complete recommendation rule

All approved normal outputs—`送っていい`, `軽く送るならあり`, `今夜は待つ`, and `今日は送らない方がいい`—must include the current judgment, reason, review timing, change conditions, waiting action, no-contact option, later message draft when relevant, and explicit uncertainty. Unsupported exact timing is prohibited.

## Safety/refund downstream note

Safety remains before payment, and only `normal_allowed` may reach a future purchase flow. Later milestones must design:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> refund_required
  -> operator_attention_required
  -> refunded
```

No automatic-refund ability, provider refund API, fee reimbursement, refund period, reflection timing, or operator-console procedure is claimed before provider selection and later specification.

## Reference-site treatment

Adopt vertical hierarchy, one-section/one-value explanation, large headings, concise copy, UI previews, generous spacing, wider-screen left/right alternation, and clear CTAs.

Transform astrology/chart/screens/input concepts into moonlight, Web鑑定ノート, 保存用鑑定書, tonight's conclusion, a three-day plan, relationship context, conversation paste, planned message, and user questions.

Reject astrology, natal charts, zodiac symbols, birth-data analysis, fate or mind-reading claims, circular-chart imitation, proprietary copy/assets/exact layout, copied colors/fonts, horizontal scrolling, and unnatural Japanese line breaks.

## Deferred decisions

- final CTA copy;
- exact color, font, illustration, and layout values;
- mobile fixed CTA adoption;
- one-page versus multi-step request form;
- save page count and exact text volume;
- PDF/image/both, download, browser print, smartphone format, copy/share, filename, and margins.

## Files updated

- `docs/PRODUCT_SPEC.md`
- `docs/RESULT_PRESENTATION_SPEC.md`
- `docs/AI_PROMPT_SPEC.md`
- `docs/ai/AI_PROMPT_GUARDRAILS.md`
- `docs/PAYMENT_POLICY.md`
- `docs/phase1/LP_STRUCTURE.md`
- `docs/phase1/ORDER_FORM_SPEC.md`
- `docs/phase1/PAYMENT_FLOW.md`
- `docs/phase1/DELIVERY_WORKFLOW.md`
- `docs/phase1/M1_REVIEWABLE_WEB_MVP_SPEC.md`
- `docs/phase1/M1_UI_STATE_MATRIX.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/M1_UI_UX_DECISION_REGISTER.md` (new)
- `docs/phase1/TASK_M1_P1_REVIEW.md`
- `docs/phase1/TASK_M1_P1_R1_UX_ALIGNMENT_REVIEW.md` (new)
- `docs/phase1/ACCEPTANCE_CRITERIA.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/WBS.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`

## Validation

- Changed-file boundary: pass; `git status --short` shows exactly the 20 listed Markdown documents, with no image/binary asset.
- Markdown structure: pass; code fences, tables, headings, final newlines, and trailing whitespace were checked.
- `git diff --check`: pass.
- Required decision-term searches: pass for 保存用鑑定書, 画像アップロード, 広告/初回無料 exclusions, all four normal labels, `refund_required`, `/review/save-report/`, the two-level review banner, and The Pattern rejection rules.
- Scope audit: pass; `git diff -- app components lib fixtures supabase` and `git diff -- package.json package-lock.json` are empty. No environment, migration, inquiry-body, Safety, age, image, or other implementation file is part of the change set.
- Runtime validation is not required and will not be claimed.

## Prohibited work confirmed

- No application UI, route, page, component, fixture code, or image asset was added.
- No file upload, OCR, PDF/image generation, copy/download/share behavior, analytics, or package was added.
- No Supabase write, API/server action, OpenAI, email, payment, or refund implementation was added.
- No provider inquiry was sent, no provider was selected, and no deployment was performed.
- No operator personal information, provider-inquiry body text, Safety implementation, or age implementation was changed.

## Next after Human acceptance

After Human accepts both Task M1-P1 and Task M1-P1-R1, the next possible task is M1-I1 Route Shell and Review Navigation only, and only after separate explicit Human authorization.

M1-I2 through M1-I6 and all later milestones remain unauthorized.
