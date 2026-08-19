import {
  decodeCustomerAssessmentExperienceProjectionV2,
  type CustomerAssessmentExperienceProjectionV2,
} from "../customer-assessment-experience-projection-v2.ts";
import { customerAssessmentExperienceReviewFixtures } from "./m2-p4-v12-customer-experience-projection-fixtures.ts";

export const V1_D_OFFLINE_FIXTURE_PROVENANCE =
  "historical_reference_or_fake_fixture" as const;
export const V1_D_OFFLINE_EVIDENCE_LABEL =
  "V1-D オフライン確認 / 実Provider出力ではありません" as const;

type RequestedTopics =
  CustomerAssessmentExperienceProjectionV2["baseProjection"]["requestedTopics"];

function historicalProjection(
  fixtureId:
    | "ordinary_reply_waiting"
    | "polite_thank_you_with_draft"
    | "kansai_persona_draft",
) {
  const source = customerAssessmentExperienceReviewFixtures.find(
    (fixture) => fixture.id === fixtureId,
  );
  if (source === undefined) {
    throw new Error(`Missing immutable V12 review fixture: ${fixtureId}`);
  }
  return structuredClone(source.projection);
}

type WaitingProjectionInput = {
  requestedTopics: RequestedTopics;
  openingLine: string;
  openingLetter: string[];
  primaryReason: string;
  situationReading: string[];
  possibleInterpretations?: string[];
  materialUnknowns: string[];
  immediateAction: string;
  avoid?: string[];
  secondaryActions?: string[];
  actionRationales: string[];
  reassessmentWhen: string;
  reassessmentCondition: string;
  expandedPlan?: Array<{
    phase: "tonight" | "next_day" | "day_three" | "next" | "reassessment_condition";
    action: string;
    avoid: string | null;
  }>;
  anxietyReframe?: string[];
  closingLines: string[];
  consultationLimitations: string[];
};

function waitingProjection(
  input: WaitingProjectionInput,
): CustomerAssessmentExperienceProjectionV2 {
  const projection = historicalProjection("ordinary_reply_waiting");
  projection.baseProjection.requestedTopics = [...input.requestedTopics];
  projection.baseProjection.primaryReason = input.primaryReason;
  projection.baseProjection.finalDraft = null;
  projection.baseProjection.immediateAction = {
    action: input.immediateAction,
    avoid: [...(input.avoid ?? [])],
    secondaryActions: [...(input.secondaryActions ?? [])],
  };
  projection.baseProjection.reassessment = {
    when: input.reassessmentWhen,
    conditions: [
      {
        condition: input.reassessmentCondition,
        resultingDirection: "reply_now",
      },
    ],
  };
  projection.baseProjection.relationshipSummary = null;
  projection.baseProjection.messageTemperature = null;
  projection.baseProjection.optionalDetails = {
    ...(input.anxietyReframe === undefined
      ? {}
      : { anxietyReframe: [...input.anxietyReframe] }),
    ...(input.expandedPlan === undefined
      ? {}
      : { expandedPlan: structuredClone(input.expandedPlan) }),
  };
  projection.openingLine = input.openingLine;
  projection.openingLetter = [...input.openingLetter];
  projection.situationReading = [...input.situationReading];
  projection.possibleInterpretations = [
    ...(input.possibleInterpretations ?? []),
  ];
  projection.materialUnknowns = [...input.materialUnknowns];
  projection.draftContext = null;
  projection.actionRationales = [...input.actionRationales];
  projection.closingLines = [...input.closingLines];
  projection.consultationLimitations = [
    ...input.consultationLimitations,
  ];
  return decodeCustomerAssessmentExperienceProjectionV2(projection);
}

type DraftProjectionInput = {
  requestedTopics: RequestedTopics;
  openingLine: string;
  openingLetter: string[];
  primaryReason: string;
  situationReading: string[];
  materialUnknowns: string[];
  draftText: string;
  draftContext: string;
  immediateAction: string;
  avoid: string[];
  actionRationales: string[];
  reassessmentWhen: string;
  reassessmentCondition: string;
  messageTemperature: {
    softness: string;
    affection: string;
    pressure: string;
    adjustment: string;
  } | null;
  closingLines: string[];
  consultationLimitations: string[];
};

