import type {
  CompletedAssessment,
  RequestedTopic,
} from "../types";

export const m2P4I2RequestedTopics = [
  "decide_send_or_wait",
  "draft_message",
  "next_three_days",
] satisfies RequestedTopic[];

export const m2P4I2ReviewFixture: CompletedAssessment = {
  requestId: "i2-fixed-preview-request",
  runId: "i2-fixed-preview-run",
  eligibility: "ready",
  decision: "reply_now",
  report: {
    schemaVersion: "m2-p3-runtime-report-v1",
    decisionPlan: {
      schema_version: "pipeline-schema-v1.0.0",
      selected_decision: "reply_now",
      decision_reason_fact_ids: ["F001", "F002", "F003"],
      possible_interpretations: [
        {
          statement: "相手は会話を続ける意図で質問を返した可能性があります。",
          supporting_fact_ids: ["F001", "F002"],
          epistemic_status: "possibility_only",
        },
        {
          statement: "短い返信を望んでいる可能性もあります。",
          supporting_fact_ids: ["F002"],
          epistemic_status: "possibility_only",
        },
      ],
      actions_to_take: [
        "今夜のうちに、質問への答えを一つ添えて短く返信する。",
        "送信後はアプリを閉じ、自分の予定へ戻る。",
      ],
      actions_to_avoid: [
        "関係の結論を今夜すぐ確認しようとする。",
        "返信前に長い前置きや謝罪を追加する。",
      ],
      message_draft: {
        text: "聞いてくれてありがとう。私は最近、静かなカフェを探すのが好きです。もしよかったら、あなたのおすすめも教えてください。",
        policy: "required_now",
        use_timing: "now",
      },
      three_day_plan: [
        {
          day: "tonight",
          action: "返信案を一度読み返し、そのまま短く送る。",
          avoid: "不安から説明を付け足さない。",
        },
        {
          day: "next_day",
          action: "返信の有無にかかわらず、自分の予定を優先する。",
          avoid: "既読やオンライン表示を繰り返し確認しない。",
        },
        {
          day: "day_three",
          action: "会話が続いていれば、次に話したいことを一つ選ぶ。",
          avoid: "短い反応だけで関係性を決めつけない。",
        },
      ],
      change_conditions: [
        {
          condition: "相手から会話を終えたいという明確な意思が示された場合。",
          resulting_direction: "pause_additional_contact",
        },
        {
          condition: "送信前に相手から別の具体的な質問が届いた場合。",
          resulting_direction: "reply_now",
        },
      ],
      review_timing: {
        when: "相手から新しい返信が届いた時、または3日後。",
        trigger_fact_ids: ["F001", "F002"],
      },
      material_unknowns: [
        "相手が今夜どの程度会話を続けられる状況か。",
      ],
      limitations: [
        "相手の本心や今後の関係を断定するものではありません。",
      ],
    },
    content: {
      schema_version: "pipeline-schema-v1.0.0",
      cover_line: "今夜は、相手の質問に短く答えて会話のボールを返しましょう。",
      short_letter: [
        "返事を考えすぎて言葉が増えそうな夜ほど、会話の目的を一つに絞ると落ち着きます。",
        "相手はあなたへ質問を返しています。今夜はその一つに答えるだけで、十分に自然なやり取りです。",
      ],
      decision_reason_summary:
        "相手から具体的な質問が届いており、今夜の短い返信が会話の流れに沿うためです。",
      relationship_summary:
        "架空のマッチングアプリ上で数日会話し、相手から趣味について質問が届いている段階です。",
      observed_fact_commentary: [
        {
          fact_id: "F001",
          commentary: "相手から具体的な質問が届いています。",
        },
        {
          fact_id: "F002",
          commentary: "直近の会話は互いに一つずつ質問する流れです。",
        },
        {
          fact_id: "F003",
          commentary: "返信を止めてほしいという意思表示は確認されていません。",
        },
        {
          fact_id: "F999",
          commentary: "この補足は判断に使われていないため、画面には表示しません。",
        },
      ],
      possible_interpretations: [
        "相手はあなたの好みを知り、会話を続けたい可能性があります。",
        "会話のきっかけとして答えやすい質問を選んだ可能性があります。",
      ],
      anxiety_reframe: [
        "完璧な返事で関係を決める必要はありません。今夜は一往復の会話として考えられます。",
      ],
      message_temperature: {
        softness: "お礼から始めるため、受け取りやすい柔らかさがあります。",
        affection: "相手への関心を、質問を一つ返す形で示しています。",
        pressure: "返答を急かす表現はなく、圧力は低い文面です。",
        adjustment: "説明を増やさず、趣味と質問を一つずつに絞っています。",
      },
      action_rationales: [
        "質問へ短く答えることで、相手のペースを尊重しながら会話を前へ進められます。",
        "送信後に確認を止めることで、返信待ちの不安に夜を占領されにくくなります。",
      ],
      message_draft_context:
        "相手の質問へ直接答えたうえで、返答を義務にしない軽い質問を一つだけ添えました。",
      three_day_plan_commentary: [
        "今夜の目的は、関係を決めることではなく一往復を自然に返すことです。",
        "返信待ちの時間も、自分の生活を止める必要はありません。",
        "会話が続いた事実を確認してから、次の一歩を考えます。",
      ],
      change_condition_commentary: [
        "相手から会話を終えたいという明確な意思が示された場合は、追加連絡を止める方向へ見直します。",
        "送信前に別の具体的な質問が届いた場合は、新しい内容に合わせて返信を整え直します。",
      ],
      unknowns_commentary: [
        "相手が今夜どの程度会話を続けられる状況かは分かりません。",
      ],
      closing_lines: [
        "今夜は、関係の答えを出す夜ではなく、自然な一往復を返す夜です。",
        "短く送ったら、あとはあなた自身の時間へ戻って大丈夫です。",
      ],
    },
    fixedLimitation:
      "このノートは確認できる情報を整理するもので、相手の本心や未来を断定しません。",
  },
  decisionCard: {
    schemaVersion: "m2-p3-decision-card-v1",
    decision: "reply_now",
    reason: "相手から具体的な質問が届いているため。",
    actionsToTake: ["質問へ短く答えて返信する。"],
    actionsToAvoid: ["関係の結論を急いで確認する。"],
    messageDraft:
      "聞いてくれてありがとう。私は最近、静かなカフェを探すのが好きです。もしよかったら、あなたのおすすめも教えてください。",
    reviewTiming: "相手から新しい返信が届いた時、または3日後。",
  },
  usage: {
    totalInputTokens: 12,
    totalCachedTokens: 3,
    totalOutputTokens: 8,
    totalReasoningTokens: 2,
    usageDerivedCostUsd: 0,
  },
};
