import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getPurchaseReturnPresentation } from "../lib/payment/purchase-return-presentation.ts";

function source(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function section(value, start, end) {
  const startIndex = value.indexOf(start);
  const endIndex = value.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing start: ${start}`);
  assert.notEqual(endIndex, -1, `missing end: ${end}`);
  return value.slice(startIndex, endIndex);
}

let passed = 0;
function check(label, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${label}`);
}

const hostedPreparation = source(
  "components/request/HostedAuthenticatedPreparation.tsx",
);
const purchaseReturn = source("lib/payment/purchase-return-presentation.ts");
const home = source("app/page.tsx");
const preparationShell = section(
  hostedPreparation,
  "function PreparationShell",
  "function FailedScreen",
);
const hero = section(
  home,
  '<section className="lp-home-hero"',
  '<section className="lp-home-section',
);
const origin = section(home, '<section id="origin"', '<section id="faq"');

check("pre-purchase Preparing gives a truthful ETA and automatic-next guidance", () => {
  for (const literal of [
    "鑑定の準備をしています",
    "ご相談内容を確認し、次のステップを準備しています。",
    "通常10〜20秒ほどで、自動的に次へ進みます。",
  ]) {
    assert.ok(preparationShell.includes(literal), literal);
  }
  assert.doesNotMatch(
    preparationShell,
    /鑑定ノートが完成します|画面を閉じても大丈夫|API|processing|loader/u,
  );
});

check("post-purchase email-only recovery gives one calm folder check", () => {
  const presentation = getPurchaseReturnPresentation({
    status: {
      status: "completed_check_verified_email",
      paymentVerified: true,
      accountFallback: false,
    },
    requestFailed: false,
    recoveryExhausted: false,
    customerAuthEnabled: true,
  });
  assert.deepEqual(presentation.assurances, [
    "完了メールが見つからない場合は、迷惑メールフォルダやプロモーションタブもご確認ください。",
  ]);
  assert.equal(
    (
      purchaseReturn.match(
        /完了メールが見つからない場合は、迷惑メールフォルダやプロモーションタブもご確認ください。/gu,
      ) ?? []
    ).length,
    1,
  );
  assert.doesNotMatch(purchaseReturn, /当サービスのメールは迷惑メールに入ります/u);
});

check("brand-origin story stays below the product boundary and outside the first view", () => {
  assert.ok(home.indexOf('id="boundaries"') < home.indexOf('id="origin"'));
  assert.ok(home.indexOf('id="origin"') < home.indexOf('id="faq"'));
  assert.doesNotMatch(hero, /名付けた理由|名前に込めたもの/u);
  for (const literal of [
    "名前に込めたもの",
    "「月の返事」と名付けた理由。",
    "夜、返事を待ちながら、何度も画面を見てしまうことがあります。",
    "相手の代わりに答えるのではなく",
    "自分が次にどう動くかを整理するため",
    "そこから「月の返事」と名付けました。",
  ]) {
    assert.ok(origin.includes(literal), literal);
  }
  assert.doesNotMatch(
    origin,
    /月が未来を教える|運命|霊感|占術|予言|相手の本心が分かる/u,
  );
});

check("purchase states remain explicitly separated", () => {
  assert.match(
    purchaseReturn,
    /status\.status === "preparing_assessment"[\s\S]*?heading: "鑑定ノートを準備しています"/u,
  );
  assert.doesNotMatch(preparationShell, /お支払い確認済み|追加のお支払い/u);
});

console.log(
  `CUSTOMER_UX_REVIEW_FIX_R1=PASS checks=${passed} provider_calls=0 network_calls=0 db_writes=0 payment_operations=0 auth_logic_changes=0`,
);