function draftProjection(
  input: DraftProjectionInput,
): CustomerAssessmentExperienceProjectionV2 {
  const projection = historicalProjection("polite_thank_you_with_draft");
  projection.baseProjection.requestedTopics = [...input.requestedTopics];
  projection.baseProjection.primaryReason = input.primaryReason;
  projection.baseProjection.finalDraft = {
    text: input.draftText,
    policy: "required_now",
    useTiming: "now",
  };
  projection.baseProjection.immediateAction = {
    action: input.immediateAction,
    avoid: [...input.avoid],
    secondaryActions: [],
  };
  projection.baseProjection.reassessment = {
    when: input.reassessmentWhen,
    conditions: [
      {
        condition: input.reassessmentCondition,
        resultingDirection: "reply_now",
      },
    ],
  };
  projection.baseProjection.relationshipSummary = null;
  projection.baseProjection.messageTemperature =
    input.messageTemperature === null
      ? null
      : { ...input.messageTemperature };
  projection.baseProjection.optionalDetails = {};
  projection.openingLine = input.openingLine;
  projection.openingLetter = [...input.openingLetter];
  projection.situationReading = [...input.situationReading];
  projection.possibleInterpretations = [];
  projection.materialUnknowns = [...input.materialUnknowns];
  projection.draftContext = input.draftContext;
  projection.actionRationales = [...input.actionRationales];
  projection.closingLines = [...input.closingLines];
  projection.consultationLimitations = [
    ...input.consultationLimitations,
  ];
  return decodeCustomerAssessmentExperienceProjectionV2(projection);
}

const ordinaryReplyWaiting = waitingProjection({
  requestedTopics: ["decide_send_or_wait", "organize_emotions"],
  openingLine: "今夜の沈黙だけで、関係の結論まで急ぐ必要はありません。",
  openingLetter: [
    "返事がない時間に、距離が離れてしまうのではと不安になる夜なのだと思います。今は、その恐れと確認できている事実を分けて置いてみましょう。",
  ],
  primaryReason:
    "最後の送信から12時間で、普段の返信間隔は半日から1日です。まだ通常の範囲内なので、追加連絡より次の観測可能な変化を待つ方向が現在の材料に合います。",
  situationReading: [
    "最後の送信から12時間が経過しています。",
    "普段は半日から1日ほどで返信があると示されています。",
  ],
  possibleInterpretations: [
    "返信がない理由は、現在の情報だけでは一つに決められません。",
  ],
  materialUnknowns: [
    "返信がまだない理由は分かりません。",
    "次の返信時刻は分かりません。",
  ],
  immediateAction: "明日の夕方までは追加で送らず、届く新しい情報を待つ。",
  avoid: ["沈黙だけを根拠に関係の結論を出さない。"],
  actionRationales: [
    "普段の返信間隔を超えていない今は、追加送信で得られる新しい判断材料が限られています。",
  ],
  reassessmentWhen: "明日の夕方に、普段の返信間隔を超えたか確認する。",
  reassessmentCondition: "相手から具体的な質問が届いた場合",
  anxietyReframe: [
    "現在確認できるのは返信がまだないことまでで、その理由や関係の結論は未確定です。",
  ],
  closingLines: [
    "今夜は、返事の理由も関係の先も、ここで決め切らなくて大丈夫です。",
  ],
  consultationLimitations: [
    "相手の事情や返信時期は、この相談内容だけでは確認できません。",
  ],
});

