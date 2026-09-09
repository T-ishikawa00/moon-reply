// Authored contract variant of the existing thin-context clarification fixture.
// The text below is synthetic; this is not real-model quality evidence.
import { create0036MessageFixture } from "./paid-delivery-step5a1-0036-message-fixture.mjs";
import { createPaidDeliveryStep4Fixture } from "./paid-delivery-step4-fixtures.mjs";

export function create0036GenericFixture(){
  const seed=create0036MessageFixture(),decision=createPaidDeliveryStep4Fixture(),requests=[];
  const request={currentSituation:"相手とのことを相談したいです。どうすればいいですか？ 今後3日間はどう動けばよいかも整理してください。",relationship:"ambiguous",requestedTopics:["decide_send_or_wait","next_three_days"],optionalMessage:null};
  const answer={choice:"reply_pressure",detail:"連絡の距離感をどうすべきか迷っています。"};
  const transport={requests,async invoke(q){
    requests.push(structuredClone(q));let output;
    if(q.stageId==="PB-01"&&q.input.run_mode==="clarification_resume"){
      const e=q.input.clarification_evidence;
      output={schema_version:"pipeline-schema-clarification-grounding-v1.0.0",target:e.target,source_identity:e.source_identity,answer_fingerprint:e.answer_fingerprint,materially_resolves_target:e.resolves_target,clarification_safety_result:{classification:"normal_allowed",reason_codes:[],response_mode:"none"}};
    }else if(q.stageId==="PB-01"){
      output=(await seed.transport.invoke(q)).output;const base=output.base_intake;
      base.user_goal="decide_send_or_wait";
      base.timeline=[{event_id:"E101",sequence:1,actor:"user",statement:"ユーザーには相談したい相手がいる。",source_refs:["input:current_situation"]}];
      base.context=[];base.observed_facts=[{fact_id:"F101",statement:"ユーザーは相手とのことを相談したい。",source_refs:["input:current_situation"],support:"explicit"}];
      base.user_assumptions=[];base.user_emotions=[];base.material_unknowns=[];
      base.decision_facts.latest_direct_message={sender:"unknown",kind:"unknown",response_expectation:"unknown",user_reply_state:"unknown",sns_signal_only:false};
      base.decision_facts.contact_state={unanswered_user_message_count:0,elapsed_since_latest_user_message_minutes:null,usual_cadence_relation:"unknown"};
      base.decision_facts.information_state.unresolved_fields=[];
      const writing=base.base_writing_signals;writing.user_goal_detail={value:"unknown",basis:"unresolved"};writing.explicit_user_constraints=[];
      writing.relationship_dimensions.familiarity={value:"unknown",basis:"unresolved"};writing.relationship_dimensions.communication_context={value:"unknown",basis:"unresolved"};
      writing.channel_and_timing={channel:"unknown",relative_timing:"unknown",basis:"unresolved"};
      output.request_intent={message_task:"NONE",decision_requested:true,decision_explicitly_excluded:false,communication_purpose:"OTHER",source_excerpt:request.currentSituation,evidence_fact_ids:["F101"]};
    }else if(q.stageId==="PB-04"){
      output=(await decision.transport.invoke(q)).output;const plan=output.decision_plan;
      plan.decision_reason_fact_ids=["F101"];
      plan.possible_interpretations=[{statement:"連絡の判断には、実際に交わした内容を確認することが役立つ場合があります。",supporting_fact_ids:["F101"],epistemic_status:"possibility_only"}];
      plan.pre_action_check={check:"実際のやり取りと今いちばん確認したい点を書き分けてから、連絡する必要性を見直す。",supporting_fact_ids:["F101"]};
      plan.actions_to_take=["今夜は連絡の判断を急がず、実際のやり取りと気になる点を整理する。","明日以降の3日間は自分の予定を進め、具体的な判断材料が増えたときに連絡の必要性を見直す。"];
      plan.actions_to_avoid=["具体的なやり取りを確認せず、相手の意図を決めつける。","判断材料がないまま、確認を求めるメッセージを重ねる。"];
      plan.aftercare_plan=[{phase:"tonight",action:"今夜は連絡の判断を保留し、実際のやり取りと気になっている距離感を書き分ける。",avoid:"相手の意図を決めつけない。",supporting_fact_ids:["F101"]},{phase:"next",action:"明日以降の3日間は自分の予定を通常どおり進める。",avoid:"相手の反応を予定の前提にしない。",supporting_fact_ids:["F101"]},{phase:"reassessment_condition",action:"具体的なやり取りや連絡の目的を確認できた時点で、連絡の必要性を見直す。",avoid:"時間が経ったことだけで連絡を決めない。",supporting_fact_ids:["F101"]}];
      plan.change_conditions=[{condition:"相手からの具体的な連絡があり、返答が必要だと確認できる。",resulting_direction:"reply_now",supporting_fact_ids:["F101"]}];
      plan.review_timing={when:"今後3日間で具体的なやり取りや連絡の目的を確認できた時点で見直す。",trigger_fact_ids:["F101"]};
      plan.material_unknowns=[{unknown_code:"other_person_intent_unknown",summary:"相手の意図や具体的なやり取りは確認できていない。",material_to:"decision"}];
      plan.model_generated_limitations=["具体的なやり取りが示されていないため、相手の意図や連絡の必要性は断定できない。"];
    }else if(q.stageId==="PB-05"){
      output=(await decision.transport.invoke(q)).output;
      const report=output.report_content;
      report.cover_line="今は連絡の判断を保留し、具体的なやり取りと気になる点を整理しましょう。";
      report.short_letter=["連絡の距離感をどうすべきか、迷っている状況なのですね。","相手との具体的なやり取りはまだ確認できていません。今は連絡を急がず、まず相談したいことを整理しましょう。"];
      report.decision_reason_summary="相手とのことを相談したいという希望は確認できます。具体的なやり取りを確認してから判断するため、今は連絡を保留する方向です。";
      report.observed_fact_commentary=[{fact_id:"F101",commentary:"相談したい相手がいることと、相手の意図が分かることは分けて整理できます。"}];
      report.possible_interpretations=["実際に交わした内容を確認することで、連絡の判断に必要な材料が見つかる場合があります。"];
      report.action_rationales=["今夜は判断を急がず、実際のやり取りと気になる距離感を書き分けます。","明日以降の3日間は自分の予定を進め、具体的な判断材料が増えたときに見直します。"];
      report.aftercare_commentary=["今夜は判断材料の整理にとどめ、明日以降の3日間は自分の予定を通常どおり進めます。具体的なやり取りや連絡の目的を確認できた時点で判断を見直せます。"];
      report.closing_lines=["今夜のうちに相手の意図まで決める必要はありません。"];
    }else return seed.transport.invoke(q);
    return{responseId:`b1-generic-${requests.length}`,returnedModel:q.model,output,usage:{inputTokens:100,cachedTokens:0,outputTokens:20,reasoningTokens:0},latencyMs:0};
  }};
  return{request,answer,transport,requests,provenance:{...seed.provenance,classification:"authored thin-context decision variant; existing material-concern clarification contract; no quality evidence"}};
}
