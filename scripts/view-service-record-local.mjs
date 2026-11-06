import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createOfflineRuntime} from './remediation-offline-runtime.mjs';

// Local viewing helper only. No app routes, provider contracts or production build settings change.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.equal(fs.realpathSync(process.cwd()).toLowerCase(),fs.realpathSync(root).toLowerCase(),'run from this isolated worktree root');
const args=process.argv.slice(2);
assert.ok(args.every(a=>a==='--verify'||a.startsWith('--playwright=')),'supported: --verify --playwright=<installed module directory>');
const verify=args.includes('--verify');
const privateEnv=fs.readdirSync(root).filter(n=>/^\.env(?:$|\.(?:local|production|development|test)(?:\.local)?$)/.test(n));
assert.deepEqual(privateEnv,[],'isolated worktree must contain no real dotenv files');
const moduleDirectory=args.find(a=>a.startsWith('--playwright='))?.slice(13)??path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const require=createRequire(import.meta.url);
const {chromium}=require(moduleDirectory);
const chromeExecutable=[path.join(process.env.ProgramFiles??'C:/Program Files','Google/Chrome/Application/chrome.exe'),path.join(process.env.LOCALAPPDATA??'','Google/Chrome/Application/chrome.exe')].find(p=>fs.existsSync(p));
assert.ok(chromeExecutable,'Installed Google Chrome is required. This helper never downloads a browser.');
const output=path.join(root,'.local-review');
fs.mkdirSync(output,{recursive:true});
const attemptOutput=path.join(output,'viewing-result.json');
const netlog=path.join(output,'chromium-netlog.json');
const origin='http://127.0.0.1:3100';
const runtime=createOfflineRuntime();
runtime.env.NEXT_PUBLIC_APP_URL=origin;
const evidence={startedAt:new Date().toISOString(),mode:verify?'automated synthetic verification':'interactive dedicated browser',origin,env:'OS allowlist only; dotenv absent; all provider settings disabled',browserRequestsBlocked:[],webSocketsBlocked:0,routes:[],checks:{}};
const allowed=url=>{try{const u=new URL(url);return u.origin===origin;}catch{return false;}};
let browser,browserPid,build,buildClosed=true,server,serverClosed=false,stopping=false,stopPromise,serverOutputBytes=0;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function killOwnedTree(pid){
  if(!Number.isSafeInteger(pid)||pid<=0||pid===process.pid)return;
  try{if(process.platform==='win32')execFileSync('taskkill.exe',['/PID',String(pid),'/T','/F'],{env:runtime.env,stdio:'ignore',timeout:5000,windowsHide:true});else process.kill(pid,'SIGKILL');}catch{}
}
async function closeBrowser(){
  if(!browser)return;
  let closed=false;const done=browser.close().then(()=>{closed=true;}).catch(()=>{});
  await Promise.race([done,delay(3000)]);
  if(!closed){killOwnedTree(browserPid);await Promise.race([done,delay(2000)]);}
  evidence.browserStopped=!browser.isConnected();if(!evidence.browserStopped)process.exitCode=1;
}
function stop(){return stopPromise??=stopOwned();}
async function stopOwned(){
  stopping=true;
  if(build&&!buildClosed){killOwnedTree(build.pid);}
  if(server&&!serverClosed){
    const done=new Promise(r=>server.once('exit',r));server.kill();
    await Promise.race([done,delay(3000)]);
    if(!serverClosed){server.kill('SIGKILL');await Promise.race([done,delay(2000)]);}
    if(!serverClosed)process.exitCode=1;
  }
  await closeBrowser();
  try{runtime.assertNoExternalAttempts();evidence.serverExternalAttempts=0;}catch{evidence.serverExternalAttempts='blocked attempts present';process.exitCode=1;}
  if(fs.existsSync(netlog)){
    try{const log=JSON.parse(fs.readFileSync(netlog,'utf8'));const names=Object.fromEntries(Object.entries(log.constants.logEventTypes).map(([k,v])=>[v,k]));
      const connections=log.events.filter(e=>names[e.type]==='TCP_CONNECT_ATTEMPT').map(e=>({address:e.params?.address,result:e.params?.net_error,phase:e.phase}));
      const external=connections.filter(c=>c.address&&!/^(?:127\.|\[::1\]:|::1:)/.test(c.address));
      evidence.chromiumTransport={tcpConnectEvents:connections.length,nonLoopbackTcpConnectEvents:external.length,externalSuccessfulTcpObserved:external.filter(c=>c.phase===2&&(!c.result||c.result===0)).length,scope:'dedicated Chromium netlog; loopback-only failed proxy + DNS deny; no OS-wide packet capture'};
      if(external.length)process.exitCode=1;
    }catch{evidence.chromiumTransport={status:'UNKNOWN: netlog parsing failed'};process.exitCode=1;}
    finally{fs.unlinkSync(netlog);} // always remove owned raw transport data; retain aggregates only
  }
  evidence.finishedAt=new Date().toISOString();evidence.serverStopped=server?serverClosed:'not started';
  evidence.serverOutputBytes=serverOutputBytes; // no raw stdout/stderr retained
  fs.writeFileSync(attemptOutput,JSON.stringify(evidence,null,2)+'\n');
  console.log(`Viewing evidence: ${attemptOutput}`);
}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{process.exitCode=130;void stop();});
try{
  // Own the wrapper process tree so Ctrl+C can also stop its Next build child.
  build=spawn(process.execPath,['--input-type=module','-e',"import {buildOffline} from './scripts/remediation-offline-runtime.mjs'; await buildOffline();"],{cwd:root,env:runtime.env,stdio:'inherit',windowsHide:true});
  buildClosed=false;
  const buildStatus=await new Promise((resolve,reject)=>{build.once('error',reject);build.once('exit',code=>{buildClosed=true;resolve(code);});});
  assert.equal(buildStatus,0,'guarded build failed');
  assert.ok(!stopping,'viewing cancelled during build');
  // Verify port ownership before launch: never attach to another local server.
  const net=await import('node:net');
  await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(3100,'127.0.0.1',()=>probe.close(resolve));});
  assert.ok(!stopping,'viewing cancelled before server launch');
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3100'],{cwd:root,env:runtime.env,stdio:['ignore','pipe','pipe'],windowsHide:true});
  server.once('exit',()=>{serverClosed=true;});
  server.once('error',()=>{serverClosed=true;});
  for(const stream of [server.stdout,server.stderr])stream.on('data',c=>{serverOutputBytes+=c.length;});
  let ready=false;
  for(let i=0;i<100;i++){if(serverClosed)throw new Error('local server exited before ready');try{const r=await fetch(origin,{signal:AbortSignal.timeout(500)});if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
  assert.ok(ready,'loopback server readiness timeout');
  assert.ok(!stopping,'viewing cancelled during readiness');
  browser=await chromium.launch({channel:'chrome',executablePath:chromeExecutable,headless:verify,env:runtime.env,args:[
    '--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--disable-default-apps','--disable-extensions','--disable-quic',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--proxy-server=http://127.0.0.1:9','--proxy-bypass-list=127.0.0.1;localhost;[::1]',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost',
    `--log-net-log=${netlog}`,
  ]});
  const browserSession=await browser.newBrowserCDPSession();
  browserPid=(await browserSession.send('SystemInfo.getProcessInfo')).processInfo.find(p=>p.type==='browser')?.id;
  await browserSession.detach();
  if(stopping){await closeBrowser();throw new Error('viewing cancelled during browser launch');}
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',acceptDownloads:false,permissions:[]});
  await context.route('**/*',route=>{
    if(allowed(route.request().url()))return route.continue();
    let host='[unparseable]';try{host=new URL(route.request().url()).hostname;}catch{}
    evidence.browserRequestsBlocked.push({host,kind:route.request().resourceType()});return route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/,socket=>{evidence.webSocketsBlocked++;socket.close();});
  const page=await context.newPage();
  context.on('page',p=>{if(p!==page)void p.close();});
  await page.goto(origin+'/sample-report',{waitUntil:'networkidle'});
  console.log(`Dedicated local viewing: ${origin}/sample-report (close browser or Ctrl+C to stop)`);
  if(verify){
    evidence.checks.initialWait=await page.locator('[data-sample-case="wait"]').getAttribute('aria-pressed')==='true';
    await page.locator('[data-sample-case="send"]').click();
    evidence.checks.sendHeading=await page.locator('#sample-section-04').innerText()==='文面の温度';
    await page.locator('[data-sample-case="wait"]').click();
    evidence.checks.waitReturn=await page.locator('[data-sample-case="wait"]').getAttribute('aria-pressed')==='true';
    await page.screenshot({path:path.join(output,'sample-desktop.png')});
    await page.setViewportSize({width:390,height:844});
    evidence.checks.mobileNoHorizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
    await page.screenshot({path:path.join(output,'sample-mobile.png')});
    await page.locator('[data-sample-cta="hero"]').click();await page.waitForURL(origin+'/request');
    await page.getByRole('checkbox',{name:'私は18歳以上です'}).check();
    evidence.checks.adultCheckbox=await page.getByRole('checkbox',{name:'私は18歳以上です'}).isChecked();
    await page.getByRole('button',{name:'鑑定前の確認へ',exact:true}).click();
    evidence.checks.requiredValidation=await page.locator('.request-error-summary').isVisible();
    const fields=page.locator('textarea');if(await fields.count())await fields.first().fill('これはローカル表示確認専用の架空入力です。実在する人物や相談を含みません。');
    await page.getByRole('radio',{name:'付き合う前',exact:true}).check();
    await page.getByRole('checkbox',{name:'相手との関係を整理したい',exact:true}).check();
    await page.getByRole('button',{name:'鑑定前の確認へ',exact:true}).click();
    evidence.checks.safetyStepReached=await page.locator('#request-phase-2').isVisible();
    await page.getByRole('button',{name:'相談内容へ戻る',exact:true}).click();
    evidence.checks.backPreservesSyntheticInput=(await page.locator('#currentSituation').inputValue()).includes('ローカル表示確認専用');
    await page.screenshot({path:path.join(output,'request-mobile.png')});
    evidence.checks.gaScriptCount=await page.locator('script[src*="googletagmanager"]').count();
    for(const route of ['/','/request','/review/account','/review/purchase/confirmation/normal-001','/review/purchase/trust/preparing','/review/purchase/trust/payment-not-completed','/review/purchase/trust/temporary-problem','/review/result/result-normal-001','/review/error/unavailable-report']){
      const response=await page.goto(origin+route,{waitUntil:'networkidle'});const text=await page.locator('body').innerText();
      evidence.routes.push({route,status:response?.status(),bodyNonempty:text.length>100});
    }
    const actualBlocked=evidence.browserRequestsBlocked.length;
    evidence.checks.externalGuardSelfTestBlocked=await page.evaluate(async()=>{try{await fetch('https://example.invalid/moon-reply-offline-guard-self-test');return false;}catch{return true;}});
    evidence.productBrowserBlockedAttempts=actualBlocked;
    evidence.guardSelfTestBlockedAttempts=evidence.browserRequestsBlocked.length-actualBlocked;
    assert.ok(evidence.checks.initialWait&&evidence.checks.sendHeading&&evidence.checks.waitReturn&&evidence.checks.mobileNoHorizontalOverflow&&evidence.checks.adultCheckbox&&evidence.checks.requiredValidation&&evidence.checks.safetyStepReached&&evidence.checks.backPreservesSyntheticInput&&evidence.checks.gaScriptCount===0&&evidence.checks.externalGuardSelfTestBlocked,'viewing checks failed');
    assert.ok(evidence.routes.every(r=>r.status===200&&r.bodyNonempty),'review route failed');
    evidence.verification='PASS';
  }else await new Promise(resolve=>browser.once('disconnected',resolve));
}catch(error){evidence.verification='FAIL';evidence.error=error.message;process.exitCode=1;}
finally{await stop();}
