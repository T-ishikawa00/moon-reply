# 見本から相談入力への一括改修 R1 — Human review pack

2026-09-19 / LOCAL IMPLEMENTATION COMPLETE — HUMAN REVIEW READY

Primary（gpt-6-astra）が仕様解釈、統合、保護範囲・privacy監査、ブラウザ検証と最終判定を実施。Solが見本UIと計測、Lunaが依頼入口を実装。これはローカル実装の完了であり、Human受入・本番公開・売上改善の確認ではありません。

## Preview

- PC: http://localhost:3100/sample-report
- 同じLANのスマホ: http://192.168.1.180:3102/sample-report
- 両方起動済み。スマホからの到達は端末・Wi-Fi・Windows firewallに依存し、実機では未確認。firewall設定は変更していません。
- Previewは外部接続を防止した環境。販売、生成、認証Provider、メール、GA4は無効です。販売停止の表示は既存flagによるもので、本番状態を示しません。

再起動（PowerShell、`isolated local worktree`）:

```powershell
node scripts/preview-sample-request-conversion-r1.mjs
# 別ターミナル。実機スマホから確認する場合
node scripts/preview-sample-request-conversion-r1.mjs --lan
```

停止は起動ターミナルで Ctrl+C。PC版は3100、LAN版は3102。ルーターの公開・ポート転送は不要です。

ビルドを再作成する場合は外部通信guard付きで:

```powershell
node --input-type=module -e "import { buildOffline } from './scripts/remediation-offline-runtime.mjs'; await buildOffline();"
```

## 一度の通し確認

1. スマホで上記LAN URLを開く。PCではChromeの端末表示を390×844にする。商品説明、税込980円、都度払い、自動更新なし、入力では支払いが発生しない説明を確認。
2. 「まず見本を読む」から初期WAITを読む。「忙しい？」は送信推奨ではなく迷っている下書き。今夜は追加送信せず、全文の理由・見直し条件まで確認。
3. ケース2を選びSENDへ切替。日程への直接回答なので短く返信する判断に変わることを確認。WAITへ戻る。
4. 読書中の固定CTA、末尾の価値・価格・CTA、FAQを確認。冒頭・クロージング・フッター・別コントロールのキーボードフォーカス時には固定CTAが隠れる。横画面や狭い表示では固定ではなく通常フローになる。
5. 「自分の状況を入力する」を押す。相談欄が空で、見本の文面が投入されていないこと、入力画面には固定CTAがないことを確認。
6. 「私は18歳以上です」をチェックする。関係と知りたいことを選び、自分の言葉で書き始める。ここまでで課金・自動送信は発生しない。
7. 必要なら空欄で「鑑定前の確認へ」を押してエラーとfocusを確認。長文入力、任意ニックネーム、「この文面がどう届くか知りたい」の原文必須、次画面から「相談内容へ戻る」で値が保持されることを確認。購入や実認証へは進めない。

## 完成内容・文言・スクリーンショット

