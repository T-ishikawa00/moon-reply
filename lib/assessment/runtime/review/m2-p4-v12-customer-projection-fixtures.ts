import {
  decodeCustomerAssessmentProjectionV1,
  type CustomerAssessmentProjectionV1,
} from "../customer-assessment-projection-v1.ts";

const fixedLimitation =
  "この鑑定は、入力された内容をもとにした現時点の整理です。";

const fixtureDefinitions = [
  {
    id: "simple_business_reply_with_draft",
    label: "業務連絡への短い返信",
    summary: "必要な結論と文案だけを上位に置いた、最小構成の確認用です。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p4-split-runtime-report-v1",
      requestedTopics: ["draft_message", "decide_send_or_wait"],
      decisionCode: "reply_now",
      primaryReason:
        "日程確認への返答だけなので、要点を短く返すのが最も自然です。",
      finalDraft: {
        text: "ご連絡ありがとうございます。火曜日の14時で承知しました。",
        policy: "required_now",
        useTiming: "now",
      },
      immediateAction: {
        action: "日時と宛先を確認して、この文面を一度だけ返信する。",
        avoid: ["背景説明を足しすぎない。"],
        secondaryActions: [],
      },
      reassessment: {
        when: "送信前に日時や宛先に誤りがないか確認する。",
        conditions: [
          {
            condition: "予定の変更が分かった場合",
            resultingDirection: "wait_and_reassess",
          },
        ],
      },
      relationshipSummary: null,
      messageTemperature: null,
      optionalDetails: {},
      fixedLimitation,
    },
  },
  {
    id: "ordinary_reply_waiting",
    label: "返事を待つ夜",
    summary: "送信を急がず、依頼された気持ちの整理だけを表示します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p4-split-runtime-report-v1",
      requestedTopics: ["decide_send_or_wait", "organize_emotions"],
      decisionCode: "wait_and_reassess",
      primaryReason:
        "最後の連絡からまだ時間が短く、今夜さらに送るより相手の返事を待つ方が穏やかです。",
      finalDraft: null,
      immediateAction: {
        action: "今夜は追加で送らず、スマートフォンから少し離れる。",
        avoid: ["既読や通知を何度も確認しない。"],
        secondaryActions: ["気になることをメモに一度だけ書き出す。"],
      },
      reassessment: {
        when: "明日の夕方まで返事がなければ、状況をもう一度見直す。",
        conditions: [
          {
            condition: "相手から具体的な質問が届いた場合",
            resultingDirection: "reply_now",
          },
        ],
      },
      relationshipSummary: null,
      messageTemperature: null,
      optionalDetails: {
        shortLetter: [
          "今夜は答えを急がなくて大丈夫です。待つことも、関係を丁寧に扱う選択です。",
          "不安が大きいときは、結論ではなく今わかっている事実だけを見直してみてください。",
        ],
        anxietyReframe: [
          "返事がまだないことと、拒まれたことは同じではありません。",
          "今夜の沈黙だけで、これからの関係まで決める必要はありません。",
        ],
      },
      fixedLimitation,
    },
  },
  {
    id: "polite_thank_you_with_draft",
    label: "丁寧なお礼の文面",
    summary: "短いお礼文と、その文面が与える印象を確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p3-runtime-report-v1",
      requestedTopics: ["draft_message", "message_impact"],
      decisionCode: "reply_now",
      primaryReason:
        "相手が時間を割いてくれた直後なので、短く感謝を返すと自然に会話を結べます。",
      finalDraft: {
        text: "今日はありがとうございました。お話しできてうれしかったです。",
        policy: "required_now",
        useTiming: "now",
      },
      immediateAction: {
        action: "この文面を確認し、今日のうちに一度だけ返信する。",
        avoid: ["次の約束を同時に迫らない。"],
        secondaryActions: [],
      },
      reassessment: {
        when: "相手から返事が届いた時点で、次の会話を考える。",
        conditions: [
          {
            condition: "相手が次の予定を尋ねてきた場合",
            resultingDirection: "reply_now",
          },
        ],
      },
      relationshipSummary: null,
      messageTemperature: {
        softness: "丁寧でやわらかい印象です。",
        affection: "好意は自然に伝わりますが、強く押し出していません。",
        pressure: "返事を求める圧力はほとんどありません。",
        adjustment: "感謝を中心にして、次の要求を加えない形にしています。",
      },
      optionalDetails: {
        interpretations: [
          "素直なお礼として受け取られる可能性が高い文面です。",
          "会話を気持ちよく終える合図としても伝わります。",
        ],
      },
      fixedLimitation,
    },
  },
  {
    id: "relationship_summary_requested",
    label: "今の関係を整理",
    summary: "関係性が依頼された場合だけ要約を追加する確認用です。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p4-split-runtime-report-v1",
      requestedTopics: ["decide_send_or_wait", "relationship"],
      decisionCode: "wait_and_reassess",
      primaryReason:
        "会話は続いていますが、次の予定を決める材料はまだ相手から示されていません。",
      finalDraft: null,
      immediateAction: {
        action: "今夜は追加で誘わず、相手からの次の反応を待つ。",
        avoid: ["関係を確かめる質問を重ねない。"],
        secondaryActions: [],
      },
      reassessment: {
        when: "相手から具体的な日程や質問が出たときに見直す。",
        conditions: [
          {
            condition: "相手から会う提案が届いた場合",
            resultingDirection: "reply_now",
          },
        ],
      },
      relationshipSummary:
        "やり取りには親しさがありますが、今は互いのペースを確かめている段階です。",
      messageTemperature: null,
      optionalDetails: {},
      fixedLimitation,
    },
  },
  {
    id: "expanded_plan_requested_legacy",
    label: "3日間の流れ",
    summary: "今夜、次の日、3日目という従来の流れを確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p3-runtime-report-v1",
      requestedTopics: ["decide_send_or_wait", "next_three_days"],
      decisionCode: "wait_and_reassess",
      primaryReason:
        "今夜は反応を待ち、時間を区切ってから次の判断をする方が落ち着いて動けます。",
      finalDraft: null,
      immediateAction: {
        action: "今夜は連絡を増やさず、予定どおり過ごす。",
        avoid: ["深夜に追いかける文面を送らない。"],
        secondaryActions: [],
      },
      reassessment: {
        when: "3日目の夕方になった時点で状況を見直す。",
        conditions: [
          {
            condition: "それまでに相手から返事が届いた場合",
            resultingDirection: "reply_now",
          },
        ],
      },
      relationshipSummary: null,
      messageTemperature: null,
      optionalDetails: {
        expandedPlan: [
          {
            phase: "tonight",
            action: "追加で送らず、気持ちを休ませる。",
            avoid: "通知を繰り返し確認すること。",
          },
          {
            phase: "next_day",
            action: "普段の予定を優先して過ごす。",
            avoid: null,
          },
          {
            phase: "day_three",
            action: "返事の有無と会話の流れを見直す。",
            avoid: "不安だけを理由に結論を急ぐこと。",
          },
        ],
        planCommentary: [
          "日ごとの区切りは、待つ時間を無期限に感じないための目安です。",
        ],
      },
      fixedLimitation,
    },
  },
  {
    id: "expanded_plan_requested_split",
    label: "材料に沿った次の流れ",
    summary: "暦日ではなく、次の行動と見直し条件で進む流れを確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p4-split-runtime-report-v1",
      requestedTopics: ["decide_send_or_wait", "next_three_days"],
      decisionCode: "wait_and_reassess",
      primaryReason:
        "次の判断には相手の反応という新しい材料が必要で、日付だけで急ぐ場面ではありません。",
      finalDraft: null,
      immediateAction: {
        action: "今夜は追加で送らず、いったん会話を置く。",
        avoid: ["返事を促す一言を重ねない。"],
        secondaryActions: [],
      },
      reassessment: {
        when: "相手から反応が届くか、予定の確認期限が近づいたときに見直す。",
        conditions: [
          {
            condition: "相手から具体的な質問が届いた場合",
            resultingDirection: "reply_now",
          },
        ],
      },
      relationshipSummary: null,
      messageTemperature: null,
      optionalDetails: {
        expandedPlan: [
          {
            phase: "tonight",
            action: "追加連絡をせず、今ある会話をそのまま置く。",
            avoid: "送信理由を後から足すこと。",
          },
          {
            phase: "next",
            action: "相手の反応または予定の期限を確認する。",
            avoid: null,
          },
          {
            phase: "reassessment_condition",
            action: "新しい材料に合わせて、送るか待つかを選び直す。",
            avoid: "材料がないまま同じ判断を繰り返すこと。",
          },
        ],
        planCommentary: [
          "ここでの次の段階は、必ずしも翌日を意味しません。",
        ],
      },
      fixedLimitation,
    },
  },
  {
    id: "nullable_optional_sections",
    label: "任意情報がない場合",
    summary: "依頼された任意情報が空でも、空見出しを出さない確認用です。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p4-split-runtime-report-v1",
      requestedTopics: ["decide_send_or_wait", "relationship", "message_impact"],
      decisionCode: "wait_and_reassess",
      primaryReason:
        "判断に使える材料が少ないため、今は結論を広げず次の反応を待ちます。",
      finalDraft: null,
      immediateAction: {
        action: "追加の連絡をせず、相手からの反応を待つ。",
        avoid: [],
        secondaryActions: [],
      },
      reassessment: {
        when: "相手から新しい情報が届いたときに見直す。",
        conditions: [],
      },
      relationshipSummary: null,
      messageTemperature: null,
      optionalDetails: {},
      fixedLimitation,
    },
  },
  {
    id: "pause_additional_contact_no_draft",
    label: "追加連絡を止める",
    summary: "文案を作らず、追加の連絡を止める理由を明示します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p4-split-runtime-report-v1",
      requestedTopics: ["decide_send_or_wait", "draft_message"],
      decisionCode: "pause_additional_contact",
      primaryReason:
        "すでに複数回連絡しているため、これ以上送らず相手の境界を尊重する必要があります。",
      finalDraft: null,
      immediateAction: {
        action: "追加のメッセージを送らず、連絡手段を閉じる。",
        avoid: ["別の手段や第三者を使って連絡しない。"],
        secondaryActions: ["必要なら自分の気持ちを送らないメモに書く。"],
      },
      reassessment: {
        when: "相手から自発的な連絡があった場合に限り見直す。",
        conditions: [
          {
            condition: "相手から明確な連絡が届いた場合",
            resultingDirection: "wait_and_reassess",
          },
        ],
      },
      relationshipSummary: null,
      messageTemperature: null,
      optionalDetails: {},
      fixedLimitation,
    },
  },
  {
    id: "kansai_persona_draft",
    label: "改行と絵文字を含む文案",
    summary: "方言、改行、絵文字が表示とコピーで変わらないことを確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-projection-v1",
      sourceReportSchemaVersion: "m2-p4-split-runtime-report-v1",
      requestedTopics: ["draft_message", "decide_send_or_wait"],
      decisionCode: "reply_now",
      primaryReason:
        "普段の話し方で予定を返す方が、二人の自然な距離感を保てます。",
      finalDraft: {
        text: "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊",
        policy: "required_now",
        useTiming: "now",
      },
      immediateAction: {
        action: "日時に間違いがないか確認して、そのまま返信する。",
        avoid: ["口調を急に丁寧語へ置き換えない。"],
        secondaryActions: [],
      },
      reassessment: {
        when: "相手から時間の候補が届いたときに予定を確定する。",
        conditions: [
          {
            condition: "土曜日が難しくなった場合",
            resultingDirection: "wait_and_reassess",
          },
        ],
      },
      relationshipSummary: null,
      messageTemperature: null,
      optionalDetails: {},
      fixedLimitation,
    },
  },
] as const;

export type CustomerAssessmentReviewFixture = {
  id: (typeof fixtureDefinitions)[number]["id"];
  label: string;
  summary: string;
  projection: CustomerAssessmentProjectionV1;
};

export const customerAssessmentReviewFixtures: CustomerAssessmentReviewFixture[] =
  fixtureDefinitions.map(({ id, label, summary, projection }) => ({
    id,
    label,
    summary,
    projection: decodeCustomerAssessmentProjectionV1(projection),
  }));

export function selectCustomerAssessmentReviewFixture(
  fixtureId: string | undefined,
) {
  return (
    customerAssessmentReviewFixtures.find((fixture) => fixture.id === fixtureId) ??
    customerAssessmentReviewFixtures[0]
  );
}
