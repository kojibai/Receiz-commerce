#!/usr/bin/env node
import { runReceizConformance, runReceizLivingSubjectConformanceV120 } from '@receiz/sdk/testing';
import { scanReceizV124Repository } from './receiz-v124-authority-scan.mjs';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const checks = [];
const check = (id,ok,detail) => checks.push({id,ok:Boolean(ok),detail});
for (const script of ['receiz-v126-migration-verify.mjs','receiz-v126-inspection.mjs']) {
  const run = spawnSync(process.execPath,[`scripts/${script}`],{encoding:'utf8',maxBuffer:64*1024*1024});
  check(script,run.status===0,run.status===0?'passed':run.stderr||run.stdout);
}
const scan=scanReceizV124Repository();check('authority-scan',scan.ok,scan.findings);
const read=path=>readFileSync(path,'utf8');
const runtime=read('src/lib/receiz/v124/production-runtime.ts');
const route=read('app/api/receiz/v124/runtime/route.ts');
const viewer=read('src/features/verify/MaterialProofViewer.tsx');
check('runtime-opaque-custody',(runtime.match(/new WeakMap/g)??[]).length>=6 && runtime.includes('RECEIZ_V124_SESSION_CUSTODY_REQUIRED') && runtime.includes('RECEIZ_V124_EXECUTION_HANDLE_CUSTODY_REQUIRED'));
check('qualification-before-stage',runtime.indexOf('await qualifyForMutation')>=0 && runtime.indexOf('await qualifyForMutation')<runtime.indexOf('adapter.v124.execution.stage(plan)'));
check('private-results-stay-on-host',runtime.includes('exactPrivateAdditionsLeaveTrustedHost: false') && !/privateAdditionsRef[\s\S]{0,160}\badditions\s*:/.test(runtime));
check('replay-requires-sealed-source',runtime.includes('candidateForCanonicalSeal') && runtime.includes('RECEIZ_V124_SEALED_REPLAY_SOURCE_REQUIRED'));
check('route-sanitizes-reports',route.includes('projectReceizV124Qualification') && !route.includes('actualGrantedScopes') && !route.includes('publicDependencyHeads'));
check('verify-before-play',viewer.indexOf('openVerifiedUrl(window.location.href)')>=0 && viewer.indexOf('openVerifiedUrl(window.location.href)')<viewer.indexOf('createPlayableObjectUrl(verified)') && viewer.includes('playable.revoke()'));
const tests=['receiz-v124-release-identity','receiz-v124-adapter','receiz-v124-production-runtime','receiz-v124-authority-scan','receiz-v124-developer-ui','receiz-v124-material-ui','receiz-v124-upstream-export-gap','receiz-app-contract','receiz-v123-proof-authority','receiz-v123-value-execution','receiz-v122-world','receiz-v126-inspection'];
const focused=spawnSync(process.execPath,['--import','tsx','--test',...tests.map(name=>`tests/${name}.test.ts`)],{encoding:'utf8',maxBuffer:64*1024*1024});
check('focused-regressions',focused.status===0,focused.status===0?'passed':focused.stderr||focused.stdout);
const conformance=await runReceizConformance();check('conformance',conformance.ok && conformance.summary.failed===0 && conformance.summary.networkCalls===0 && conformance.summary.dbCalls===0,conformance.summary);
const living=await runReceizLivingSubjectConformanceV120();check('living-subject-conformance',living.ok && living.summary.passed===19 && living.summary.failed===0 && living.summary.writesOnFailure===0,living.summary);
console.log(JSON.stringify({schema:'receiz.app.v126.release-lock.v1',ok:checks.every(check=>check.ok),packageVersion:'126.0.0',checks},null,2));
if(checks.some(check=>!check.ok))process.exitCode=1;
