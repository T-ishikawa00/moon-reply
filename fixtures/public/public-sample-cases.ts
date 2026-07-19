export type PublicSampleCase = {
  id: string;
  caseLabel: string;
  relationshipContext: string;
  confirmedFacts: readonly string[];
  lastReceivedMessage: string;
  intendedMessage: string;
  conclusion: string;
  reason: readonly string[];
  immediateAction: readonly string[];
  nextReviewCondition: readonly string[];
  uncertaintyLimitation: readonly string[];
};

export type PublicSampleReportDetails = {
  title: string;
  coverLine: string;
  shortLetter: readonly string[];
  messageTemperature: {
    quote: string;
    readings: readonly {
      label: string;
      text: string;
    }[];
  };
  threeDayDirection: readonly {
    label: string;
    direction: string;
  }[];
  closingLine: string;
  fixedDisclosure: string;
};

export type PublicSampleReportCase = PublicSampleCase & {
  report: PublicSampleReportDetails;
};

export const PUBLIC_SAMPLE_WAIT_CASE = {
  id: "sample-wait-001",
  caseLabel: "今夜は待つ",
  relationshipContext: "二度会った相手。会話はお礼で自然に終了し、返信を待って1日です。",
  confirmedFacts: [
    "相手は「今日はありがとう。また落ち着いたら連絡するね。」と会話を閉じています。",
    "返信待ちは1日で、予定変更など今夜伝える必要のある新しい事実はありません。",
    "利用者が送ろうとしているのは、返信を確かめる「忙しい？」という追加連絡です。",
  ],
  lastReceivedMessage: "今日はありがとう。また落ち着いたら連絡するね。",
  intendedMessage: "忙しい？",
  conclusion: "今夜は送らず、明日以降に再判断する",
  reason: [
    "相手が次の連絡に触れており、現在はその言葉を待てる状況です。",
    "今夜さらに誘いや確認を重ねる必要を示す新しい事実はありません。",
    "返信がない一日を、関係の結論として扱わないためです。",
  ],
  immediateAction: [
    "「忙しい？」という下書きは送信せず、今夜はいったん画面から離れます。",
    "相手の最後の文面と、自分が確認したいことを分けてメモします。",
    "気持ちが落ち着いた明日以降に、状況が変わったかを見直します。",
  ],
  nextReviewCondition: [
    "相手から新しい連絡が届いたとき。",
    "予定変更など、伝える必要のある新しい事実が生じたとき。",
    "明日以降、返信を確かめる目的ではない一通に整理できたとき。",
  ],
  uncertaintyLimitation: [
    "返信がない理由や相手の本心は断定しません。",
    "返信の有無や時期、今後の関係は保証しません。",
  ],
} as const satisfies PublicSampleCase;

