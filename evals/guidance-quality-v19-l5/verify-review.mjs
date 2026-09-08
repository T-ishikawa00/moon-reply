// Offline UI contract test; these authored examples never enter final generation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { writeBlindReview } from './final-qa/review.mjs';
import { publicSlot } from './final-qa/adapter.mjs';
const root='evals/guidance-quality-v19-l5';
const frozen=JSON.parse(fs.readFileSync(`${root}/expected-dispositions.json`,'utf8'));
const cases=frozen.cases.map(c=>({id:c.caseId,label:c.label,consultation:c.consultation,input:c.input}));
const input=cases.find(c=>c.id==='GQ-16').input;
const message={schemaVersion:'v19-l5-local-result-v1',finalState:'completed',answerMode:'message_only',stopFinding:null,decisionResult:null,
  messageResult:{plan:{original_text:input.optionalMessage,revised_text:'今日はありがとうございました。またお話しできたら嬉しいです。',meaning_preserved:true,edit_notes:['原文の意味を保っています。'],supporting_fact_ids:['F101']},
    content:{opening:'丁寧な気持ちが自然に伝わる文面です。',edit_reason:'お礼と、また話したいという気持ちをそのまま残しています。今の文面でも自然なので、大きく変える必要はありません。',closing:'ご自身の言葉らしさを大切にしてよいと思います。'}}};
const question={schemaVersion:'v19-l5-local-result-v1',finalState:'clarification',clarification:{question:'整えたい文章をそのまま教えてください'}};
const stopped={schemaVersion:'v19-l5-local-result-v1',finalState:'stopped',stopFinding:'SECRET_INTERNAL_TEST_CODE',evidence:{mustNotAppear:true}};
const records=[publicSlot({caseId:'GQ-16',anonymousVariantId:'A',result:message}),publicSlot({caseId:'GQ-16',anonymousVariantId:'B',result:stopped}),
  ...['A','B'].map(anonymousVariantId=>publicSlot({caseId:'GQ-17',anonymousVariantId,result:question}))];
await writeBlindReview({directory:`${root}/final-qa/ui-fake-only`,cases,records});
const html=fs.readFileSync(`${root}/final-qa/ui-fake-only/blind-review.html`,'utf8');
assert.equal((html.match(/data-case="GQ-/gu)??[]).length,12);
assert.equal((html.match(/class="output-label"/gu)??[]).length,24);
assert.ok(html.includes('整えた文面'));assert.ok(html.includes(message.messageResult.plan.revised_text));
assert.equal((html.match(/整えたい文章をそのまま教えてください/gu)??[]).length,2);
for(const forbidden of ['SECRET_INTERNAL_TEST_CODE','mustNotAppear','original_text','supporting_fact_ids','message_plan','promptHash','schemaVersion','V19-L5'])assert.ok(!html.includes(forbidden),forbidden);
assert.throws(()=>publicSlot({caseId:'GQ-16',anonymousVariantId:'A',result:{...message,stopFinding:'material'}}));
fs.writeFileSync(`${root}/review-verification.json`,JSON.stringify({status:'PASS',kind:'AUTHORED_OFFLINE_UI_ONLY',cases:12,slots:24,versionLeaks:0,stoppedInternalLeaks:0,realApiCalls:0},null,2)+'\n');
console.log('PASS: 12 cases / 24 anonymous slots, message completion, original clarification, no internal leakage. AUTHORED OFFLINE UI ONLY.');
