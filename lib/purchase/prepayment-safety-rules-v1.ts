import type {
  ClarificationCodeV1,
  ContactBoundaryStateV1,
  PrepaymentSafetyClassificationDecisionV1,
  PrepaymentSafetyInputV1,
  PrepaymentSafetyOutputKindV1,
  PrepaymentSafetyReasonCodeV1,
} from "./prepayment-safety-types-v1.ts";

const URGENT_CURRENT_PHRASES = [
  /(?:今|現在|いま|今夜|直ちに|すぐ|これから).{0,24}(?:死にたい|自殺(?:したい|する|しよう)|自分を傷つけ(?:たい|る)|相手を(?:殺す|傷つける|殴る)|人を(?:殺す|傷つける)|暴力を(?:受けている|振るわれている)|殺されそう|襲われている|監禁されている|脅されている|危険(?:です|だ|がある))/u,
  /(?:死にたい|自殺(?:したい|する|しよう)|自分を傷つけ(?:たい|る)|相手を(?:殺す|傷つける)|殺されそう|襲われている).{0,16}(?:今|現在|いま|すぐ|これから)/u,
  /(?:currently|right now|immediately|about to).{0,30}(?:suicidal|kill myself|harm myself|hurt someone|kill someone|being attacked|in immediate danger)/iu,
  /(?:kill myself|harm myself|hurt someone|kill someone).{0,20}(?:now|tonight|immediately)/iu,
] as const;

const SAFETY_CONTEXT_PHRASES = [
  /(?:自傷|自殺|暴力|DV|家庭内暴力|虐待|監禁|殺害予告|命の危険)/iu,
  /(?:self-harm|suicid|violence|domestic abuse|immediate danger)/iu,
] as const;

const HISTORICAL_OR_NONCURRENT_PHRASES = [
  /(?:以前|過去|昔|かつて|昨年|去年|前に|もう終わった|現在は安全|今は安全)/u,
  /(?:previously|in the past|last year|not current|safe now)/iu,
] as const;

const STOPPING_OR_AVOIDING_PHRASES = [
  /(?:やめたい|やめます|しません|しないように|避けたい|防ぎたい|繰り返さない|距離を置きたい|尊重したい|巻き込まない|手放したい|止めたい)/u,
  /(?:help me stop|want to stop|will not|avoid doing|respect (?:the )?boundary|do not want to|won't contact)/iu,
] as const;

const EXPLICIT_UNSAFE_ASSISTANCE_PHRASES = [
  /(?:別|他)(?:の)?アカウント.{0,28}(?:連絡する文面を作りたい|連絡したい|連絡する方法|メッセージを送りたい|送る方法)/u,
  /(?:別SNS|別のSNS|別番号|違う番号).{0,24}(?:連絡したい|連絡する方法|電話したい|送る方法)/u,
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
  /(?:別SNS|別のSNS|別番号|違う番号).{0,20}(?:連絡|送信|電話)/u,
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

type ContentInspectionV1 = Readonly<{
  explicitUrgentSafety: boolean;
  unresolvedSafetyContext: boolean;
  explicitUnsafeAssistance: boolean;
  ambiguousUnsafeExecution: boolean;
  stoppingOrAvoidingContext: boolean;
  explicitProfessionalRequest: boolean;
}>;

function matchesAny(text: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeForInspection(value: string) {
  return value.normalize("NFKC").replace(/\r\n?/gu, "\n").toLocaleLowerCase("ja");
}

function inspectContent(input: PrepaymentSafetyInputV1): ContentInspectionV1 {
  const texts = [input.currentSituation, input.optionalMessage].filter(
    (value): value is string => value !== null,
  );
  let explicitUrgentSafety = false;
  let unresolvedSafetyContext = false;
  let explicitUnsafeAssistance = false;
  let ambiguousUnsafeExecution = false;
  let stoppingOrAvoidingContext = false;
  let explicitProfessionalRequest = false;

  for (const rawText of texts) {
    const text = normalizeForInspection(rawText);
    const historicalOrNoncurrent = matchesAny(
      text,
      HISTORICAL_OR_NONCURRENT_PHRASES,
    );
    const stoppingOrAvoiding = matchesAny(text, STOPPING_OR_AVOIDING_PHRASES);
    const explicitUnsafe = matchesAny(text, EXPLICIT_UNSAFE_ASSISTANCE_PHRASES);
    const ambiguousUnsafe = matchesAny(
      text,
      AMBIGUOUS_UNSAFE_EXECUTION_PHRASES,
    );

    explicitUrgentSafety ||= matchesAny(text, URGENT_CURRENT_PHRASES);
    unresolvedSafetyContext ||=
      matchesAny(text, SAFETY_CONTEXT_PHRASES) &&
      !historicalOrNoncurrent &&
      !stoppingOrAvoiding &&
      !matchesAny(text, URGENT_CURRENT_PHRASES);
    explicitUnsafeAssistance ||= explicitUnsafe;
    ambiguousUnsafeExecution ||=
      ambiguousUnsafe && !explicitUnsafe && !stoppingOrAvoiding;
    stoppingOrAvoidingContext ||= stoppingOrAvoiding;
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
    if (replyCodes.length > 0) return clarification(replyCodes);
    return decision("eligible_scoped_reply", ["new_inbound_scope_limited"]);
  }

  return clarification(["boundary_state_required"]);
}
