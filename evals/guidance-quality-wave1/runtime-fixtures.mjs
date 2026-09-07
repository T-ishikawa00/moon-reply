import { readFileSync } from "node:fs";
import { AssessmentApplication } from "../../lib/assessment/runtime/application.ts";
import { FakeAssessmentRepository, FakeAiStageTransport } from "../../lib/assessment/runtime/fakes.ts";
import { loadGuidanceQualityWave1StageCatalog } from "../../lib/assessment/runtime/guidance-stage-catalog-v1.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { buildEffectiveDecisionPolicyV3 } from "../../lib/assessment/runtime/effective-decision-policy-v3.ts";
import { buildEffectiveDecisionPolicyV2 } from "../../lib/assessment/runtime/effective-decision-policy-v2.ts";
import { makeAbFixture } from "./ab-fixtures.mjs";
const historical=JSON.parse(readFileSync(new URL("../runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-executions/2026-08-19-case5-polite-draft-v17-fcd54a0c/v17-stage-attempt-results-v1.json",import.meta.url),"utf8"));
const shape=id=>structuredClone(historical.stage_attempts.find(x=>x.stageId===id&&x.attemptNumber===1).outputJson);
export const FIXTURE_PROVENANCE="Synthetic hand-authored stage outputs. PB06 is a fake verdict; these checks prove wiring/contracts only. No real response-quality evidence.";
const copy={
 "GQ-28":["今日のお礼を短く一通送る。","会ったことへの感謝は、相手の好意が分からなくても伝えられます。","今日は一緒に食事できてうれしかったです。ありがとう。"],
 "GQ-05":["相手が断れる形で、一度だけお茶に誘う。","初めての誘いなので、都合を尋ねる形なら選びやすくなります。","よかったら今度お茶しませんか。都合が合いそうなときに。"],
 "GQ-24":["お礼を受け取ったことを短く返信する。","相手からのお礼に応じる目的があり、予定の用件を足す必要はありません。","ありがとう。またね。"],
 "GQ-03":["相手の質問に、決まっている範囲で返信する。","相手が週末の予定を尋ねているので、返信は催促には当たりません。","週末の予定、確認して返すね。"],
 "GQ-29":["追加で送らず、相手の返信を待つ。","こちらの質問が未返信のため、同じ確認を重ねる必要はありません。",null],
};
export function makeRuntimeFixture(caseId,{candidate=true,detailed=false}={}) {
 const fixture=makeAbFixture(caseId); const p=(candidate?buildEffectiveDecisionPolicyV3:buildEffectiveDecisionPolicyV2)({authority:fixture.authority,candidateEnvelope:fixture.candidateEnvelope}).policy;
 const [action,reason,draftText]=copy[caseId];const sending=["send_now","reply_now"].includes(p.allowed_decisions[0]);
 const plan=shape("PB-04"); Object.assign(plan,{
  schema_version:candidate?"guidance-decision-plan-v1":"pipeline-schema-v2.0.0",selected_decision:p.allowed_decisions[0],decision_reason_fact_ids:["F001"],possible_interpretations:[],pre_action_check:{check:"今回伝えたい内容に限る。",supporting_fact_ids:["F001"]},
  actions_to_take:[action],actions_to_avoid:candidate?[]:["返事を求める連投はしない。"],aftercare_plan:[],change_conditions:[],material_unknowns:[],
  review_timing:{when:"相手から連絡や新しい事情があった時に見直す。",trigger_fact_ids:["F001"]},model_generated_limitations:[],
  recommended_message_draft:sending?{text:draftText,policy:"required_now",use_timing:"now"}:null,
 });
 if(sending){plan.message_draft_edit_metadata.source_status="generated_without_candidate";plan.message_draft_edit_metadata.preserved_meaning=false;plan.message_draft_edit_metadata.change_summary="相談の目的に合わせて、新しく作った文面です。";}else plan.message_draft_edit_metadata=null;
 const content=shape("PB-05");Object.assign(content,{
  cover_line:sending?"今できる、無理のない一歩を。":"今は、追加の連絡を控える方向です。",short_letter:["書かれた状況をもとに、今回の行動を整理します。"],decision_reason_summary:reason,
  relationship_summary:null,observed_fact_commentary:[{fact_id:"F001",commentary:"この相談に書かれたやり取りが、今回の判断の手がかりです。"}],possible_interpretations:[],anxiety_reframe:[],message_temperature:null,
  action_rationales:[],message_draft_context:sending?"これは原文の引用や添削ではなく、今回の用途に合わせた新しい文面案です。":null,aftercare_commentary:[],change_condition_commentary:[],closing_lines:["相手の気持ちの結論を出さず、今回の用件を区切りにできます。"],
 });
 if(detailed){
  fixture.request.requestedTopics.push("next_three_days");
  plan.aftercare_plan=[
   {phase:"tonight",action:sending?"送信後は補足を重ねず、やり取りを一区切りにする。":"今夜は追加の送信を控える。",avoid:"同じ用件を続けて送らない。",supporting_fact_ids:["F001"]},
   {phase:"next",action:"翌日は新しい連絡があるかを踏まえて対応を考える。",avoid:"時間が経っただけで送ると決めない。",supporting_fact_ids:["F001"]},
   {phase:"reassessment_condition",action:"三日目も、新しい事情がなければ気持ちを決めつけず現状を維持する。",avoid:"返事の有無で好意を断定しない。",supporting_fact_ids:["F001"]}];
  content.aftercare_commentary=["今夜の行動とその後の二日間を分け、相手から連絡があれば内容に応じて見直します。"];
 }
 fixture.outputs={...fixture.outputs,"PB-04":plan,"PB-05":content,"PB-06":shape("PB-06")};return fixture;
}
export async function runFixture(fixture,{candidate=true,catalog:provided,outputSequence,failAtStage}={}){
 const catalog=provided??await(candidate?loadGuidanceQualityWave1StageCatalog():loadM2P4FinalProductRecoveryRuntimeStageCatalog());
 const repository=new FakeAssessmentRepository();const transport=new FakeAiStageTransport({outputs:fixture.outputs,outputSequence,failAtStage});let n=0;
 const application=new AssessmentApplication({repository,transport,model:"gpt-5.6-luna",definitions:catalog.definitions,promptBundleVersion:catalog.promptBundleVersion,schemaSetVersion:catalog.schemaSetVersion,timeZone:"Asia/Tokyo",now:()=>"2026-09-07T10:00:00.000Z",uuid:()=>"00000000-0000-4000-8000-"+String(++n).padStart(12,"0")});
 const result=await application.submit(fixture.request,fixture.caseId);return {result,repository,transport,catalog};
}