const administrativeToneConcern = draftProjection({
  requestedTopics: ["draft_message", "message_impact"],
  openingLine: "要件を保ったまま、硬さだけを少し和らげられる場面です。",
  openingLetter: [
    "事務連絡だからこそ、失礼なく返したい一方で、よそよそしく見せたくないという迷いがあるのだと思います。",
  ],
  primaryReason:
    "火曜日14時という確認事項と、普段は丁寧語でやり取りしている事実があります。受領を明確にしつつ一言だけ結びを残す形が、要件とtoneの両方に合います。",
  situationReading: [
    "相手から火曜日14時という具体的な予定が示されています。",
    "普段のやり取りは丁寧語です。",
  ],
  materialUnknowns: [
    "相手が文面をどう受け取るかは事前には確定できません。",
  ],
  draftText:
    "ご連絡ありがとうございます。火曜日14時で承知しました。よろしくお願いいたします。",
  draftContext:
    "日時の受領を中心に保ち、関係を進める含みや追加の質問は足していません。",
  immediateAction: "日時と宛先を確認し、この文面を一度だけ送る。",
  avoid: ["予定確認と無関係な説明を追加しない。"],
  actionRationales: [
    "確認事項が一つなので、受領と丁寧な結びに限定すると相手が処理すべき情報が明確です。",
  ],
  reassessmentWhen: "送信前に日時と宛先を確認する。",
  reassessmentCondition: "予定変更の連絡が届いた場合",
  messageTemperature: {
    softness: "丁寧さを保ち、結びで硬さを少し和らげています。",
    affection: "関係性を推測させる好意表現は追加していません。",
    pressure: "質問や返信要求を加えていないため、応答への圧は限定的です。",
    adjustment: "事務要件を増やさず、受領と結びだけを残しています。",
  },
  closingLines: [
    "この連絡で、関係の温度まで決めようとしなくて大丈夫です。",
  ],
  consultationLimitations: [
    "実際の予定変更や相手の受け止め方は確認できません。",
  ],
});

const replyWaitingWithCadence = waitingProjection({
  requestedTopics: [
    "decide_send_or_wait",
    "next_three_days",
    "organize_emotions",
  ],
  openingLine: "普段の間隔という基準が、今の不安を測り直す助けになります。",
  openingLetter: [
    "返信が遅いと感じるほど、今回だけ違う意味があるのではと怖くなるものです。今回は、普段の間隔と今の経過を同じ物差しで見られます。",
  ],
  primaryReason:
    "最後の送信から10時間で、普段は24時間以内に返信があると示されています。現時点は通常範囲内なので、その範囲を超えるまでは判断を増やさない方向が適合します。",
  situationReading: [
    "最後の送信から10時間が経過しています。",
    "普段の返信は24時間以内と示されています。",
  ],
  possibleInterpretations: [
    "現在の待ち時間だけでは、返信がない理由を特定できません。",
  ],
  materialUnknowns: ["返信が届く時刻と内容は分かりません。"],
  immediateAction: "送信から24時間までは追加連絡をせず、時間だけを記録する。",
  avoid: ["通知確認のたびに関係の意味を更新しない。"],
  actionRationales: [
    "普段の範囲を観測基準にすると、不安の強さではなく確認可能な変化で見直せます。",
  ],
  reassessmentWhen: "送信から24時間を超えた時点で、次の対応を見直す。",
  reassessmentCondition: "相手から返信または質問が届いた場合",
  expandedPlan: [
    { phase: "tonight", action: "経過時間だけを一度確認する。", avoid: "追加メッセージを送らない。" },
    { phase: "next_day", action: "24時間を超えたか確認する。", avoid: null },
    { phase: "reassessment_condition", action: "新しい返信内容を判断材料にする。", avoid: null },
  ],
  anxietyReframe: [
    "不安は強くても、現在の経過はまだ普段の返信範囲内です。",
  ],
  closingLines: [
    "今夜は、今回だけ特別な意味があるのかまで解かなくて大丈夫です。",
  ],
  consultationLimitations: [
    "相手の事情や今後の返信は、この相談から断定できません。",
  ],
});

const draftWithRelationshipIntent = draftProjection({
  requestedTopics: ["draft_message", "message_impact"],
  openingLine: "感謝を残しながら、次の会話を急がせない文面にできます。",
  openingLetter: [
    "距離を近づけたい気持ちは伝えたいけれど、相手に次の約束を迫る形にはしたくないのだと思います。",
  ],
  primaryReason:
    "昨日話せた事実と、また話したい意図が示されています。感謝と希望を分けて短く置くことで、意図を隠さず返答要求は増やさない形になります。",
  situationReading: [
    "昨日、相手と話す時間がありました。",
    "ユーザーは、また話したいが急かしたくないと示しています。",
  ],
  materialUnknowns: [
    "相手が次に話せる時期と、文面への反応は分かりません。",
  ],
  draftText:
    "昨日はありがとう。話せてうれしかった。また都合が合うときに話せたらうれしいです。",
  draftContext:
    "感謝、うれしかった事実、次の希望だけを残し、日時指定や返信要求は加えていません。",
  immediateAction: "普段の口調と宛先を確認して、この文面を一度送る。",
  avoid: ["具体的な次回日時を同時に迫らない。"],
  actionRationales: [
    "次の会話への希望は示しつつ、相手が今すぐ予定を決める必要のない文面だからです。",
  ],
  reassessmentWhen: "相手から返事や予定の提案が届いた時点で見直す。",
  reassessmentCondition: "相手から具体的な日程候補が届いた場合",
  messageTemperature: {
    softness: "感謝から始め、希望を条件付きの表現にしています。",
    affection: "会話できた喜びは示しますが、関係の断定はしていません。",
    pressure: "日時指定や返信期限がないため、即答への圧は抑えています。",
    adjustment: "次の希望を残しつつ、具体的な要求を意図的に足していません。",
  },
  closingLines: [
    "この一通で、次の関係の形まで決めてもらう必要はありません。",
  ],
  consultationLimitations: [
    "相手の受け止め方や次の予定は事前に確定できません。",
  ],
});

