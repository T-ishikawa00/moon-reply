export type ReviewPresentationMetadata = {
  web: {
    label: string;
    purpose: string;
    informationDensity: "long-form";
  };
  save: {
    label: string;
    purpose: string;
    informationDensity: "quick-reference";
  };
  reviewDateLabel: string;
};

export type ReviewReportFixture = {
  id: string;
  requestFixtureId: string;
  fictionalReviewStatus: {
    fictional: true;
    reviewOnly: true;
    purchased: false;
    aiGenerated: false;
    delivered: false;
    saved: false;
  };
  judgmentLabel: string;
  reportTitle: string;
  consultationTheme: string;
  currentConclusion: readonly string[];
  conclusionReasonSummary: string;
  reasonPoints: readonly string[];
  observedFacts: readonly string[];
  possibleInterpretations: readonly string[];
  materialUnknowns: readonly string[];
  anxietyCore: readonly string[];
  plannedMessageAnalysis: readonly string[];
  recommendedAction: readonly string[];
  reviewTiming: string;
  recommendationChangeConditions: readonly string[];
  waitingAction: readonly string[];
  noContactNextOption: string;
  laterMessageDraft: string;
  threeDayPlan: readonly {
    label: string;
    direction: string;
  }[];
  fixedLimitationDisclaimer: string;
  presentationMetadata: ReviewPresentationMetadata;
};

export type PublicSampleReportFixture = {
  id: string;
  fictionalReviewStatus: {
    fictional: true;
    purchased: false;
    reviewedByCustomer: false;
    aiGenerated: false;
  };
  visibleLabels: readonly string[];
  title: string;
  consultationTheme: string;
  judgmentLabel: string;
  sections: readonly {
    heading: string;
    paragraphs: readonly string[];
  }[];
  laterMessageDraft: string;
  fixedLimitationDisclaimer: string;
};

