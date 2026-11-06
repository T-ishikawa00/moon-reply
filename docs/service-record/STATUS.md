# 保存状態と終了記録

この文書は2026年11月7日時点の保存案内です。最終公開版のコード、当時の公開記録、Humanによる終了報告、現在のGitHub読み取りを区別します。サービス再開や公開を案内するものではありません。

## 確認区分

| 区分 | 記録 | 意味と限界 |
| --- | --- | --- |
| 今回直接確認したソース | 最終公開版の基準SHAは `38985ccf0c01f31af01ddf5d61ce1dca5d7ea763`。現行の保存候補は同SHAを起点にした文書追加 | SHAはコードの同一性を示す。現在の外部稼働を示さない |
| 保存済み公開記録 | Netlify Published deploy `6aae891544ea520008d5015b`、公開日時2026-09-19 22:10:19 JST、commitは上記SHA。2026-10-02の保存済みreadbackを今回照合 | 当時のrevision照合。現在の配信・安全性の保証ではない |
| Human実行報告 | 2026年10月24日にNetlify主サイト・独立Webhook入口とSupabaseを永久削除し、不在を確認。Stripe Webhookを無効化、専用OpenAIキー4本を失効、Web向けDNSを解除。ドメインとStripeアカウント・取引記録は保持 | Human報告として記録。今回、各providerの管理画面を再検証していない。実行資料はGit外で管理 |
| Human実績報告 | 確認できる有料決済は全期間で1件・980円、納品完了 | 実決済処理の経験を示す。一般需要、自然購入、継続売上の証明ではない。DB行数を実顧客数へ換算しない |
| Human確認 | 旧Gmail OAuth認証情報は失効確認済み、`Human-confirmed revoked / CLOSED` | Codexが再検証した事実ではない。他の認証情報へ適用しない |
| 2026年11月7日のGitHub読み取り | リポジトリはPrivate、既定ブランチは `main`、Archiveは未実施 | 読み取り時点の設定。反映後の状態を保証しない |

Google Adsの利用停止、残存する別種の認証情報やStripe設定の状態はこの保存作業では確認していません。これらを運用完了とも、現在稼働中とも扱いません。外部の現在値は、個別に確認した範囲以外は `UNKNOWN` です。旧Gmail OAuth失効確認は終了事項として扱います。

## Git上の版と資産

最終公開版はSHAで特定します。2026年11月7日のローカル確認では `main` は `61e33a10e195fad17e253a6b9719217e1992f273`、ローカル `release/private-ready` は `9d6212dc9f47b4c6afcb0af262bc047ca786182a` を指し、後者は最終公開SHAより14 commit古い状態でした。当時の `origin/release/private-ready` は最終公開SHAを指すローカル追跡参照でした。ブランチ名だけで最終版を選ばないでください。GitHubの現在値は別途読み取り、外部反映前に再照合します。

GitHub APIの今回の直接読み取りでは、remote `main` は上記 `61e33a10...`、remote `release/private-ready` は最終公開SHAでした。ローカルのrelease参照を動かさず、差異を記録しました。`main` は最終公開SHAの祖先で、整備前の比較は0 ahead／314 behindです。外部反映直前に再照合する必要があります。

この保存候補は最終公開SHAから文書とローカル閲覧補助を追加するもので、当時の公開版とは別commitになります。既存履歴、ブランチ、タグ、元worktreeの未コミット変更と未追跡資料は保持します。2026年11月7日に既存Git bundleを直接検証し、整備前の全ローカルrefsの到達可能履歴が収録済みと確認しました。内部capture参照1件は同名のtip記録がありませんが、そのcommitはbundle内の履歴に含まれます。bundleには未コミット変更や未追跡ファイルを含められません。顧客原本、取引原本、秘密値、バックアップはGit外の保管対象です。79テーブルの補助保全と暗号化保管の報告はありますが、公式CLIでの完全復元と復元試験は未検証です。

終了前のREADMEは [原文の退避資料](../archive/README_BEFORE_RETIREMENT_20261024.md) と最終公開SHA内の `README.md` に保持しました。退避資料の相対リンクと古い現在形は当時のままです。今回の読む入口はこの索引と現在のREADMEです。

## 読み進める順序

- [FUNCTION_AND_FLOW](FUNCTION_AND_FLOW.md)：当時の利用者操作と画面
- [ARCHITECTURE](ARCHITECTURE.md)：コード上の責任・データ境界
- [EVIDENCE_INDEX](EVIDENCE_INDEX.md)：実装・試験・Human報告の所在
- [LOCAL_VIEWING](LOCAL_VIEWING.md)：外部サービスなしで確認できた範囲
- [KNOWN_LIMITATIONS](KNOWN_LIMITATIONS.md)：未修正事項と証明できない事項

既存の [CURRENT_FOCUS](../CURRENT_FOCUS.md) と [CODEX_HANDOFF](../CODEX_HANDOFF.md) は開発時点の連続記録です。先頭の「Current」や「Active」は終了後の現在地ではありません。