const politeThankYou = decodeCustomerAssessmentExperienceProjectionV2(
  historicalProjection("polite_thank_you_with_draft"),
);
const kansaiPersona = decodeCustomerAssessmentExperienceProjectionV2(
  historicalProjection("kansai_persona_draft"),
);

const tradeoffApplicable = waitingProjection({
  requestedTopics: ["decide_send_or_wait", "next_three_days"],
  openingLine: "待つ基準と確認する期限を分けると、二つの選択を比べられます。",
  openingLetter: [
    "何もしないまま機会を逃すことと、連絡を重ねてしまうことの両方が気になっているのだと思います。",
  ],
  primaryReason:
    "送信から18時間で、普段は24時間以内に返信があり、明日夕方には予定確認の期限があります。今は通常範囲内ですが、期限後には一度の確認が新しい実務情報を得る手段になります。",
  situationReading: [
    "最後の送信から18時間が経過しています。",
    "普段の返信は24時間以内で、予定確認の期限は明日夕方です。",
  ],
  possibleInterpretations: [
    "返信がない理由は、現在の事実だけでは特定できません。",
  ],
  materialUnknowns: ["相手が予定を確認済みかは分かりません。"],
  immediateAction: "24時間までは待ち、期限を超えたら予定確認を一度だけ検討する。",
  avoid: ["期限前に複数回の確認を送らない。"],
  actionRationales: [
    "今待つ利益は普段の返信範囲を尊重できること、コストは期限まで確認情報が増えないことです。期限後に一度確認する利益は予定情報を得られること、リスクは連絡回数が増えることです。",
  ],
  reassessmentWhen: "送信から24時間または明日夕方の早い方で見直す。",
  reassessmentCondition: "相手から予定に関する返信が届いた場合",
  expandedPlan: [
    { phase: "tonight", action: "普段の返信範囲内は待つ。", avoid: "追送しない。" },
    { phase: "next_day", action: "期限と返信有無を確認する。", avoid: null },
    { phase: "reassessment_condition", action: "期限後のみ一度の確認を検討する。", avoid: "連続送信しない。" },
  ],
  closingLines: [
    "今夜のうちに、待つか諦めるかの二択まで決める必要はありません。",
  ],
  consultationLimitations: [
    "相手の返信理由や確認状況は、この相談だけでは分かりません。",
  ],
});

const tradeoffNotApplicable = waitingProjection({
  requestedTopics: ["decide_send_or_wait", "organize_emotions"],
  openingLine: "今は比較案を増やすより、同じ観測基準を保つ方が整理できます。",
  openingLetter: [
    "別の動き方も探さなければと感じているかもしれませんが、現時点には比較すべき期限や新しい事実がありません。",
  ],
  primaryReason:
    "送信から8時間で、普段の返信は24時間以内です。期限や新しい出来事がないため、別行動を作るより通常範囲を超えたかで見直す方向が現在の材料に合います。",
  situationReading: [
    "最後の送信から8時間が経過しています。",
    "普段の返信は24時間以内で、現在の期限は示されていません。",
  ],
  possibleInterpretations: [
    "返信がない理由は、現在の情報からは分かりません。",
  ],
  materialUnknowns: ["次の返信時刻は分かりません。"],
  immediateAction: "送信から24時間までは追加で送らず、経過だけを見る。",
  avoid: ["比較のためだけに新しい連絡案を作らない。"],
  actionRationales: [
    "期限も新しい材料もない今は、普段の返信範囲を超えたかが次に使える観測基準です。",
  ],
  reassessmentWhen: "送信から24時間を超えたら見直す。",
  reassessmentCondition: "相手から返信が届いた場合",
  closingLines: [
    "今夜は、まだ存在しない別案まで用意しなくて大丈夫です。",
  ],
  consultationLimitations: [
    "相手の事情や返信時期は確認できません。",
  ],
});

