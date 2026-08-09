import type {
  ClarificationCodeV1,
  ContactBoundaryStateV1,
  PrepaymentSafetyClassificationDecisionV1,
  PrepaymentSafetyInputV1,
  PrepaymentSafetyOutputKindV1,
  PrepaymentSafetyReasonCodeV1,
} from "./prepayment-safety-types-v1.ts";

const DIRECT_CURRENT_SAFETY_PHRASES = [
  /(?:死にたい|消えたい|生きていたくない|自殺したい|自分を傷つけたい|(?:相手|人|誰か)を(?:殺したい|傷つけたい))/u,
  /(?:殴られている|蹴られている|首を絞められている|暴力を(?:受けている|振るわれている)|殺されそう|襲われている|監禁されている|脅されている)/u,
  /(?:今|現在|いま|今夜|直ちに|すぐ|これから).{0,24}(?:死にたい|消えたい|生きていたくない|自殺(?:したい|する|しよう)|自分を傷つけ(?:たい|る)|相手を(?:殺す|傷つける|殴る)|人を(?:殺す|傷つける)|暴力を(?:受けている|振るわれている)|殺されそう|襲われている|監禁されている|脅されている|危険(?:です|だ|がある))/u,
  /(?:死にたい|消えたい|生きていたくない|自殺(?:したい|する|しよう)|自分を傷つけ(?:たい|る)|相手を(?:殺す|傷つける)|殺されそう|襲われている).{0,16}(?:今|現在|いま|すぐ|これから)/u,
  /(?:currently|right now|immediately|about to).{0,30}(?:suicidal|kill myself|harm myself|hurt someone|kill someone|being attacked|in immediate danger)/iu,
  /(?:kill myself|harm myself|hurt someone|kill someone).{0,20}(?:now|tonight|immediately)/iu,
] as const;

const SAFETY_CONTEXT_PHRASES = [
  /(?:死にたい|消えたい|生きていたくない|自傷|自殺|暴力|DV|家庭内暴力|虐待|監禁|殺害予告|命の危険)/iu,
  /(?:self-harm|suicid|violence|domestic abuse|immediate danger)/iu,
] as const;

const HISTORICAL_OR_NONCURRENT_CONTEXT_PHRASES = [
  /(?:以前|過去|昔|かつて|昨年|去年|当時|先月|先週)(?:は|に|の|から|も)?/u,
  /(?:^|その|この|[、,\s])前は/u,
  /(?:死にたい|消えたい|生きていたくない|自殺したい)(?:と)?(?:思って|感じて)(?:いました|いた|いたことがある)/u,
  /(?:したい|やりたい|しよう)(?:と)?(?:思って|考えて|感じて)(?:いました|いた|いたことがある)/u,
  /(?:もう終わった|現在は安全|今は安全|もう安全|危険はない|現在危険ではない)/u,
  /(?:previously|in the past|last year|not current|safe now)/iu,
] as const;

const CURRENT_TEMPORAL_CONTEXT_PHRASES = [
  /(?:今|現在|いま(?!した|せん|す)|今夜|直ちに|すぐ|これから)(?:は|も|に)?/u,
  /(?:currently|right now|immediately|now|tonight|about to)/iu,
] as const;

const CURRENT_UNSAFE_EXECUTION_INTENT_PHRASES = [
  /(?:今|現在|いま|これから)(?:は|も)?[^。！？!?\n]{0,40}(?:やりたい|実行したい|続けたい|使いたい|連絡したい|監視したい|追跡したい|尾行したい|待ち伏せしたい|特定したい|調べたい|送りたい|方法を知りたい)/u,
  /(?:また|再び|もう一度)[^。！？!?\n]{0,32}(?:やりたい|実行したい|続けたい|使いたい|連絡したい|監視したい|追跡したい|尾行したい|待ち伏せしたい|特定したい|調べたい|送りたい)/u,
  /(?:want to do it now|do it again|still want to do it)/iu,
] as const;

const AMBIGUOUS_TEMPORAL_OWNERSHIP_PHRASES = [
  /(?:以前|過去|昔)(?:の話|のこと)?か[、,]?\s*(?:今|現在)(?:の話|のこと)?か(?:分からない|わからない|分かりません|わかりません|不明)/u,
  /(?:今|現在)(?:の話|のこと)?か[、,]?\s*(?:以前|過去|昔)(?:の話|のこと)?か(?:分からない|わからない|分かりません|わかりません|不明)/u,
  /(?:historical|past) or current|current or (?:historical|past)/iu,
] as const;

const CURRENT_SAFETY_DENIAL_PHRASES = [
  /(?:死にたい|消えたい|生きていたくない|自殺したい)(?:わけ|の)?(?:では|じゃ)(?:ありません|ない|なく)/u,
  /(?:死にたい|消えたい|生きていたくない|自殺したい)(?:と|とは)?(?:思って|考えて)(?:いません|いない)/u,
  /(?:自分を傷つけたい|相手を(?:殺したい|傷つけたい)|人を(?:殺したい|傷つけたい))(?:わけ|の)?(?:では|じゃ)(?:ありません|ない|なく)/u,
  /(?:自分を傷つける|相手を(?:殺す|傷つける)|人を(?:殺す|傷つける))(?:つもり|意図)(?:は)?(?:ありません|ない)/u,
  /(?:自分を傷つけたい|相手を(?:殺したい|傷つけたい)|人を(?:殺したい|傷つけたい))(?:と|とは)?(?:思って)?(?:いません|いない)/u,
  /(?:殴られている|蹴られている|首を絞められている|殺されそう|襲われている)(?:わけ|の)?(?:では|じゃ)(?:ありません|ない|なく)/u,
  /(?:not suicidal|do not want to (?:die|harm myself|hurt|kill)|not being attacked)/iu,
] as const;