export const PUBLIC_SAMPLE_SEND_CASE = {
  id: "sample-send-001",
  caseLabel: "今夜は短く返信してよい",
  relationshipContext: "会話が継続している相手から、来週の日程について具体的な質問が届いています。",
  confirmedFacts: [
    "相手から具体的な質問が届いている。",
    "利用者はまだ返信していない。",
    "追いメッセージではない。日程調整への直接回答である。",
  ],
  lastReceivedMessage: "来週なら水曜か金曜が空いてるよ。どっちがよさそう？",
  intendedMessage: "ありがとう。金曜なら空いてるよ。19時ごろどうかな？",
  conclusion: "今夜は短く返信してよい",
  reason: [
    "相手から具体的な質問があり、会話は途切れずに続いています。",
    "文面案は日程調整への直接回答で、返信を催促する内容ではありません。",
    "新しい連絡を重ねるのではなく、届いた問いに一度答える場面です。",
  ],
  immediateAction: [
    "文面案を一度だけ送る。送った後に追加送信を重ねない。",
    "質問や安心確認を同じ夜に追加せず、相手が返せる余白を残します。",
    "返信がなくても今夜は結論を急がず、翌日以降に再判断します。",
  ],
  nextReviewCondition: [
    "送信後、相手から具体的な返信が届いたとき。",
    "返信がなければ、翌日以降に状況を見直すとき。",
    "予定変更など、伝える必要のある新しい事実が生じたとき。",
  ],
  uncertaintyLimitation: [
    "返信や交際結果を保証しない。返信時期も予測しません。",
    "相手の本心を断定しない。この文面だけで気持ちを決めつけません。",
    "入力された事実から確認できる範囲での、一時点の判断です。",
  ],
  report: {
    title: "具体的な日程を尋ねられた夜に、短く返すための鑑定ノート",
    coverLine: "返事が届いている夜は、沈黙を埋める連絡とは判断の前提が変わります。",
    shortLetter: [
      "相手から具体的な質問が届いている夜は、返事のない時間を埋める追い連絡とは、判断の前提が異なります。",
      "今夜は気持ちを確かめるために新しい話題を重ねるのではなく、届いた日程の問いへ短く答える場面です。",
      "一通にまとめて返し、その後の余白まで残すことを、今夜の方針にします。",
    ],
    messageTemperature: {
      quote: "ありがとう。金曜なら空いてるよ。19時ごろどうかな？",
      readings: [
        {
          label: "やわらかさ",
          text: "お礼から始まり、相手の提案を受け取ったことが自然に伝わります。",
        },
        {
          label: "目的",
          text: "金曜と19時という候補を返す、日程調整への直接回答です。",
        },
        {
          label: "圧の見え方",
          text: "返事を催促せず、確認事項を一つに絞っているため、追加連絡を重ねる文面ではありません。",
        },
        {
          label: "送った後",
          text: "同じ夜に質問や安心確認を足さず、相手が返せる余白を残します。",
        },
      ],
    },
    threeDayDirection: [
      {
        label: "1日目",
        direction: "今夜は文面案を一度だけ送り、送信後の追加メッセージは控えます。",
      },
      {
        label: "2日目",
        direction: "返信があれば内容に沿って調整します。返信がなくても、理由や本心を決めつけません。",
      },
      {
        label: "3日目",
        direction: "予定変更など新しい事実があれば短く共有し、変化がなければ追加せずに再判断します。",
      },
    ],
    closingLine: "返す理由がある夜は、短く返し、その後の余白も一緒に残します。",
    fixedDisclosure: "この全文見本は固定の架空ケースです。実在相談、購入者事例、レビュー、AI生成実績ではありません。",
  },
} as const satisfies PublicSampleReportCase;

export const PUBLIC_SAMPLE_DISTANCE_CASE = {
  id: "sample-distance-001",
  caseLabel: "こちらからの追加連絡を止める",
  relationshipContext: "相手から「こちらから連絡する」と伝えられた後、利用者がすでに2回追加連絡しています。",
  confirmedFacts: [
    "相手は「また落ち着いたらこちらから連絡する」と伝えています。",
    "その後、利用者はすでに2回追加連絡しています。",
    "予定変更や実務的な必要はなく、さらに安心を求める文面を送ろうとしています。",
  ],
  lastReceivedMessage: "また落ち着いたらこちらから連絡する。",
  intendedMessage: "返信がない理由を確かめ、安心できる言葉を求める追加メッセージ",
  conclusion: "こちらからの追加連絡を一度止める",
  reason: [
    "同じ確認を重ねる段階になっています。",
    "追加送信が、相手にとって関係への圧力になる可能性があります。",
    "返信がない理由や相手の本心を、追加連絡だけで確認することはできません。",
  ],
  immediateAction: [
    "次の連絡が来るまで、追加メッセージは送らない方針にします。",
    "送りたい文面は送信画面から外し、安心を求めている自分の状態をメモします。",
    "一定期間後、自分が無理なく待てる関係かを見直します。",
  ],
  nextReviewCondition: [
    "相手から新しい連絡が来たとき。",
    "伝える必要のある新しい事実が生じたとき。",
    "一定期間後、自分が無理なく待てる関係か見直すとき。",
  ],
  uncertaintyLimitation: [
    "返信がない理由や相手の本心は断定しません。",
    "追加連絡を止めることで返信や関係の改善が起きるとは保証しません。",
  ],
} as const satisfies PublicSampleCase;

export const PUBLIC_SAMPLE_CASES = [
  PUBLIC_SAMPLE_WAIT_CASE,
  PUBLIC_SAMPLE_SEND_CASE,
  PUBLIC_SAMPLE_DISTANCE_CASE,
] as const satisfies readonly PublicSampleCase[];