const clarificationReady = waitingProjection({
  requestedTopics: ["decide_send_or_wait", "organize_emotions"],
  openingLine: "最後の送信時刻が分かり、待ち時間を普段の基準で見直せます。",
  openingLetter: [
    "いつから待っているか分からない状態では不安だけが大きくなりやすいものです。今は、回答で得た時刻を判断の基準にできます。",
  ],
  primaryReason:
    "回答により最後の送信が昨夜22時と確認され、普段の返信は24時間以内です。まだ通常範囲内なので、その範囲を超えるまでは追加判断を増やさない方向が適合します。",
  situationReading: [
    "確認回答では、最後に送信したのは昨夜22時です。",
    "普段の返信は24時間以内と示されています。",
  ],
  possibleInterpretations: [
    "現在の待ち時間から返信理由までは特定できません。",
  ],
  materialUnknowns: ["返信が届く時刻と内容は分かりません。"],
  immediateAction: "昨夜22時から24時間までは追加で送らず待つ。",
  avoid: ["一度の確認回答の後に、別の質問を追加しない。"],
  actionRationales: [
    "不足していた時刻が埋まったため、不安ではなく経過時間で次の見直しを決められます。",
  ],
  reassessmentWhen: "昨夜22時から24時間を超えた時点で見直す。",
  reassessmentCondition: "相手から返信が届いた場合",
  anxietyReframe: [
    "最後の送信時刻は確認できましたが、返信理由はまだ分からないままです。",
  ],
  closingLines: [
    "今夜は、確認できた時刻より先の意味まで決めなくて大丈夫です。",
  ],
  consultationLimitations: [
    "確認回答は待ち時間を補いますが、相手の事情は示しません。",
  ],
});

const consultationSpecificClosing = waitingProjection({
  requestedTopics: ["decide_send_or_wait", "organize_emotions"],
  openingLine: "返信の遅さと、関係が終わる怖さは分けて扱えます。",
  openingLetter: [
    "返事が遅いことから、関係そのものが終わるのではと考えてしまう苦しさを受け取っています。",
  ],
  primaryReason:
    "送信から6時間で、普段は当日から翌日に返信があると示されています。今はその範囲内なので、沈黙を関係終了の事実として扱わず観測可能な変化を待つ方向が合います。",
  situationReading: [
    "最後の送信から6時間が経過しています。",
    "普段は当日から翌日に返信があります。",
  ],
  possibleInterpretations: [
    "返信がない理由は、今の情報だけでは分かりません。",
  ],
  materialUnknowns: ["次の返信と関係の今後は確定していません。"],
  immediateAction: "翌日までは追加で送らず、次の事実を待つ。",
  avoid: ["沈黙を関係終了の確定事実にしない。"],
  actionRationales: [
    "現在は普段の返信範囲内で、追加送信によって増える判断材料が限られています。",
  ],
  reassessmentWhen: "普段の返信範囲を超えたら見直す。",
  reassessmentCondition: "相手から返信が届いた場合",
  anxietyReframe: [
    "確認できるのは返信がまだないことまでで、関係終了の事実は示されていません。",
  ],
  closingLines: [
    "今夜は、この沈黙が関係の終わりを意味するのかまで解かなくて大丈夫です。",
  ],
  consultationLimitations: [
    "相手の事情や関係の今後は、この相談だけでは断定できません。",
  ],
});

