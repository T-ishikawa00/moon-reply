# M1_UI_UX_DECISION_REGISTER.md

## Status

- Task: `M1-P1-R1 UI/UX Decision Alignment`
- Document status: documentation alignment completed; awaiting Human review
- Parent status: Task M1-P1 remains pending final Human acceptance
- Base commit: `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`
- Authority boundary: this register does not authorize M1-I1 through M1-I6 or any implementation
- Reference images are external review material only. No screenshot, copied asset, local path, or reference-site image is added to the repository.

## Human-approved emotional objective

> 恋愛の不安に対して単に答えを出すだけではなく、利用者の気持ちを少し軽くし、ひとりで考え続ける状態から抜け、次の行動を自分で選べる状態をつくる。

Judgment accuracy alone is insufficient. The experience must not amplify anxiety, create urgency, blame the user, or claim another person's true feelings. It must organize uncertainty, state when and under what conditions to review the decision again, and preserve the user's agency.

## LP structure

The LP is a vertically scrolling explanation and expectation-setting page. Each section communicates one primary value using a large heading, short explanation, generous spacing, and a concrete preview of the future product experience.

Approved order:

1. ファーストビュー
2. どんな悩みに向いているか
3. 月の返事が整理する内容
4. Web鑑定ノートのプレビュー
5. 保存用鑑定書のプレビュー
6. 利用の流れ
7. サンプル鑑定書
8. 料金と商品条件
9. AI利用・非保証・Safety
10. FAQ
11. 最終CTA
12. 法務・安全・問い合わせnavigation

On wider screens, explanation and preview may alternate left and right between sections. Mobile keeps one logical top-to-bottom reading order and must not introduce horizontal scrolling. Section boundaries remain clear through spacing and hierarchy, not through copied reference-site styling.

The LP and `/request` remain separate. The LP supports understanding, expectation formation, and the decision to begin. `/request` is the independent, input-focused experience. An LP form/input preview may explain what will be entered, but it is non-interactive, collects nothing, and never becomes a partial or full embedded request form. Every active request-start CTA goes to `/request`.

## CTA and price clarity

The first view must make all of the following understandable without relying on later sections:

- relationship and message analysis/decision support;
- a 鑑定ノート is returned;
- `税込980円`;
- `1相談につき1鑑定ノート`;
- one-shot purchase;
- no automatic renewal; and
- an explicit start action.

CTA direction: `鑑定ノートを依頼する`. Final wording may be refined in the authorized implementation slice, but the action must not be vague. M1-I1 uses non-fixed CTAs. A mobile fixed CTA is a candidate only: M1-I6 may evaluate a Human-approved Visual QA variant, and it is committed only after explicit Human adoption; otherwise the non-fixed design remains.

## Text-only input policy

The initial paid Web MVP accepts text input only:

- free text describing the current situation;
- copied conversation excerpts from LINE or similar services;
- the message the user is considering sending;
- relationship/context selections; and
- what the user wants to know.

The information architecture must cover at least `現在の状況`, `実際のやり取り`, and `送ろうとしている文面`. Whether the form is one page or multiple steps remains a Human gate before M1-I2.

## Conversation paste and anonymization

The form should actively reduce input burden by explaining that only necessary conversation excerpts may be copied and pasted.

Required guidance direction:

> LINEなどのやり取りは、必要な部分だけコピーして貼り付けられます。名前は「相手」「自分」「Aさん」などに置き換え、実名・電話番号・住所・勤務先などは削除してください。

The UI must not imply that copying an entire conversation or retaining third-party identifiers is necessary.

## Image-upload deferral

Image upload, LINE screenshots, OCR, image AI analysis, image storage, and automatic masking of personal information are outside the initial MVP and outside M1-I1 through M1-I6 unless separately approved later.

This deferral is required because screenshots can contain names, faces, account identifiers, phone numbers, locations, and other third-party information, while OCR accuracy, storage/deletion, AI transmission scope, privacy, and Safety behavior remain unresolved.

## Free and advertising policy

The initial MVP does not include:

- a free complete first reading;
- an ad-supported complete reading;
- advertising;
- free-use tickets, coins, or points; or
- a repeatable first-free mechanism.

The primary free experience is the fictional `/sample-report`, supported by short LP excerpts, previews of the Web鑑定ノート and 保存用鑑定書, an input example, and the usage flow. Any future free-preview experiment requires actual purchase evidence and a separate decision.

## Complete recommendation requirement

A result must never stop at a label alone. The contract applies to all approved normal labels: `送っていい`, `軽く送るならあり`, `今夜は待つ`, and `今日は送らない方がいい`. Each must include:

- the current judgment;
- the reason for that judgment;
- when to review the decision again;
- conditions that would change the recommended course;
- what to do while waiting;
- the next option if no contact arrives;
- a later message draft when sending later is appropriate; and
- what cannot be concluded from the available information.

Timing must be useful but uncertainty-aware. Do not invent unsupported precision such as `明日18時`.

## Web鑑定ノート

`月の返事 鑑定ノート` is the primary long-form Web reading experience. It is vertically read, chaptered, spacious, suited to longer Japanese text, and begins with the conclusion. It supports understanding the reasoning, reviewing message drafts, checking a three-day plan, and reading limitations and cautions.

M1 review route: `/review/result/result-normal-001`.

## 保存用鑑定書

`保存用鑑定書` is a separate presentation product for quick later reference. It is generated from the same future structured result but uses a different purpose and layout from the Web鑑定ノート.

