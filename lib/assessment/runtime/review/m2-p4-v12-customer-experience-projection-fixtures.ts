import {
  decodeCustomerAssessmentExperienceProjectionV2,
  type CustomerAssessmentExperienceProjectionV2,
} from "../customer-assessment-experience-projection-v2.ts";

const fixedLimitation =
  "この鑑定は、入力された内容をもとにした現時点の整理です。";

const fixtureDefinitions = [
  {
    id: "simple_business_reply_with_draft",
    label: "業務連絡への短い返信",
    summary:
      "短い業務連絡でも、手紙・状況整理・文案・行動・見直し・結びが揃う確認用です。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
      openingLine: "火曜日14時で、短く返信して大丈夫です。",
      openingLetter: [
        "今回は、相手から届いた日程確認に答える場面です。迷う要素を増やさず、確認できている予定をそのまま返せば十分です。",
        "短い返事でも失礼にはなりません。相手が次の手続きを進めやすい形に整えることを優先しましょう。",
      ],
      situationReading: [
        "相手から火曜日14時という具体的な予定が示されています。",
        "いま必要なのは、予定を受け取ったことを返すことです。",
      ],
      possibleInterpretations: [],
      materialUnknowns: ["宛先と日時に誤りがないかは、送信前の確認が必要です。"],
      draftContext:
        "相手が確認しやすいよう、受領と日時だけを簡潔に返す文面です。",
      actionRationales: [
        "確認事項が一つのため、情報を足さない方が行き違いを防げます。",
      ],
      closingLines: [
        "必要なことは、もう整理できています。確認して一度返したら、この連絡はいったん手放して大丈夫です。",
      ],
      consultationLimitations: [
        "このノートでは、送信先や実際の予定変更までは確認できません。",
      ],
    },
  },
  {
    id: "ordinary_reply_waiting",
    label: "返事を待つ夜",
    summary:
      "待つ判断を、安心・確認済み情報・不確実性・行動・結びまで含めて確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
          ],
        },
        fixedLimitation,
      },
      openingLine: "今夜は送らず、返事を待って大丈夫です。",
      openingLetter: [
        "今夜は答えを急がなくて大丈夫です。待つことも、関係を丁寧に扱う選択です。",
        "不安が大きいときは、結論ではなく今わかっている事実だけを見直してみてください。",
      ],
      situationReading: [
        "最後の連絡を送ってから、まだ十分な時間は経っていません。",
        "現時点では、相手から新しい返答や質問は届いていません。",
      ],
      possibleInterpretations: [
        "返事がない理由は、いま確認できる情報だけでは一つに決められません。",
      ],
      materialUnknowns: [
        "相手がまだ返信していない理由は分かりません。",
        "次の返答がいつ届くかは分かりません。",
      ],
      draftContext: null,
      actionRationales: [
        "新しい材料がない今は、連絡を重ねない方が状況を読み違えにくくなります。",
      ],
      closingLines: [
        "今夜の沈黙だけで、これからの関係まで決める必要はありません。",
        "今日は待つところまでで十分です。次の材料が届くまで、自分の時間に戻りましょう。",
      ],
      consultationLimitations: [
        "相手の事情や返信時期は、この相談内容だけでは確認できません。",
      ],
    },
  },
  {
    id: "polite_thank_you_with_draft",
    label: "丁寧なお礼の文面",
    summary:
      "お礼の文案、文案理由、文面の印象を、憶測を足さずに確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
            "素直なお礼として受け取られる可能性がある文面です。",
            "会話を気持ちよく終える合図として伝わる可能性もあります。",
          ],
        },
        fixedLimitation,
      },
      openingLine: "今日は、短いお礼を返して大丈夫です。",
      openingLetter: [
        "相手が時間をつくってくれた後だからこそ、まずは感謝だけをまっすぐ返す場面です。",
        "次の約束まで一度に決めようとせず、今日うれしかったことを短く届ければ十分です。",
      ],
      situationReading: [
        "相手と話す時間があり、その直後にお礼を返そうとしています。",
        "今回依頼されているのは、お礼の文案と相手への届き方の確認です。",
      ],
      possibleInterpretations: [
        "素直なお礼として受け取られる可能性がある文面です。",
        "会話を気持ちよく終える合図として伝わる可能性もあります。",
      ],
      materialUnknowns: [
        "この文面を読んだ相手がどう感じるかは、事前には確定できません。",
      ],
      draftContext:
        "感謝と会話できた喜びだけを残し、返事や次の予定を求めない文面です。",
      actionRationales: [
        "出来事の直後に短く返すことで、感謝の対象が分かりやすくなります。",
      ],
      closingLines: [
        "伝えたい中心は、すでに文面に入っています。送った後は、相手の反応を急いで決めつけなくて大丈夫です。",
      ],
      consultationLimitations: [
        "文面の受け取られ方は相手の状況にも左右されるため、結果は断定できません。",
      ],
    },
  },
  {
    id: "relationship_summary_requested",
    label: "今の関係を整理",
    summary:
      "依頼された関係性の要約だけを追加し、文面分析を混在させない確認用です。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
      openingLine: "今夜は関係を確かめず、次の反応を待ちましょう。",
      openingLetter: [
        "会話が続いているからこそ、今すぐ関係に名前をつけたくなる気持ちが出る場面です。",
        "けれど、今あるやり取りと、まだ示されていない次の予定は分けて受け取って大丈夫です。",
      ],
      situationReading: [
        "これまでのやり取りには、会話が続いている事実があります。",
        "一方で、次に会う具体的な日程はまだ示されていません。",
      ],
      possibleInterpretations: [],
      materialUnknowns: [
        "相手が次の予定をどう考えているかは、現時点では分かりません。",
      ],
      draftContext: null,
      actionRationales: [
        "具体的な提案がない段階では、追加の確認より次の反応を材料にする方が確実です。",
      ],
      closingLines: [
        "今ある親しさを否定する必要も、先の関係まで決める必要もありません。今日は会話を置くところまでで十分です。",
      ],
      consultationLimitations: [
        "関係の名称や相手の意図は、現在のやり取りだけでは断定できません。",
      ],
    },
  },
  {
    id: "expanded_plan_requested_legacy",
    label: "3日間の流れ",
    summary: "従来形式の今夜・次の日・3日目を、鑑定全体の流れで確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
      openingLine: "今夜は待ち、3日目にもう一度見直しましょう。",
      openingLetter: [
        "待つ時間に終わりが見えないと、不安は必要以上に大きくなります。今回は、今夜から3日目までを小さく区切って考えます。",
        "今日すべてを決めなくても、見直す時点が決まっていれば落ち着いて待てます。",
      ],
      situationReading: [
        "現時点では、新しい返事は届いていません。",
        "相談では、これから3日間の動き方が求められています。",
      ],
      possibleInterpretations: [],
      materialUnknowns: [
        "3日目までに相手から返事が届くかは分かりません。",
      ],
      draftContext: null,
      actionRationales: [
        "見直す時点を先に決めることで、不安のたびに判断をやり直さずに済みます。",
      ],
      closingLines: [
        "今夜は今夜の分だけで大丈夫です。次の区切りが来たら、その時点の事実で選び直しましょう。",
      ],
      consultationLimitations: [
        "3日間の区切りは判断の目安であり、相手の返信を予測するものではありません。",
      ],
    },
  },
  {
    id: "expanded_plan_requested_split",
    label: "材料に沿った次の流れ",
    summary: "暦日ではなく、今夜・次に・見直す条件で進む流れを確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
      openingLine: "日付ではなく、次の材料が届いた時に見直しましょう。",
      openingLetter: [
        "いま必要なのは、明日までに答えを出すことではありません。次に確認できる材料が増えた時に、判断を更新することです。",
        "期限と相手の反応を分けて見れば、待つ時間を必要以上に長く感じずに済みます。",
      ],
      situationReading: [
        "現在の会話には、判断を変える新しい返答がまだありません。",
        "予定には確認が必要になる期限があります。",
      ],
      possibleInterpretations: [],
      materialUnknowns: [
        "相手から次の反応が届く時期は分かりません。",
      ],
      draftContext: null,
      actionRationales: [
        "日付だけで動かず、観察できる変化を次の判断材料にするためです。",
      ],
      closingLines: [
        "今夜は会話を置くところまでで十分です。材料が増えたら、その時に次の一歩を選べます。",
      ],
      consultationLimitations: [
        "見直し条件は、相手の反応や予定の変化を保証するものではありません。",
      ],
    },
  },
  {
    id: "nullable_optional_sections",
    label: "任意情報がない場合",
    summary:
      "関係要約と文面分析が空でも、手紙・状況・行動・結びで鑑定が成立する確認用です。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
      openingLine: "材料が少ない今は、結論を広げず待ちましょう。",
      openingLetter: [
        "知りたいことに対して材料が少ないと、不安が空白を埋めようとします。今は、分からない部分を分からないまま置いて大丈夫です。",
        "関係や文面の印象を無理に作らず、次に確認できる事実を待つことができます。",
      ],
      situationReading: [
        "現在確認できる情報だけでは、関係の要約を具体化できません。",
        "分析できる送信文面も、今回は提示されていません。",
      ],
      possibleInterpretations: [],
      materialUnknowns: [
        "相手の現在の状況は分かりません。",
        "次の連絡内容と時期は分かりません。",
      ],
      draftContext: null,
      actionRationales: [
        "不足している情報を想像で補わず、確認できる変化を待つためです。",
      ],
      closingLines: [
        "分からないことを、今夜すべて埋めなくて大丈夫です。次の事実が届くまで、自分の予定を優先しましょう。",
      ],
      consultationLimitations: [],
    },
  },
  {
    id: "pause_additional_contact_no_draft",
    label: "追加連絡を止める",
    summary:
      "追加連絡を止める判断、固定の文案非表示理由、境界を再び開かない結びを確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
      openingLine: "ここからは、追加の連絡を止めましょう。",
      openingLetter: [
        "伝えたいことが残っていると、もう一度だけ送りたくなる場面です。それでも、すでに重ねた連絡の後は、送らない選択が相手の境界を守ります。",
        "文面を工夫して接触を続けるのではなく、今日は連絡から離れるところまでを自分の行動にできます。",
      ],
      situationReading: [
        "同じ相手へ、すでに複数回の連絡をしています。",
        "現時点では、相手から新しい連絡は確認できていません。",
      ],
      possibleInterpretations: [],
      materialUnknowns: [
        "相手が連絡にどう対応するかは分かりません。",
      ],
      draftContext: null,
      actionRationales: [
        "別の経路を含めて接触を増やさないことが、確認できる境界を守る行動だからです。",
      ],
      closingLines: [
        "追加で働きかけない選択は、今できる明確な区切りです。今夜は自分の時間へ戻ってください。",
      ],
      consultationLimitations: [
        "これは非安全事案の表示確認用であり、別管理の安全停止体験を代替しません。",
      ],
    },
  },
  {
    id: "kansai_persona_draft",
    label: "改行と絵文字を含む文案",
    summary:
      "方言・改行・絵文字を変えず、文案理由と鑑定全体の流れで確認します。",
    projection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: {
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
      openingLine: "いつもの話し方で、土曜日の予定を返して大丈夫です。",
      openingLetter: [
        "今回は、土曜日なら行けることを相手に返す場面です。普段のやり取りで使っている言葉を、無理に整えすぎる必要はありません。",
        "方言も改行も絵文字も、この文面では会話の調子を保つための一部です。",
      ],
      situationReading: [
        "土曜日なら予定を合わせられることが分かっています。",
        "具体的な時間は、相手から次に教えてもらう段階です。",
      ],
      possibleInterpretations: [],
      materialUnknowns: [
        "土曜日の具体的な時間はまだ決まっていません。",
      ],
      draftContext:
        "普段の口調を保ち、参加できる曜日と次に必要な時間確認を二行で伝えています。",
      actionRationales: [
        "確定している曜日だけを返し、未確定の時間は相手の案内を待てる文面だからです。",
      ],
      closingLines: [
        "あなたらしい言葉のまま、必要な予定は伝わります。日時を確認したら、そのまま送って大丈夫です。",
      ],
      consultationLimitations: [
        "実際の送信前に、曜日と相手との普段の口調をもう一度確認してください。",
      ],
    },
  },
] as const;

export type CustomerAssessmentExperienceReviewFixture = {
  id: (typeof fixtureDefinitions)[number]["id"];
  label: string;
  summary: string;
  projection: CustomerAssessmentExperienceProjectionV2;
};

export const customerAssessmentExperienceReviewFixtures: CustomerAssessmentExperienceReviewFixture[] =
  fixtureDefinitions.map(({ id, label, summary, projection }) => ({
    id,
    label,
    summary,
    projection: decodeCustomerAssessmentExperienceProjectionV2(projection),
  }));

export function selectCustomerAssessmentExperienceReviewFixture(
  fixtureId: string | undefined,
) {
  return (
    customerAssessmentExperienceReviewFixtures.find(
      (fixture) => fixture.id === fixtureId,
    ) ?? customerAssessmentExperienceReviewFixtures[0]
  );
}