const fixtureDefinitions = [
  {
    id: "ordinary_reply_waiting",
    label: "返事を待つ夜",
    summary: "timing・普段の返信間隔・中心的な恐れをそろえた待機ケースです。",
    sourceKind: "adapted_historical_reference",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: ordinaryReplyWaiting,
  },
  {
    id: "administrative_reply_with_tone_concern_ready_candidate",
    label: "tone懸念がある事務返信",
    summary: "Candidate、関係意図、普段の丁寧語がそろったmessage-impactケースです。",
    sourceKind: "new_fake_fixture",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: administrativeToneConcern,
  },
  {
    id: "reply_waiting_with_usual_cadence",
    label: "普段の返信間隔が分かる待機",
    summary: "普段の返信間隔を観測可能な見直し基準にするケースです。",
    sourceKind: "new_fake_fixture",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: replyWaitingWithCadence,
  },
  {
    id: "draft_request_with_relationship_intent",
    label: "関係意図が明確な文案",
    summary: "距離を縮めたい意図と圧を増やしたくない条件を両立するfixtureです。",
    sourceKind: "new_fake_fixture",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: draftWithRelationshipIntent,
  },
  {
    id: "polite_thank_you_with_draft",
    label: "丁寧なお礼の文面",
    summary: "既存の丁寧な文案をbyte-exactで確認するhistorical referenceです。",
    sourceKind: "adapted_historical_reference",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: politeThankYou,
  },
  {
    id: "kansai_persona_draft",
    label: "関西弁・改行・絵文字の文案",
    summary: "方言、改行、絵文字のexact preservationを確認するhistorical referenceです。",
    sourceKind: "adapted_historical_reference",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: kansaiPersona,
  },
  {
    id: "alternative_tradeoff_applicable",
    label: "比較する価値がある代替案",
    summary: "待つ利益・コストと、期限後に一度確認する利益・リスクを比較します。",
    sourceKind: "new_fake_fixture",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "included_grounded",
    projection: tradeoffApplicable,
  },
  {
    id: "alternative_tradeoff_not_applicable",
    label: "代替案を作らないケース",
    summary: "実質的な比較対象がないため、tradeoffを水増ししないfixtureです。",
    sourceKind: "new_fake_fixture",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "omitted_not_applicable",
    projection: tradeoffNotApplicable,
  },
  {
    id: "one_clarification_answer_becomes_ready",
    label: "一回答でReadyになるケース",
    summary: "不足していた最後の送信時刻だけを一回答で補った後のreview referenceです。",
    sourceKind: "new_fake_fixture",
    routeExpectation:
      "needs_one_clarifying_answer_then_full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: clarificationReady,
  },
  {
    id: "consultation_specific_non_propositional_closing_positive",
    label: "相談固有の非命題的な結び",
    summary: "新事実を足さず、今夜解かなくてよい恐れを固有に示すpositive fixtureです。",
    sourceKind: "new_fake_fixture",
    routeExpectation: "full_paid_ready_candidate",
    tradeoffDisposition: "not_applicable",
    projection: consultationSpecificClosing,
  },
] as const;

export type V1DProductReviewFixture = {
  id: (typeof fixtureDefinitions)[number]["id"];
  label: string;
  summary: string;
  provenance: typeof V1_D_OFFLINE_FIXTURE_PROVENANCE;
  evidenceStatus: "offline_reference_not_actual_v15_successor_output";
  sourceKind: "adapted_historical_reference" | "new_fake_fixture";
  routeExpectation: string;
  tradeoffDisposition:
    | "included_grounded"
    | "omitted_not_applicable"
    | "not_applicable";
  projection: CustomerAssessmentExperienceProjectionV2;
};

export const v1DProductReviewFixtures: V1DProductReviewFixture[] =
  fixtureDefinitions.map((fixture) => ({
    ...fixture,
    provenance: V1_D_OFFLINE_FIXTURE_PROVENANCE,
    evidenceStatus: "offline_reference_not_actual_v15_successor_output",
    projection: decodeCustomerAssessmentExperienceProjectionV2(
      fixture.projection,
    ),
  }));

export const v1DExcludedHistoricalPaidProductFixtures = [
  {
    fixtureId: "simple_business_reply_with_draft",
    currentRoute: "needs_one_clarifying_answer",
    paidProductReviewEligible: false,
    reason: "material_relationship_or_communication_concern_missing",
  },
  {
    fixtureId: "nullable_optional_sections",
    currentRoute: "not_full_product_candidate",
    paidProductReviewEligible: false,
    reason: "message_impact_candidate_and_current_product_scope_missing",
  },
] as const;

export function selectV1DProductReviewFixture(fixtureId: string | undefined) {
  return (
    v1DProductReviewFixtures.find((fixture) => fixture.id === fixtureId) ??
    v1DProductReviewFixtures[0]
  );
}
