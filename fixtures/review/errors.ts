export type ReviewReportErrorFixture = {
  id: string;
  title: string;
  message: string;
  explanation: string;
  statusLabel: string;
};

export const REVIEW_REPORT_ERRORS = {
  missingFixture: {
    id: "error-missing-fixture",
    title: "指定された審査用fixtureは存在しません",
    message: "許可リストにないIDからレポート内容を表示することはできません。",
    explanation: "通常fixtureへの置き換えやレポート内容の推測は行わず、ここで安全に停止します。購入、結果生成、メール送信、データ保存は発生していません。",
    statusLabel: "fail closed・代替表示なし",
  },
  unavailableReport: {
    id: "error-unavailable-report",
    title: "審査用レポートを表示できません",
    message: "レポートを表示できない場合の、固定された審査用エラー見本です。",
    explanation: "この表示は実在の処理失敗、購入、返金、通知、再試行または保存記録を表すものではありません。審査用の表示境界だけを確認できます。",
    statusLabel: "審査用固定状態・外部処理なし",
  },
} as const satisfies Record<string, ReviewReportErrorFixture>;