const resultNormal001 = {
  id: "result-normal-001",
  requestFixtureId: "request-normal-001",
  fictionalReviewStatus: {
    fictional: true,
    reviewOnly: true,
    purchased: false,
    aiGenerated: false,
    delivered: false,
    saved: false,
  },
  judgmentLabel: "今日は送らない方がいい",
  reportTitle: "月の返事 鑑定ノート",
  consultationTheme: "二度会った相手へ、返信を待つ今夜に追加のメッセージを送るか",
  currentConclusion: [
    "この審査用ケースの結論は「今日は送らない方がいい」です。今夜は新しい文面を重ねず、すでに交わした言葉と今の不安をいったん分けて扱う方が安全です。",
    "送らないことは関係を諦める判断ではありません。返信を急かさず、自分の言葉を落ち着いた状態で選び直すための一時停止です。",
  ],
  conclusionReasonSummary: "直近の会話はお礼で自然に区切られ、相手からは「落ち着いたら連絡する」と伝えられています。今夜さらに誘いを重ねる必要を示す新しい事実はありません。",
  reasonPoints: [
    "相手が次の連絡に触れており、現在はその言葉を待てる状況です。",
    "返信待ちは一日で、関係が悪化したと判断できる材料はありません。",
    "下書きは丁寧ですが、今夜重ねると確認を急ぐ印象が先に立つ可能性があります。",
  ],
  observedFacts: [
    "入力では、二度会ったあとに相手の返信間隔が少し長くなったと説明されています。最後の相手の文面は「今日はありがとう。また落ち着いたら連絡するね。」です。",
    "あなたは「こちらこそありがとう。楽しかったです。」と返しており、その時点の会話はお礼の往復として区切られています。",
    "送ろうとしている文面は、再会を希望する丁寧な一文です。責める語句や返信期限はありませんが、今夜送るか迷っている状態です。",
  ],
  possibleInterpretations: [
    "相手の「落ち着いたら連絡する」は、忙しさや予定を整理してから連絡したいという意味かもしれません。一方で、社交的な締めとして使われた可能性も残ります。",
    "返信間隔が長くなったことには、生活上の都合、連絡頻度の違い、関係への温度差など複数の説明が考えられます。入力だけで一つに決めることはできません。",
    "今夜追加の誘いを受け取った場合、好意的で丁寧だと感じる可能性もありますが、返答を待たれている、判断を急かされていると感じる可能性もあります。",
  ],
  materialUnknowns: [
    "相手が今どの程度忙しいか、返信を考えているか、次に会う意思があるかは確認できません。",
    "返信間隔が長くなった理由と、相手が心地よいと感じる連絡頻度は分かりません。",
    "今夜送る場合と送らない場合の結果、返信の有無や時期は予測・保証できません。",
  ],
  anxietyCore: [
    "不安の中心は、文面の丁寧さそのものより、待つ間に相手の関心が薄れるのではないかという怖さにあります。返信の遅さを、自分の価値や関係の答えとして受け取りたくなっている状態です。",
    "ただし、現在確認できるのは返信がまだないことだけです。不安は大切な感覚ですが、それ自体を相手の意思の証拠にしないことが、今夜の判断を安定させます。",
  ],
  plannedMessageAnalysis: [
    "下書きの「また都合のよい日に話せたらうれしいです」は穏やかで、非難も要求もありません。文面単体では強い圧力のある内容ではありません。",
    "一方、相手が次の連絡に触れた直後に送ると、文章の柔らかさよりも、返事を待てずに再確認したタイミングが目立つ可能性があります。今夜は内容より送信時機を見直す場面です。",
  ],
  recommendedAction: [
    "今夜は下書きを送らず、送信画面から離してください。削除する必要はなく、落ち着いたときに読み直せる形で残して構いません。",
    "相手の最終文面、あなたの返信、今送ろうとしている目的を三つに分けてメモすると、事実と不安を混同しにくくなります。",
    "返信があれば、その内容に合わせて一度だけ返します。新しい必要事項が生じた場合も、目的を一つに絞って再判断します。",
  ],
  reviewTiming: "一度気持ちが落ち着いてから、翌日以降に状況を見直してください。相手から返信があった場合や、予定調整など連絡する実用的な理由が生じた場合は、その時点で方針を再判断できます。",
  recommendationChangeConditions: [
    "相手から返信があり、会話を続けられる具体的な内容が届いたとき。",
    "予定変更など、相手に伝える必要のある新しい事実が生じたとき。",
    "不安の確認ではなく、短い挨拶を一度送る目的に整理できたとき。",
  ],
  waitingAction: [
    "通知や画面を確認する回数を自分で決め、それ以外の時間は別の予定へ戻る。",
    "送りたい理由を「共有したいこと」と「安心を確かめたいこと」に分けて書く。",
    "下書きから質問や説明要求を増やさず、必要なら短く整える。",
  ],
  noContactNextOption: "しばらく反応がない場合は、落ち着いた状態で一度だけ低圧の文面を送るか、追加連絡をせず相手の行動を見るかを選べます。送った後は重ねて確認せず、自分が待てる範囲も判断材料にしてください。",
  laterMessageDraft: "この前はありがとう。落ち着いたら、また都合のいいときに話せたらうれしいです。返信は急がなくて大丈夫です。",
  threeDayPlan: [
    { label: "1日目", direction: "今夜は送らず、下書きを閉じます。確認できる事実と不安からの推測を分け、画面を見続ける時間を減らします。" },
    { label: "2日目", direction: "相手から連絡があれば内容に沿って短く返します。連絡がなければ、下書きの目的と圧力の有無を落ち着いて見直します。" },
    { label: "3日目", direction: "状況が変わらなければ、一度だけ低圧で送るか、距離を置いて待つかを自分の負担も含めて選びます。返信時期の予測はしません。" },
  ],
  fixedLimitationDisclaimer: "このレポートは、入力された情報をもとにAIが整理・分析した判断材料です。相手の本心や将来の出来事を断定・保証するものではありません。医療・心理・法律上の助言ではありません。",
  presentationMetadata: {
    web: {
      label: "審査用 Web鑑定ノート",
      purpose: "理由と行動を章立てで深く読む有料成果物の表示形を確認する",
      informationDensity: "long-form",
    },
    save: {
      label: "保存向けに再構成した審査用見本",
      purpose: "結論、再判断、文面、短期方針を後で短時間に見返す",
      informationDensity: "quick-reference",
    },
    reviewDateLabel: "審査用固定fixture・実際の購入日／作成日ではありません",
  },
} as const satisfies ReviewReportFixture;