It should prioritize the conclusion, reason summary, approved normal status, review timing, change conditions, message draft when applicable, three-day direction, and fixed cautions. For wait/do-not-send outcomes, the three-day direction and cautions must preserve the waiting action, no-contact next option, later-message direction, and explicit uncertainty from the complete Web recommendation. It is not a screenshot of the Web page and must not compress the full Web report into small A4 text.

M1 planning route: `/review/save-report/result-normal-001`. M1-I4 may create an A4-oriented fixture preview only after authorization. PDF/image generation, download, copy, share, and real file delivery remain out of scope.

## Safety-before-payment and downstream refund requirement

Safety before payment remains controlling:

- only `normal_allowed` may reach the future purchase flow;
- `needs_review` cannot purchase in the initial MVP;
- `rejected` cannot purchase;
- invalid age, missing consent, contradictory input, and unknown/error states cannot purchase.

Later milestones must account for exceptional post-payment failure:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> refund_required
  -> operator_attention_required
  -> refunded
```

No normal report is delivered when fulfillment is Safety-blocked. A technically recoverable failure may be retried; an unrecoverable or unfulfillable purchase becomes a full-refund candidate with idempotency, reason/state recording, operator notification, and user-status communication requirements.

Provider capability is unresolved. This register does not claim automatic refunds, a provider refund API, fee reimbursement, a refund deadline, reflection timing, or a concrete operator-console procedure.

## Review banner

Every `/review/**` page uses a two-level explanation.

Always-visible short banner:

`審査用プレビュー｜実際の決済・送信は行われません`

Accessible detail:

`この画面は架空データを使用しています。AI生成、メール配信、データ保存も動作しません。`

The banner must be available throughout `/review/**`, communicate through text rather than color alone, avoid resembling a purchase-success badge, expose the detailed explanation, and preserve the product world without allowing an ordinary production-UI misunderstanding.

## The Pattern reference: adopt / transform / reject

The external reference is UX inspiration only.

### Adopt

- vertical scrolling;
- one primary value per section;
- large heading, short explanation, and concrete UI preview;
- generous whitespace and clear section boundaries;
- alternating explanation/preview placement on wider screens;
- showing product value through the interface and deliverable previews;
- clear mid-page and final CTAs; and
- an unmistakable starting point for the independent request form.

### Transform

- astrology/chart imagery becomes moonlight, a reading note, tonight's conclusion, and a three-day action plan;
- phone previews show the Web鑑定ノート, message draft, and 保存用鑑定書;
- birth-data inputs become relationship situation, conversation paste, planned message, and the user's question; and
- the visual world uses moon, night, letter, and notebook motifs without implying an analytical or supernatural mechanism.

### Reject

- astrology, natal charts, zodiac symbols, and birth date/time/place analysis;
- fate, life-course, or another person's true-feeling claims;
- circular-chart imitation, including a moon-themed reskin;
- copying proprietary copy, images, assets, exact layout, or distinctive shapes;
- copying reference-site colors or fonts;
- horizontal-scroll behavior; and
- forced or unnatural Japanese line breaks.

The external screenshots remain outside the repository. Only the decisions in this register and related specifications are retained.

## Decisions deferred until visual implementation

- final CTA copy;
- exact colors, fonts, illustration style, and layout dimensions;
- exact left/right alternation by section and the mobile stacking details;
- whether a mobile fixed CTA is adopted after M1-I6 evidence; the acceptance record must state `adopted`, `rejected`, or `deferred`;
- one-page versus multi-step request form;
- exact form field grouping and progressive disclosure;
- A4 one page versus multiple pages;
- PDF, image, or both;
- download, browser print, smartphone-long format, copy, share, file naming, margins, and exact text volume.

These decisions may be reviewed only in the relevant authorized slice. None is silently resolved by the reference screenshots.

## Impacted implementation slices

| Slice | Planning alignment only; no authorization |
| --- | --- |
| M1-I1 | Vertical LP/navigation foundation, price/CTA clarity, two-level review banner, and links to Web/save-report previews; no final color/font decision |
| M1-I2 | Text-only input, conversation paste, anonymization, no file input, and a pre-implementation Human gate for form layout; Safety states unchanged |
| M1-I3 | One-shot税込980円 presentation, no free/ad-supported path, payment unavailable in M1, unresolved provider/delivery timing, and no blocked-state confirmation path |
| M1-I4 | Separate fictional sample, production-shaped Web鑑定ノート fixture, and A4-oriented 保存用鑑定書 fixture preview; complete recommendation structure; no file generation, AI call, or purchase claim |
| M1-I5 | Consistent terminology plus review-banner/navigation alignment; no material legal-substance expansion |
| M1-I6 | Evaluate emotional relief, long-Web readability, save readability, night-sky/paper balance, generalized hierarchy without reference-specific resemblance, fixed-CTA interference/adoption gate, 月の返事 specificity, and avoidance of cheap fortune-telling/generic AI appearance |

## Change-control rule

- Task M1-P1 and Task M1-P1-R1 are reviewed together and remain unaccepted until Human acceptance is recorded.
- This documentation alignment does not create a route, page, component, fixture, image asset, file generator, or integration.
- M1-I1 is the only possible next task, and only after both planning tasks are accepted and Human separately authorizes M1-I1.
- M1-I2 through M1-I6 remain sequentially gated and unauthorized.
- Any change to price, Safety ordering, free/ad policy, report split, input modality, or reference-site boundary requires a new explicit Human decision and cross-document alignment before implementation.