const LOCAL_STOPPING_OR_AVOIDING_PHRASES = [
  /(?:したい|連絡したい)(?:わけ|の)?(?:では|じゃ)(?:ありません|ない|なく)/u,
  /(?:する|連絡する)(?:つもり|意図)(?:は)?(?:ありません|ない)/u,
  /(?:やめたい|やめます|しません|しないように|避けたい|防ぎたい|繰り返さない|距離を置きたい|尊重したい|巻き込まない|手放したい|止めたい)/u,
  /(?:help me stop|want to stop|will not|avoid doing|respect (?:the )?boundary|do not want to|won't contact)/iu,
] as const;

const AMBIGUOUS_UNSAFE_OWNERSHIP_PHRASES = [
  /(?:したい|する|使う|調べる|特定する|監視する|連絡する)か[、,]?\s*(?:しない|やめる|避ける)か/u,
  /(?:実行|連絡|監視|追跡|特定)(?:する)?(?:意図|つもり)?(?:が)?(?:ある|ない)のか(?:、|,)?\s*(?:ない|ある)のか/u,
] as const;

const TEMPORARY_PAUSE_SOURCE_PHRASES = [
  /(?:考える|整理する)(?:ための)?時間(?:が|を)?(?:ほしい|欲しい|ください)/u,
  /(?:今は|しばらく)?一人にして(?:ほしい|欲しい|ください)/u,
  /落ち着いたら(?:こちら|私|自分)?から連絡(?:する|します)/u,
] as const;

const EXPLICIT_NO_CONTACT_SOURCE_PHRASES = [
  /(?:もう|これ以上|今後)?(?:は)?連絡(?:を)?(?:しないで|してこないで|しないでほしい|しないでください|やめて)/u,
] as const;

const CHANNEL_RESTRICTED_SOURCE_PHRASES = [
  /(?:ブロック|着信拒否)(?:を)?(?:されている|されています|された|されました|されたまま)/u,
] as const;

const REPORTED_RELATIONSHIP_CLOSED_PHRASES = [
  /相手(?:から|に).{0,24}(?:別れたい|関係を終えたい|関係を終わらせたい|関係を終わりにしたい).{0,16}(?:と言われ|と伝えられ|と言って)/u,
] as const;

const DIRECT_RELATIONSHIP_CLOSED_PHRASES = [
  /(?:別れたい|関係を終えたい|関係を終わらせたい|この関係を終わりにしたい|もう付き合えない)/u,
] as const;

const MATERIAL_PRIVATE_EXPANSION_PHRASES = [
  /(?:今度|今週末|来週|いつか|仕事のあと|業務のあと).{0,20}(?:二人|2人|二人きり|プライベート|個人的)?に?.{0,12}(?:ご飯|食事|飲み|デート|遊び|映画|カフェ|水族館|ドライブ|散歩|買い物).{0,12}(?:行かない|行きませんか|行こう|したい|どう)/u,
  /(?:今度|今週末|来週|いつか|仕事のあと|業務のあと).{0,24}(?:会わない|会いませんか|会おう|会いたい|出かけない|出かけませんか|出かけよう)/u,
  /(?:二人|2人)(?:きり|で).{0,16}(?:ご飯|食事|飲み|デート|遊び|映画|カフェ|水族館|ドライブ|散歩|買い物).{0,12}(?:行かない|行きませんか|行こう|したい|どう)/u,
  /(?:個人的に|プライベートで|二人きりで).{0,16}(?:会いたい|会いませんか|会おう|話したい)/u,
  /(?:デート|食事|飲み).{0,10}(?:しませんか|行かない|行きませんか|行こう|誘いたい)/u,
  /(?:復縁したい|やり直したい|関係を戻したい|もう一度付き合いたい|復縁の話|やり直す提案)/u,
  /(?:好きです|愛しています|愛してる).{0,16}(?:付き合って|恋人|会いたい)/u,
  /付き合って(?:ください|ほしい)/u,
  /(?:好きだと|愛していると|付き合ってほしいと|付き合いたいと).{0,12}(?:伝えたい|送りたい|言いたい)/u,
] as const;

const SCOPED_REPLY_SOURCE_INVITATION_PHRASES = [
  /(?:教えて|知らせて|返信して|返事(?:して|ください|ほしい)|確認(?:して|お願いします))/u,
  /(?:何時|いつ|どこ|どちら|どう)(?:ですか|かな|でしょう|[？?])/u,
  /(?:大丈夫|可能)(?:ですか|でしょうか|[？?])/u,
] as const;

const NARROW_SCOPED_REPLY_PHRASES = [
  /(?:ありがとう|ありがとうございます|承知しました|了解|確認しました|わかりました|お願いします)/u,
  /(?:\d{1,2}(?:時|:\d{2})|午前|午後).{0,12}(?:どう|いかが|大丈夫|お願いします|可能)/u,
  /(?:月曜|火曜|水曜|木曜|金曜|土曜|日曜|今日|明日|明後日).{0,12}(?:大丈夫|可能|どう|いかが|お願いします)/u,
] as const;

const EXPLICIT_UNSAFE_ASSISTANCE_PHRASES = [
  /(?:別|他)(?:の)?アカウント.{0,28}(?:連絡する文面を作りたい|連絡したい|連絡する方法|メッセージを送りたい|送る方法)/u,
  /(?:別SNS|別のSNS|別番号|違う番号).{0,24}(?:連絡したい|連絡する方法|電話したい|送る方法)/iu,
  /(?:ブロック|着信拒否|連絡制限).{0,24}(?:回避|突破|すり抜け).{0,16}(?:連絡|送信|電話)/u,
  /(?:友達|友人|知人|同僚|第三者).{0,28}(?:相手に伝えてもらう方法|連絡してもらう方法|連絡させたい|仲介させたい)/u,
  /(?:相手の)?(?:居場所|住所|現在地|位置情報|電話番号).{0,24}(?:特定したい|調べたい|突き止めたい|入手したい|探し出したい)/u,
  /待ち伏せ.{0,20}(?:場所を考えたい|場所を選びたい|する方法|したい)/u,
  /(?:監視|追跡|尾行).{0,20}(?:したい|する方法|続けたい|手伝って)/u,
  /(?:非公開|秘密の).{0,16}(?:住所|電話番号|個人情報|勤務先).{0,20}(?:調べたい|入手したい|公開したい|晒したい)/u,
  /(?:なりすまし|なりすまして|偽アカウント).{0,24}(?:連絡したい|返信させたい|だましたい|送信したい)/u,
  /(?:脅して|脅迫して|弱みを握って|秘密をばらすと脅して).{0,24}(?:返信させたい|連絡させたい|従わせたい|言うことを聞かせたい)/u,
  /(?:復讐|嫌がらせ|晒し|恥をかかせ).{0,20}(?:したい|する方法|手伝って|計画)/u,
  /(?:相手の)?(?:家|自宅|職場|勤務先|学校).{0,28}(?:押しかけたい|無断で行きたい|待ち伏せしたい|会いに行く方法)/u,
  /(?:業務|荷物|返金|金銭|仕事).{0,28}(?:口実|理由にして|ふりをして).{0,28}(?:私的|恋愛|復縁|会いたい|連絡)/u,
  /(?:不法侵入|住居侵入).{0,20}(?:したい|する方法|手伝って|計画)/u,
  /(?:パスワード|認証コード).{0,24}(?:盗む|突破する|回避する).{0,20}(?:ログイン|アクセス)/u,
  /(?:アカウント|端末).{0,20}(?:無断で|勝手に).{0,20}(?:ログイン|アクセス)(?:したい|する方法)/u,
  /(?:友達|友人|知人|第三者).{0,20}(?:秘密|弱み|非公開情報).{0,24}(?:使って|利用して).{0,20}(?:説得|連絡|脅迫|操り)/u,
  /(?:未成年|18歳未満|中学生|高校生).{0,32}(?:恋愛|付き合いたい|性的|セックス|会いたい|会う方法|ホテル|二人きり)/u,
  /(?:恋愛|性的|セックス|会いたい|会う方法|ホテル|二人きり).{0,32}(?:未成年|18歳未満|中学生|高校生)/u,
  /(?:alternate account|another account|different number).{0,30}(?:contact|message|call).{0,20}(?:want|how|draft)/iu,
  /(?:track|surveil|locate|dox|impersonate|blackmail|harass).{0,30}(?:them|the person|my ex|how|want)/iu,
] as const;

const AMBIGUOUS_UNSAFE_EXECUTION_PHRASES = [
  /(?:別|他)(?:の)?アカウント.{0,24}(?:連絡|メッセージ|返信)/u,
  /(?:別SNS|別のSNS|別番号|違う番号).{0,20}(?:連絡|送信|電話)/iu,
  /(?:友達|友人|知人|同僚|第三者).{0,24}(?:伝える|連絡|仲介)/u,
  /(?:居場所|住所|現在地|位置情報|電話番号).{0,20}(?:特定|調べる|探す|入手)/u,
  /(?:待ち伏せ|監視|追跡|尾行)/u,
  /(?:なりすまし|偽アカウント).{0,20}(?:連絡|返信|送信)/u,
  /(?:脅迫|脅して|弱み|秘密をばらす).{0,24}(?:返信|連絡|従う|反応)/u,
  /(?:ログイン|アクセス).{0,20}(?:相手の|他人の|無断|パスワード)/u,
  /(?:alternate account|third party|track|surveil|locate|dox|impersonate|blackmail)/iu,
] as const;

const EXPLICIT_PROFESSIONAL_REQUEST_PHRASES = [
  /(?:法律|法的|弁護士|医療|臨床|診断|治療|契約|債務|借金|金融|税務).{0,30}(?:判断して|結論を出して|診断して|治療法を決めて|助言して|文書を作って|契約書を作って|戦略を考えて)/u,
  /(?:違法か|犯罪か|訴えられるか|病気か|障害か|契約が有効か).{0,20}(?:判断|断定|診断|教えて)/u,
  /(?:legal|medical|clinical|contractual|financial).{0,30}(?:judgment|diagnosis|treatment|advice|document|strategy)/iu,
] as const;

const OUTPUT_POLICIES: Readonly<
  Record<
    PrepaymentSafetyClassificationDecisionV1["classification"],
    Readonly<{
      allowed: readonly PrepaymentSafetyOutputKindV1[];
      forbidden: readonly PrepaymentSafetyOutputKindV1[];
    }>
  >
> = Object.freeze({
  eligible_general: {
    allowed: [
      "individualized_assessment_note",
      "decision_direction",
      "message_draft_when_supported",
      "immediate_self_directed_action",
      "observable_reassessment_condition",
      "calm_closure",
    ],
    forbidden: [
      "unsafe_method",
      "workaround",
      "optimization_advice",
      "professional_advice",
      "professional_document",
      "hidden_state_certainty",
      "reconciliation_guarantee",
    ],
  },
  eligible_pause_assessment: {
    allowed: [
      "full_no_draft_assessment",
      "decision_direction",
      "immediate_self_directed_action",
      "observable_reassessment_condition",
      "calm_closure",
    ],
    forbidden: [
      "draft",
      "recontact_plan",
      "time_only_contact_plan",
      "alternate_channel_contact",
      "third_party_contact",
      "unsafe_method",
      "workaround",
      "hidden_state_certainty",
      "reconciliation_guarantee",
    ],
  },
  eligible_boundary_support_only: {
    allowed: [
      "boundary_respecting_assessment_note",
      "decision_direction",
      "immediate_self_directed_action",
      "calm_closure",
    ],
    forbidden: [
      "draft",
      "recontact_plan",
      "time_only_contact_plan",
      "alternate_channel_contact",
      "third_party_contact",
      "unsafe_method",
      "workaround",
      "hidden_state_certainty",
      "reconciliation_guarantee",
    ],
  },
  eligible_scoped_reply: {
    allowed: [
      "individualized_assessment_note",
      "decision_direction",
      "scoped_reply_draft",
      "immediate_self_directed_action",
    ],
    forbidden: [
      "recontact_plan",
      "alternate_channel_contact",
      "third_party_contact",
      "unsafe_method",
      "workaround",
      "private_or_romantic_content",
      "hidden_state_certainty",
      "reconciliation_guarantee",
    ],
  },
  eligible_business_only: {
    allowed: [
      "individualized_assessment_note",
      "decision_direction",
      "business_only_draft",
      "immediate_self_directed_action",
    ],
    forbidden: [
      "recontact_plan",
      "alternate_channel_contact",
      "third_party_contact",
      "unsafe_method",
      "workaround",
      "private_or_romantic_content",
      "hidden_state_certainty",
      "reconciliation_guarantee",
    ],
  },
  needs_clarification: {
    allowed: [
      "bounded_structured_clarification",
      "payment_not_charged_statement",
    ],
    forbidden: [
      "draft",
      "report",
      "customer_projection",
      "provider_generated_assessment",
      "professional_advice",
      "unsafe_method",
      "workaround",
    ],
  },
  blocked_unsafe_assistance: {
    allowed: [
      "static_refusal_copy",
      "brief_boundary_respecting_redirection",
      "payment_not_charged_statement",
    ],
    forbidden: [
      "draft",
      "report",
      "customer_projection",
      "provider_generated_assessment",
      "unsafe_method",
      "workaround",
      "optimization_advice",
    ],
  },
  urgent_safety_redirect: {
    allowed: [
      "static_urgent_copy",
      "general_safety_resource_guidance",
      "payment_not_charged_statement",
    ],
    forbidden: [
      "relationship_strategy",
      "draft",
      "report",
      "customer_projection",
      "provider_generated_assessment",
    ],
  },
  unsupported_professional_request: {
    allowed: [
      "static_scope_explanation",
      "nonprofessional_scope_clarification_option",
      "payment_not_charged_statement",
    ],
    forbidden: [
      "professional_advice",
      "professional_document",
      "report",
      "customer_projection",
      "provider_generated_assessment",
    ],
  },
});

type MaterialBoundaryHintV1 =
  | "temporary_pause"
  | "explicit_no_contact"
  | "channel_restricted"
  | "relationship_closed";

type ContentInspectionV1 = Readonly<{
  explicitUrgentSafety: boolean;
  unresolvedSafetyContext: boolean;
  explicitUnsafeAssistance: boolean;
  ambiguousUnsafeExecution: boolean;
  stoppingOrAvoidingContext: boolean;
  explicitProfessionalRequest: boolean;
  sourceBoundaryHints: readonly MaterialBoundaryHintV1[];
  latestInboundBoundaryHints: readonly MaterialBoundaryHintV1[];
  materialPrivateExpansion: boolean;
  scopedReplySourceInvitation: boolean;
  narrowScopedReplyEvidence: boolean;
}>;

function matchesAny(text: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeForInspection(value: string) {
  return value.normalize("NFKC").replace(/\r\n?/gu, "\n").toLocaleLowerCase("ja");
}

type LocalMatchSpan = Readonly<{
  start: number;
  end: number;
}>;

const LOCAL_PROPOSITION_BOUNDARY = "\u0000";
const INDEPENDENT_PREDICATE_ENDING =
  /(?:です|でした|ます|ました|ています|ていました|ません|ませんでした|ない|なかった|なく|たい|たかった|いる|いた|ある|あった|する|した|しよう|安全|危険|safe|unsafe|stop|stopped|will not|do not)$/iu;
const COMMA_CONTINUATION_PREFIX =
  /^(?:という|っていう|といった|わけ|つもり|意図|の)(?:こと|意味|では|じゃ|は|が|を|も)/u;
const COORDINATED_RISK_NOUN_BRIDGE =
  /^(?:[、,]\s*(?:待ち伏せ|監視|追跡|尾行))*\s*(?:は|を|も|について)?$/u;

function findLocalMatchSpans(
  text: string,
  patterns: readonly RegExp[],
): readonly LocalMatchSpan[] {
  const spans = new Map<string, LocalMatchSpan>();
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    for (const match of text.matchAll(new RegExp(pattern.source, flags))) {
      if (match.index === undefined || match[0].length === 0) continue;
      const span = Object.freeze({
        start: match.index,
        end: match.index + match[0].length,
      });
      spans.set(`${span.start}:${span.end}`, span);
    }
  }
  return Object.freeze(
    [...spans.values()].sort(
      (left, right) => left.start - right.start || left.end - right.end,
    ),
  );
}

function spansOverlap(left: LocalMatchSpan, right: LocalMatchSpan) {
  return left.start < right.end && right.start < left.end;
}

function mergeOverlappingSpans(
  spans: readonly LocalMatchSpan[],
): readonly LocalMatchSpan[] {
  const merged: LocalMatchSpan[] = [];
  for (const span of [...spans].sort(
    (left, right) => left.start - right.start || left.end - right.end,
  )) {
    const previous = merged.at(-1);
    if (previous === undefined || span.start >= previous.end) {
      merged.push({ ...span });
      continue;
    }
    merged[merged.length - 1] = {
      start: previous.start,
      end: Math.max(previous.end, span.end),
    };
  }
  return Object.freeze(merged.map((span) => Object.freeze(span)));
}

function hasInterveningRisk(
  risks: readonly LocalMatchSpan[],
  risk: LocalMatchSpan,
  context: LocalMatchSpan,
) {
  if (context.end <= risk.start) {
    return risks.some(
      (candidate) =>
        candidate !== risk &&
        !spansOverlap(candidate, risk) &&
        candidate.end > context.start &&
        candidate.end <= risk.start,
    );
  }
  if (risk.end <= context.start) {
    return risks.some(
      (candidate) =>
        candidate !== risk &&
        !spansOverlap(candidate, risk) &&
        candidate.start >= risk.end &&
        candidate.start < context.end,
    );
  }
  return false;
}

function historicalContextOwnsRisk(
  proposition: string,
  risks: readonly LocalMatchSpan[],
  risk: LocalMatchSpan,
  context: LocalMatchSpan,
) {
  if (spansOverlap(risk, context)) return true;
  if (context.end > risk.start) return false;
  if (hasInterveningRisk(risks, risk, context)) return false;
  const bridge = proposition.slice(context.end, risk.start);
  return (
    [...bridge].length <= 12 &&
    /^(?:(?:ずっと|本当に|一度|何度も|当時は)|[、,\sはにもからまで])*$/u.test(
      bridge,
    ) &&
    !matchesAny(bridge, CURRENT_TEMPORAL_CONTEXT_PHRASES)
  );
}

function currentContextOwnsRisk(
  proposition: string,
  risks: readonly LocalMatchSpan[],
  risk: LocalMatchSpan,
  context: LocalMatchSpan,
  allowTrailingContext = false,
) {
  if (spansOverlap(risk, context)) return true;
  if (hasInterveningRisk(risks, risk, context)) return false;
  if (context.end <= risk.start) {
    const bridge = proposition.slice(context.end, risk.start);
    return [...bridge].length <= 16 && !/[、,]/u.test(bridge);
  }
  if (risk.end <= context.start) {
    const bridge = proposition.slice(risk.end, context.start);
    return allowTrailingContext && [...bridge].length <= 48;
  }
  return false;
}

function localSuppressionOwnsRisk(
  proposition: string,
  risk: LocalMatchSpan,
  suppression: LocalMatchSpan,
) {
  if (risk.start < suppression.end && suppression.start < risk.end) {
    return true;
  }
  if (suppression.start < risk.end) return false;
  const bridge = proposition.slice(risk.end, suppression.start);
  if (COORDINATED_RISK_NOUN_BRIDGE.test(bridge)) return true;
  return (
    [...bridge].length <= 12 &&
    !/[、,]/u.test(bridge) &&
    !/(?:けれども|けれど|けど|ですが|だが|でも|しかし|ただし|一方で|ではなく|じゃなく|とはいえ|ところが|反面)/u.test(
      bridge,
    )
  );
}

function looksLikeIndependentPredicate(value: string) {
  return INDEPENDENT_PREDICATE_ENDING.test(value.trim());
}

function splitPredicateCommas(fragment: string) {
  const atoms = fragment.split(/([、,])/u);
  const propositions: string[] = [];
  let current = atoms[0]?.trim() ?? "";

  for (let index = 1; index < atoms.length; index += 2) {
    const separator = atoms[index] ?? "";
    const next = atoms[index + 1]?.trim() ?? "";
    const splitHere =
      current.length > 0 &&
      next.length > 0 &&
      looksLikeIndependentPredicate(current) &&
      looksLikeIndependentPredicate(next) &&
      !COMMA_CONTINUATION_PREFIX.test(next);

    if (splitHere) {
      propositions.push(current);
      current = next;
    } else {
      current = `${current}${separator}${next}`.trim();
    }
  }

  if (current.length > 0) propositions.push(current);
  return propositions;
}

function splitLocalPropositions(text: string) {
  const withBoundaries = text
    .replace(/[。！？!?\n]+/gu, LOCAL_PROPOSITION_BOUNDARY)
    .replace(
      /((?:ではなく|じゃなく)(?:て)?)(?:[、,]|\s)*/gu,
      `$1${LOCAL_PROPOSITION_BOUNDARY}`,
    )
    .replace(
      /(?:けれども|けれど|けど|ですが|だが)(?:[、,]|\s)*/gu,
      LOCAL_PROPOSITION_BOUNDARY,
    )
    .replace(
      /(^|[、,\s])(?:それでも|でも|しかし|ただし|その一方で|一方で|とはいえ|ところが|反面)(?:[、,\s]*)/gu,
      LOCAL_PROPOSITION_BOUNDARY,
    )
    .replace(
      /((?:たい|たかった|です|でした|ます|ました|ません|ませんでした|ない|なかった))が(?:[、,]|\s)*/gu,
      `$1${LOCAL_PROPOSITION_BOUNDARY}`,
    );

  return withBoundaries
    .split(LOCAL_PROPOSITION_BOUNDARY)
    .flatMap(splitPredicateCommas)
    .map((part) => part.trim())
    .filter(Boolean);
}

function inspectSafetyProposition(proposition: string) {
  const directRisks = mergeOverlappingSpans(
    findLocalMatchSpans(proposition, DIRECT_CURRENT_SAFETY_PHRASES),
  );
  const contextRisks = mergeOverlappingSpans(
    findLocalMatchSpans(proposition, SAFETY_CONTEXT_PHRASES),
  );
  const allRisks = mergeOverlappingSpans([...directRisks, ...contextRisks]);
  const denials = findLocalMatchSpans(
    proposition,
    CURRENT_SAFETY_DENIAL_PHRASES,
  );
  const historicalContexts = findLocalMatchSpans(
    proposition,
    HISTORICAL_OR_NONCURRENT_CONTEXT_PHRASES,
  );
  const currentContexts = findLocalMatchSpans(
    proposition,
    CURRENT_TEMPORAL_CONTEXT_PHRASES,
  );
  const ambiguousTemporalOwnership = matchesAny(
    proposition,
    AMBIGUOUS_TEMPORAL_OWNERSHIP_PHRASES,
  );
  let explicitCurrentSafety = false;
  let unresolvedSafetyContext = false;
  let historicalOrNoncurrentSafety = false;

  for (const risk of directRisks) {
    if (
      denials.some((denial) =>
        localSuppressionOwnsRisk(proposition, risk, denial),
      )
    ) {
      continue;
    }
    if (ambiguousTemporalOwnership) {
      unresolvedSafetyContext = true;
      continue;
    }
    if (
      currentContexts.some((context) =>
        currentContextOwnsRisk(proposition, allRisks, risk, context),
      )
    ) {
      explicitCurrentSafety = true;
      continue;
    }
    if (
      historicalContexts.some((context) =>
        historicalContextOwnsRisk(proposition, allRisks, risk, context),
      )
    ) {
      historicalOrNoncurrentSafety = true;
      continue;
    }
    explicitCurrentSafety = true;
  }

  if (!explicitCurrentSafety) {
    for (const risk of contextRisks) {
      if (directRisks.some((directRisk) => spansOverlap(risk, directRisk))) {
        continue;
      }
      if (
        historicalContexts.some((context) =>
          historicalContextOwnsRisk(proposition, allRisks, risk, context),
        )
      ) {
        historicalOrNoncurrentSafety = true;
        continue;
      }
      unresolvedSafetyContext = true;
    }
  }

  return Object.freeze({
    explicitCurrentSafety,
    unresolvedSafetyContext,
    historicalOrNoncurrentSafety,
  });
}

function detectBoundaryHintsInSource(
  text: string,
  sourceIsLatestInbound: boolean,
): readonly MaterialBoundaryHintV1[] {
  const hints = new Set<MaterialBoundaryHintV1>();
  const normalized = normalizeForInspection(text);

  if (matchesAny(normalized, TEMPORARY_PAUSE_SOURCE_PHRASES)) {
    hints.add("temporary_pause");
  }
  if (matchesAny(normalized, EXPLICIT_NO_CONTACT_SOURCE_PHRASES)) {
    hints.add("explicit_no_contact");
  }
  if (matchesAny(normalized, CHANNEL_RESTRICTED_SOURCE_PHRASES)) {
    hints.add("channel_restricted");
  }
  if (
    matchesAny(
      normalized,
      sourceIsLatestInbound
        ? DIRECT_RELATIONSHIP_CLOSED_PHRASES
        : REPORTED_RELATIONSHIP_CLOSED_PHRASES,
    )
  ) {
    hints.add("relationship_closed");
  }
  return Object.freeze([...hints]);
}

function inspectContent(input: PrepaymentSafetyInputV1): ContentInspectionV1 {
  const requestTexts = [input.currentSituation, input.optionalMessage].filter(
    (value): value is string => value !== null,
  ).map(normalizeForInspection);
  const safetyTexts = [
    ...requestTexts,
    ...(input.latestInboundMessage === null
      ? []
      : [normalizeForInspection(input.latestInboundMessage)]),
  ];
  let explicitUrgentSafety = false;
  let unresolvedSafetyContext = false;
  let explicitUnsafeAssistance = false;
  let ambiguousUnsafeExecution = false;
  let stoppingOrAvoidingContext = false;
  let explicitProfessionalRequest = false;
  const currentSituationBoundaryHints = detectBoundaryHintsInSource(
    input.currentSituation,
    false,
  );
  const latestInboundBoundaryHints =
    input.latestInboundMessage === null
      ? Object.freeze([])
      : detectBoundaryHintsInSource(input.latestInboundMessage, true);

  for (const text of safetyTexts) {
    for (const proposition of splitLocalPropositions(text)) {
      const safety = inspectSafetyProposition(proposition);
      explicitUrgentSafety ||= safety.explicitCurrentSafety;
      unresolvedSafetyContext ||= safety.unresolvedSafetyContext;
      stoppingOrAvoidingContext ||= safety.historicalOrNoncurrentSafety;
    }
  }

  for (const text of requestTexts) {
    for (const proposition of splitLocalPropositions(text)) {
      const stoppingMatches = findLocalMatchSpans(
        proposition,
        LOCAL_STOPPING_OR_AVOIDING_PHRASES,
      );
      const stoppingOrAvoiding = stoppingMatches.length > 0;
      const historicalContexts = findLocalMatchSpans(
        proposition,
        HISTORICAL_OR_NONCURRENT_CONTEXT_PHRASES,
      );
      const explicitUnsafeMatches = findLocalMatchSpans(
        proposition,
        EXPLICIT_UNSAFE_ASSISTANCE_PHRASES,
      );
      const ambiguousUnsafeMatches = findLocalMatchSpans(
        proposition,
        AMBIGUOUS_UNSAFE_EXECUTION_PHRASES,
      );
      const unsafeRisks = mergeOverlappingSpans([
        ...explicitUnsafeMatches,
        ...ambiguousUnsafeMatches,
      ]);
      const currentUnsafeIntentMatches = findLocalMatchSpans(
        proposition,
        CURRENT_UNSAFE_EXECUTION_INTENT_PHRASES,
      );
      const ambiguousOwnership =
        unsafeRisks.length > 0 &&
        matchesAny(proposition, AMBIGUOUS_UNSAFE_OWNERSHIP_PHRASES);
      const ambiguousTemporalOwnership = matchesAny(
        proposition,
        AMBIGUOUS_TEMPORAL_OWNERSHIP_PHRASES,
      );
      let explicitUnsafe = false;
      let ambiguousUnsafe = false;
      let historicalUnsafe = false;

      for (const risk of unsafeRisks) {
        const stopped = stoppingMatches.some((stopping) =>
          localSuppressionOwnsRisk(proposition, risk, stopping),
        );
        const currentExecution = currentUnsafeIntentMatches.some((context) =>
          currentContextOwnsRisk(
            proposition,
            unsafeRisks,
            risk,
            context,
            true,
          ),
        );
        const historical = historicalContexts.some((context) =>
          historicalContextOwnsRisk(proposition, unsafeRisks, risk, context),
        );
        const explicitlyUnsafe = explicitUnsafeMatches.some((match) =>
          spansOverlap(risk, match),
        );

        if (ambiguousOwnership || ambiguousTemporalOwnership) {
          ambiguousUnsafe = true;
        } else if (stopped) {
          continue;
        } else if (currentExecution) {
          explicitUnsafe = true;
        } else if (historical) {
          historicalUnsafe = true;
        } else if (explicitlyUnsafe) {
          explicitUnsafe = true;
        } else {
          ambiguousUnsafe = true;
        }
      }

      explicitUnsafeAssistance ||= explicitUnsafe;
      ambiguousUnsafeExecution ||= ambiguousUnsafe && !explicitUnsafe;
      stoppingOrAvoidingContext ||=
        stoppingOrAvoiding || historicalUnsafe;
    }
    explicitProfessionalRequest ||= matchesAny(
      text,
      EXPLICIT_PROFESSIONAL_REQUEST_PHRASES,
    );
  }

  return Object.freeze({
    explicitUrgentSafety,
    unresolvedSafetyContext,
    explicitUnsafeAssistance,
    ambiguousUnsafeExecution,
    stoppingOrAvoidingContext,
    explicitProfessionalRequest,
    sourceBoundaryHints: Object.freeze([
      ...new Set([
        ...currentSituationBoundaryHints,
        ...latestInboundBoundaryHints,
      ]),
    ]),
    latestInboundBoundaryHints,
    materialPrivateExpansion: requestTexts.some((text) =>
      matchesAny(text, MATERIAL_PRIVATE_EXPANSION_PHRASES),
    ),
    scopedReplySourceInvitation:
      input.latestInboundMessage !== null &&
      matchesAny(
        normalizeForInspection(input.latestInboundMessage),
        SCOPED_REPLY_SOURCE_INVITATION_PHRASES,
      ),
    narrowScopedReplyEvidence:
      input.optionalMessage !== null &&
      matchesAny(
        normalizeForInspection(input.optionalMessage),
        NARROW_SCOPED_REPLY_PHRASES,
      ),
  });
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function decision(
  classification: PrepaymentSafetyClassificationDecisionV1["classification"],
  reasonCodes: readonly PrepaymentSafetyReasonCodeV1[],
  requiredClarificationCodes: readonly ClarificationCodeV1[] = [],
): PrepaymentSafetyClassificationDecisionV1 {
  const policy = OUTPUT_POLICIES[classification];
  const safetyDisposition = classification.startsWith("eligible_")
    ? "eligible"
    : classification;
  const deliveryScope = classification.startsWith("eligible_")
    ? classification.slice("eligible_".length)
    : null;

  if (
    safetyDisposition !== "eligible" &&
    safetyDisposition !== "needs_clarification" &&
    safetyDisposition !== "blocked_unsafe_assistance" &&
    safetyDisposition !== "urgent_safety_redirect" &&
    safetyDisposition !== "unsupported_professional_request"
  ) {
    throw new Error("PREPAYMENT_CLASSIFICATION_INVARIANT");
  }
  if (
    deliveryScope !== null &&
    deliveryScope !== "general" &&
    deliveryScope !== "pause_assessment" &&
    deliveryScope !== "boundary_support_only" &&
    deliveryScope !== "scoped_reply" &&
    deliveryScope !== "business_only"
  ) {
    throw new Error("PREPAYMENT_DELIVERY_SCOPE_INVARIANT");
  }

  return Object.freeze({
    classification,
    safetyDisposition,
    deliveryScope,
    reasonCodes: Object.freeze(unique(reasonCodes)),
    requiredClarificationCodes: Object.freeze(
      unique(requiredClarificationCodes),
    ),
    allowedOutputKinds: Object.freeze([...policy.allowed]),
    forbiddenOutputKinds: Object.freeze([...policy.forbidden]),
  });
}

function clarification(
  codes: readonly ClarificationCodeV1[],
): PrepaymentSafetyClassificationDecisionV1 {
  return decision(
    "needs_clarification",
    ["material_scope_uncertainty"],
    codes,
  );
}

function effectiveBoundary(
  input: PrepaymentSafetyInputV1,
): ContactBoundaryStateV1 | null {
  const clarified = input.clarificationAnswers.clarifiedContactBoundaryState;
  if (input.contactBoundaryState === "unknown") return clarified;
  if (clarified !== null && clarified !== input.contactBoundaryState) return null;
  return input.contactBoundaryState;
}

function hasBoundarySourceConflict(
  boundary: ContactBoundaryStateV1 | null,
  sourceBoundaryHints: readonly MaterialBoundaryHintV1[],
  latestInboundBoundaryHints: readonly MaterialBoundaryHintV1[],
) {
  const relevantHints =
    boundary === "new_inbound_after_boundary"
      ? latestInboundBoundaryHints
      : sourceBoundaryHints;
  return (
    boundary !== null &&
    relevantHints.some((hint) => hint !== boundary)
  );
}

export function classifyPrepaymentSafetyV1(
  input: PrepaymentSafetyInputV1,
): PrepaymentSafetyClassificationDecisionV1 {
  const content = inspectContent(input);
  const answers = input.clarificationAnswers;

  if (
    input.contactBoundaryState === "urgent_safety" ||
    input.requestedAssistanceGoal === "urgent_safety_help" ||
    answers.currentSafetyStatus === "current_urgent" ||
    content.explicitUrgentSafety
  ) {
    return decision("urgent_safety_redirect", ["current_urgent_safety"]);
  }

  if (
    input.requestedAssistanceGoal === "recontact_or_overcome_boundary" ||
    input.requestedAssistanceGoal === "alternate_channel_or_third_party" ||
    input.requestedAssistanceGoal === "monitor_track_or_manipulate" ||
    answers.unsafeExecutionIntent === "execution_requested" ||
    content.explicitUnsafeAssistance
  ) {
    return decision("blocked_unsafe_assistance", [
      "unsafe_assistance_requested",
    ]);
  }

  const professionalScopeWasLimited =
    answers.professionalScopeLimitedToNonprofessionalOrganization ===
    "yes";
  if (
    content.explicitProfessionalRequest ||
    (input.requestedAssistanceGoal === "professional_judgment" &&
      !professionalScopeWasLimited)
  ) {
    return decision("unsupported_professional_request", [
      "professional_judgment_requested",
    ]);
  }

  const clarificationCodes: ClarificationCodeV1[] = [];
  const boundary = effectiveBoundary(input);
  if (boundary === null) {
    clarificationCodes.push(
      input.contactBoundaryState === "unknown"
        ? "boundary_state_required"
        : "structured_content_conflict",
    );
  }
  if (
    answers.currentSafetyStatus === "still_unclear" ||
    (content.unresolvedSafetyContext &&
      answers.currentSafetyStatus !== "not_current")
  ) {
    clarificationCodes.push("current_safety_status_required");
  }
  if (
    answers.unsafeExecutionIntent === "still_unclear" ||
    (content.ambiguousUnsafeExecution &&
      answers.unsafeExecutionIntent !== "stopping_or_avoiding")
  ) {
    clarificationCodes.push("unsafe_execution_intent_required");
  }
  if (
    hasBoundarySourceConflict(
      boundary,
      content.sourceBoundaryHints,
      content.latestInboundBoundaryHints,
    )
  ) {
    clarificationCodes.push("boundary_state_conflict");
  }
  if (
    boundary === "new_inbound_after_boundary" &&
    input.latestInboundMessage === null
  ) {
    clarificationCodes.push("latest_inbound_message_required");
  }
  if (clarificationCodes.length > 0) return clarification(clarificationCodes);
  if (boundary === null) return clarification(["boundary_state_required"]);

  const eligibleReasons: PrepaymentSafetyReasonCodeV1[] = [];
  if (content.stoppingOrAvoidingContext) {
    eligibleReasons.push("historical_or_stopping_context");
  }

  if (boundary === "no_restriction_known") {
    return decision("eligible_general", [
      "eligible_general_scope",
      ...eligibleReasons,
    ]);
  }

  if (boundary === "temporary_pause") {
    return decision("eligible_pause_assessment", [
      "temporary_pause_respected",
      ...eligibleReasons,
    ]);
  }

  if (
    boundary === "explicit_no_contact" ||
    boundary === "channel_restricted" ||
    boundary === "relationship_closed"
  ) {
    if (input.requestedAssistanceGoal === "draft_within_current_permission") {
      return clarification(["structured_content_conflict"]);
    }
    return decision("eligible_boundary_support_only", [
      "explicit_boundary_respected",
      ...eligibleReasons,
    ]);
  }

  if (boundary === "business_only") {
    if (content.materialPrivateExpansion) {
      return clarification(["business_scope_required"]);
    }
    if (
      input.requestedAssistanceGoal === "understand_and_organize" ||
      input.requestedAssistanceGoal === "decide_send_wait_or_pause" ||
      professionalScopeWasLimited
    ) {
      return decision("eligible_boundary_support_only", [
        "explicit_boundary_respected",
        ...eligibleReasons,
      ]);
    }
    const businessCodes: ClarificationCodeV1[] = [];
    if (answers.practicalPermissionExplicit !== "yes") {
      businessCodes.push("business_permission_required");
    }
    if (answers.currentRequestPracticalScopeOnly !== "yes") {
      businessCodes.push("business_scope_required");
    }
    if (businessCodes.length > 0) return clarification(businessCodes);
    return decision("eligible_business_only", ["business_scope_limited"]);
  }

  if (boundary === "new_inbound_after_boundary") {
    if (
      input.requestedAssistanceGoal === "understand_and_organize" ||
      input.requestedAssistanceGoal === "decide_send_wait_or_pause" ||
      professionalScopeWasLimited
    ) {
      return decision("eligible_boundary_support_only", [
        "explicit_boundary_respected",
        ...eligibleReasons,
      ]);
    }
    const replyCodes: ClarificationCodeV1[] = [];
    if (answers.replyExplicitlyInvited !== "yes") {
      replyCodes.push("reply_invitation_required");
    }
    if (answers.replyLimitedToExactSubject !== "yes") {
      replyCodes.push("reply_scope_required");
    }
    if (
      content.materialPrivateExpansion ||
      !content.scopedReplySourceInvitation ||
      !content.narrowScopedReplyEvidence
    ) {
      replyCodes.push("reply_scope_required");
    }
    if (replyCodes.length > 0) return clarification(replyCodes);
    return decision("eligible_scoped_reply", ["new_inbound_scope_limited"]);
  }

  return clarification(["boundary_state_required"]);
}
