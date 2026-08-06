# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3 Review

## Status

`customer_note_implemented_pending_human_visual_chatgpt_review`

Package B の顧客向け鑑定ノートを、accepted baseline
`8700ded1454058f72d33f2eb4d1ae6a05b6e008c` 上に実装した。自動検証は完了している。
Human Visual Review、ChatGPT Visual Review、Product Owner successor review は未実施である。

## Boundary

- `CustomerAssessmentNote` の入力は `projection: CustomerAssessmentProjectionV1` のみ。
- Full Report、Runtime result、Provider output、診断結果、fact ID は component に入らない。
- レイアウトは report schema、case ID、fixture ID では分岐しない。
- accepted Projection/Delivery、active Runtime v4、API route、repository、Prompt、Catalog、Schema、Pipeline は変更していない。
- Provider / DB / Supabase は `0 / 0 / 0`。

## Customer hierarchy

1. 今の結論と、その理由
2. 送信文案、または依頼された場合の null-draft 説明
3. 今すぐ行うことと、避けること
4. 見直し時期と、条件ごとの次の方向
5. 依頼テーマに対応する任意モジュール

文案は Projection の文字列をそのまま表示し、同じ値を
`navigator.clipboard.writeText` に渡す。改行・絵文字・空白を変換せず、成功と失敗を
`aria-live` で通知する。文案が null の場合は copy button を生成しない。

## Requested-topic modules

- `organize_emotions`: 最初の short letter と anxiety reframe を重複排除して表示する。
- `message_impact`: 文面の印象を顧客向け4ラベルで表示する。
- `relationship`: non-null の要約だけを表示し、空見出しは出さない。
- `next_three_days`: legacy は「今夜 / 次の日 / 3日目」、split は「今夜 / 次に / 見直す条件」と表示する。
- `draft_message`: prominent draft または decision に対応する固定の非表示理由を使う。
- `decide_send_or_wait`: 上位の結論・行動・見直しで満たし、重複 section は作らない。

残りの補足は一つの collapsed-by-default native `<details>` に限定した。上位で表示済みの
exact string は再掲しない。

## Review route

- Route: `/review/runtime/v12`
- Navigation: `/review/runtime/v12?fixture=<fixture_id>`
- Fixture count: `9`
- 固定 Projection はすべて `decodeCustomerAssessmentProjectionV1` を通る。
- 既存 convention と同じく、production または
  `M2_INTERNAL_RUNTIME_ENABLED !== "true"` の場合は `notFound()`。
- `noindex / nofollow`。公開 navigation、Runtime form、purchase flow、API、DB への接続はない。

## Automated verification

- Dedicated verifier: PASS
- Package A R1 verifier: PASS `23/23` on the immutable accepted-source checkout
- Decision Policy: PASS
- TypeScript typecheck: PASS
- ESLint: PASS with zero warnings
- Next production build: PASS
- `git diff --check`: PASS

Human visual fieldsはすべて `null` または `pending` のままであり、自動検証の失敗を意味しない。

## Human / ChatGPT visual review matrix

全9 fixturesについて、1440px、399px、320px、keyboard-only、copy focus、copy success/failure
announcement、details interaction、200% zoom、reduced motion、長い日本語、絵文字と改行、horizontal
scroll、overlap、draft discoverability を確認する。現時点ではすべて pending である。

## Explicitly not authorized

- Package C / D / E / F
- Provider rerun、Runtime activation、Public Runtime 接続
- R4、C2、payment、Safety Gate
- PR、main merge、force push

この Package は JPY980 readiness を決定しない。次の操作は Human / ChatGPT visual review のみである。