export const PUBLIC_SAMPLE_REPORT = {
  id: "sample-report-g001",
  fictionalReviewStatus: {
    fictional: true,
    purchased: false,
    reviewedByCustomer: false,
    aiGenerated: false,
  },
  visibleLabels: [
    "架空サンプル",
    "実在の相談者ではありません",
    "実際の購入・レビューではありません",
    "AI生成実績ではありません",
  ],
  title: "返事を待つ夜に、もう一通送る前の小さな整理",
  consultationTheme: "返事がまだない相手へ「忙しい？」と追加で送りたくなっている架空ケース",
  judgmentLabel: "今夜は待つ",
  sections: [
    {
      heading: "今夜の整理",
      paragraphs: [
        "返事が届かない時間は、実際より長く感じられることがあります。画面を開くたびに「嫌われたのかも」と考えてしまう夜ほど、もう一通送って確かめたくなるのは自然な反応です。",
        "この架空ケースでは、今夜は追加の文面を送らずに待つ方向を勧めます。待つことは気持ちを我慢して消すことではなく、相手の沈黙に急いで意味を与えず、自分で次の一手を選ぶ余白を戻すための判断です。",
      ],
    },
    {
      heading: "確認できることと、分からないこと",
      paragraphs: [
        "確認できるのは、最後のメッセージに質問が一つ含まれていること、まだ返事がないこと、追加で「忙しい？」と送りたくなっていることです。返事がない理由や相手の気持ちは入力だけでは分かりません。",
        "忙しい、返信内容を考えている、連絡のペースが違う、少し距離を見ているなど、複数の可能性があります。どれかを事実として選ぶ材料はないため、今夜の不安だけで関係の結論にしないことが大切です。",
      ],
    },
    {
      heading: "待つことが役立つ理由",
      paragraphs: [
        "「忙しい？」という短い一言でも、返答を求められているように伝わる可能性があります。すでに質問を送っている場面では、内容よりも連絡が重なること自体が圧力として受け取られる場合があります。",
        "今夜いったん止めると、安心を確かめるための文面と、本当に相手へ伝えたい言葉を分けられます。通知を見る回数を決め、下書きは送信せずメモへ置き、今夜の予定に意識を戻してください。",
      ],
    },
    {
      heading: "後で送る場合",
      paragraphs: [
        "気持ちが落ち着いてから状況を見直し、それでも一度連絡したい場合は、返事の説明を求めず、会話の入口だけを作る短い文面にします。送るか、さらに待つか、距離を置くかはあなたが選べます。",
      ],
    },
    {
      heading: "残る不確実性",
      paragraphs: [
        "この判断から、相手の好意、返信の有無や時期、今後の関係は断定できません。返事が来ない状態が続く場合は、追加連絡だけでなく、自分が無理なく待てる関係かを見直すことも次の選択肢です。",
      ],
    },
  ],
  laterMessageDraft: "最近どう？　落ち着いたときに、また話せたらうれしいです。返信は急がなくて大丈夫です。",
  fixedLimitationDisclaimer: "月の返事は、入力された情報をAIで整理・分析し、判断材料を返す設計です。相手の本心や返信、将来の出来事を断定・保証せず、医療・心理・法律上の助言ではありません。",
} as const satisfies PublicSampleReportFixture;

export const REPORT_FIXTURES = {
  "result-normal-001": resultNormal001,
} satisfies Record<string, ReviewReportFixture>;

export type ReviewReportFixtureId = keyof typeof REPORT_FIXTURES;

export function getReportFixture(id: string) {
  return Object.prototype.hasOwnProperty.call(REPORT_FIXTURES, id)
    ? REPORT_FIXTURES[id as ReviewReportFixtureId]
    : undefined;
}

function countSubstantiveCharacters(segments: readonly string[]) {
  return segments.join("").replace(/\s/gu, "").length;
}

const sampleSubstantiveSegments = [
  ...PUBLIC_SAMPLE_REPORT.sections.flatMap((section) => section.paragraphs),
  PUBLIC_SAMPLE_REPORT.laterMessageDraft,
  PUBLIC_SAMPLE_REPORT.fixedLimitationDisclaimer,
];

const webSubstantiveSegments = [
  ...resultNormal001.currentConclusion,
  resultNormal001.conclusionReasonSummary,
  ...resultNormal001.reasonPoints,
  ...resultNormal001.observedFacts,
  ...resultNormal001.possibleInterpretations,
  ...resultNormal001.anxietyCore,
  ...resultNormal001.plannedMessageAnalysis,
  ...resultNormal001.recommendedAction,
  resultNormal001.reviewTiming,
  ...resultNormal001.recommendationChangeConditions,
  ...resultNormal001.waitingAction,
  resultNormal001.noContactNextOption,
  resultNormal001.laterMessageDraft,
  ...resultNormal001.threeDayPlan.map((item) => item.direction),
  ...resultNormal001.materialUnknowns,
  resultNormal001.fixedLimitationDisclaimer,
];

export const SAMPLE_REPORT_SUBSTANTIVE_CHARACTER_COUNT = countSubstantiveCharacters(sampleSubstantiveSegments);
export const RESULT_NORMAL_WEB_SUBSTANTIVE_CHARACTER_COUNT = countSubstantiveCharacters(webSubstantiveSegments);