- [最終文言](final-copy.md)
- [WAIT全文（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md) / [保持されたSEND全文（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)
- [19枚の比較ギャラリー（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)（ブラウザで開く）
- [mobile 冒頭（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[WAIT（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[SEND（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[末尾（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[固定CTA（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[依頼入口（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[最初の操作位置（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)
- [desktop WAIT（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[SEND（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)、[依頼入口（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md)

スクリーンショットはローカルChromeのviewport検証。実スマホの写真ではありません。開発用Next overlayのみ撮影時に非表示にしています。商品UIは変更せず撮影しています。

## 計測の定義と証拠

`trackClientMeasurement → createMeasurementEvent/厳密validation → Ga4ClientMeasurementAdapter → 記録用gtag` まで確認。実Google scriptはロードせず、ネットワークルーティングでローカル記録用scriptを返しています。[payloadとブラウザ操作結果](browser-results.json)、[unit記録](unit-measurement.txt)。Human Previewでは計測自体OFFです。

| イベント | 発火 | adapterへ渡す固定値 | GA4形式の記録payload |
|---|---|---|---|
| sample_cta_click | 主CTA明示クリック | placement=hero/sticky/closing | session_id、engagement_time_msec=1、placement |
| request_view | hash復元確定後、初期phase 1が操作可能 | experience=consultation_request | session_id、engagement_time_msec=1 |
| sample_end_view | 全文直後のmarkerが50%以上、連続1秒、document可視 | sample=public_sample | session_id、engagement_time_msec=1 |

末尾判定は固定CTAに隠れる領域を除くためviewport下160pxを除外。読了・理解の証明ではありません。

view系はmountごと1回。再描画・ケース切替・phase往復では重複しません。新しいmountでの再訪は再記録します。通常CTAは同一mountで全placementを通じて1遷移1回。修飾キー付きクリックは別タブ等への別の遷移意図として扱い、後の通常クリックを妨げません。コンパクト表示の通常フローCTAはsticky placementです。

既存sample_view、request_start（最初のchange、成人確認も含む）、request_complete、checkout_start→begin_checkout、purchaseは変更なし。内部リンクにUTM追加なし。記録では同一session_idと元のyoutube流入を保持。本文・名前・メール・購入ID・result token・自由形式URLのイベントpayloadは送信しません。private page_view復活なし。初期キュー・直接dispatch双方で計測例外を隔離。

## 検証結果

| 確認 | 結果 |
|---|---|
| 新規計測＋保護範囲回帰 | 12/12 PASS |
| ブラウザ通し操作 | 42/42 PASS |
| Measurement R1既存回帰 | 14/14 PASS |
| Preparing UX（hosted/legacy/auth-disabled/missing-cookie） | PASS |
| Customer UX既存回帰 | 4/4 PASS |
| typecheck / 対象lint / diff check | PASS |
| guard付きproduction build | PASS、外部接続試行0 |
| production Preview通し操作 | PASS、実GA script0、外部要求0 |

ブラウザではWAIT/SEND、390×844、1440×1000、844×390、320×600＋文字200%、長文拡張、エラーfocus、原文必須、戻る、hash復元、全CTA、連打、observer再表示、1秒未満の非発火、keyboard focus、footer、transport例外を確認。[最終Preview確認](preview-smoke.json)。物理キーボードやスマホのソフトウェアキーボード実機確認は未実施。

保護証拠：既存SENDとトップ共有fixtureは基準SHAと同一。RequestFormの既存named functions（nested含む）、phase 2以降のJSX、渡すruntime propsは同一。価格、AI品質契約、Paid Delivery Guarantee、有料report renderer、Safety/Authロジック、決済・金融・納品、DB、外部設定、global CSS、YouTubeの差分0。

検証途中の問題は区別して記録：

- 開発サーバーのNextバージョン確認が外部通信guardに遮断された。実送信はされず、以後はその固定URLだけローカル503応答にした。最終runの外部接続試行0。
- 旧GA4 one-shotのoffline helperは専用test ID未設定で停止。実送信0。そのhelperの成功とはせず、本タスクのrecording transportと既存Measurement R1で検証。
- 初回Luna buildは通常の `npm run build` で `.env.local` のロード表示があった。秘密値出力・明示的外部操作はないが、その初回buildにはネットワークguard証拠がない。提出するbuildとPreviewはPrimaryがOS環境のみ・dotenv読取遮断・network guardで再構築したもの。
- Next devによる `next-env.d.ts` 自動変更は最終production buildで元に戻った。対象差分には含まない。
- 初期テストの同一URLへのhash移動を新規mountと取り違えた期待値を修正。既存フォームのphase遷移は変更していない。

## Source・境界・未確認

開始branch: `codex/guidance-quality-final-v19-l5`。開始HEAD: `978928c49d4205d55d905883a15d4f66ae8724fd`。branch/reset/stash操作なし。既存未追跡資料と別worktreeは保持。[開始記録](baseline.json)、[変更・検証binding](verification-summary.json)。local commitのIDは最終回答と `git log -1` を参照。

実装sourceは10ファイル（既存7＋新規fixture/CSS3）、検証/Preview script3ファイル、READMEと最終文言2ファイル＝事前登録15ファイル。これに承認済み証拠ディレクトリ内のログ・19画像・レビュー資料・検証記録を追加。詳細はverification-summary.json。

今回のpush/deploy/remote migration/実AI/実決済/実通知/実GA4送信/外部設定変更/YouTube操作は実施していません。実GA4受信、本番配備、本番の販売状態、実認証Provider、購入・有料納品E2E、実機、Human受入、転換率・売上効果は未確認です。既存auth継続はsource不変とローカル回帰で確認した範囲に限ります。

GAイベント数を人数と同一視せず、今回の架空操作を顧客行動・売上改善の証拠にしません。公開は完成版のHuman確認後、別承認です。
