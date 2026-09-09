// Retained structural input plus authored external Provider output only.
// No model execution or new quality evidence is produced by this fixture.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { gratitudeCandidateAnalysis, validationPass } from "../../evals/guidance-quality-v19-l5/repair-fixtures.mjs";

export function create0036MessageFixture({missingOriginal=false}={}) {
  const files={};
  const read=file=>{const bytes=readFileSync(file);files[file]=createHash("sha256").update(bytes).digest("hex");return JSON.parse(bytes.toString("utf8"));};
  const inputs=read("evals/guidance-quality-v19-l4/expanded-12/inputs.json").cases;
  const caseId=missingOriginal?"GQ-17":"GQ-16",request=inputs.find(row=>row.id===caseId).input;
  const originalMessage=inputs.find(row=>row.id==="GQ-16").input.optionalMessage;
  const root="evals/blind-runs/2026-09-08-expanded-12-01/internal";
  const candidates=readdirSync(root,{withFileTypes:true}).filter(entry=>entry.isDirectory()&&/^[0-9a-f-]{36}$/u.test(entry.name)).map(entry=>entry.name).sort();
  const matches=candidates.filter(id=>JSON.parse(readFileSync(`${root}/${id}/session.json`,"utf8")).caseId===caseId);
  assert.equal(matches.length,2);
  const directory=`${root}/${matches[0]}`;read(`${directory}/session.json`);
  const file=readdirSync(directory).filter(name=>/^call-\d+-response\.json$/u.test(name)).sort().find(name=>JSON.parse(readFileSync(`${directory}/${name}`,"utf8")).stageId==="PB-01");
  const receipt=read(`${directory}/${file}`);assert.equal(receipt.status,"completed");
  const base=JSON.parse(receipt.outputText),requests=[];
  const transport={requests,async invoke(q){
    requests.push(structuredClone(q));let output;
    if(q.stageId==="PB-01")output={schema_version:"v19-l5-base-intent-v1",base_intake:structuredClone(base),request_intent:{message_task:"EDIT_EXISTING_MESSAGE",decision_requested:false,decision_explicitly_excluded:true,communication_purpose:"OTHER",source_excerpt:request.currentSituation,evidence_fact_ids:base.observed_facts.filter(f=>f.support==="explicit"&&f.source_refs.includes("input:current_situation")).map(f=>f.fact_id)}};
    else if(q.stageId==="PB-01C"){
      output=gratitudeCandidateAnalysis();output.candidate_style_profile.register="polite";output.candidate_communicative_intent.gratitude_strength="high";
      if(!missingOriginal){output.candidate_style_profile.invitation_style="tentative";Object.assign(output.candidate_communicative_intent,{invitation_presence:true,invitation_specificity:"tentative",affection_strength:"medium"});}
    }
    else if(q.stageId==="PB-02")output={classification:"normal_allowed",reason_codes:[],response_mode:"none",evidence_refs:[],ambiguity_present:false};
    else if(q.stageId==="PB-03")output={schema_version:"pipeline-schema-v3.0.0",acknowledged_eligibility:structuredClone(q.input.application_eligibility_expectation)};
    else if(q.stageId==="PB-04"){
      const original=q.input.user_supplied_optional_message;assert.equal(original,originalMessage);
      output={schema_version:"v19-l5-plan-v1",answer_mode:"message_only",decision_plan:null,message_plan:{original_text:original,revised_text:original,meaning_preserved:true,edit_notes:["お礼とまた話したい気持ちを保つ原文を、そのまま使えます。"],supporting_fact_ids:[q.input.base_structured_intake.observed_facts[0].fact_id]}};
    }
    else if(q.stageId==="PB-05")output={schema_version:"v19-l5-report-v1",answer_mode:"message_only",report_content:null,message_content:{opening:"文面の意味を保って、自然さを確認します。",edit_reason:"お礼の内容を残し、返信を要求する表現を足していません。",closing:"この表現で伝えたい内容を表せます。"}};
    else if(q.stageId==="PB-06")output=validationPass();
    else throw new Error(`B1_MESSAGE_UNEXPECTED_STAGE_${q.stageId}`);
    return{responseId:`b1-message-${requests.length}`,returnedModel:q.model,output,usage:{inputTokens:100,cachedTokens:0,outputTokens:20,reasoningTokens:0},latencyMs:0};
  }};
  return{request,originalMessage,transport,requests,provenance:{caseId,classification:"retained structural seed and authored offline outputs",sourceHashes:files}};
}
