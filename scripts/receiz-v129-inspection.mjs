import { checkReceizIntegration } from '@receiz/sdk/compiler';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The upstream regex scanner also reads its own published function inventory.
// Review only these exact finding/file pairs, and only while the files match npm bytes.
export function reviewPublishedInventoryFindings(findings, root = process.cwd()) {
  const expected = {
    compiler_import_requires_manual_migration: ['ai-skills/receiz-mcp-agent-skill/resources/offline-sealing.md','ai-skills/resources/offline-sealing.md'],
    deprecated_api: ['ai-skills/resources/public-capability-catalog.json','ai-skills/resources/sdk-public-functions.json','ai-skills/resources/sdk-public-functions.md','ai-skills/skills.json'],
    weak_state_used_as_proof_authority: ['ai-skills/resources/sdk-public-functions.json','ai-skills/skills.json'],
  };
  const reviewed = [], blocking = [];
  for (const finding of findings) {
    if (finding.disposition === 'satisfied') continue;
    const files = expected[finding.code];
    const matched = files && JSON.stringify([...finding.affectedFiles].sort()) === JSON.stringify([...files].sort()) && files.every(path => {
      try { return readFileSync(join(root,path)).equals(readFileSync(join(root,'node_modules/@receiz',path))); }
      catch { return false; }
    });
    (matched ? reviewed : blocking).push(finding);
  }
  return { reviewed, blocking };
}

export function reviewPublishedInventoryActions(actions, root = process.cwd()) {
  const reviewed = [], blocking = [];
  for (const action of actions) {
    const exact = action.code === 'migrate_compiler_import' && ['ai-skills/resources/offline-sealing.md','ai-skills/receiz-mcp-agent-skill/resources/offline-sealing.md'].includes(action.path) && action.disposition === 'user_decision_required' && action.risk === 'medium' && action.manualReview === true && action.destructive === false;
    let published = false;
    if (exact) {
      try { published = readFileSync(join(root,action.path)).equals(readFileSync(join(root,'node_modules/@receiz',action.path))); }
      catch { /* Missing exact package bytes remain blocking. */ }
    }
    (exact && published ? reviewed : blocking).push(action);
  }
  return {reviewed, blocking};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const upstream = await checkReceizIntegration({root,targetSdkVersion:'129.0.0'});
  const {reviewed,blocking} = reviewPublishedInventoryFindings(upstream.blockingFindings,root);
  const ok = blocking.length === 0 && (upstream.ok || reviewed.length > 0);
  console.log(JSON.stringify({schema:'receiz.repository.v129-integration-review.v1',ok,upstreamOk:upstream.ok,reviewedPublishedInventoryFindings:reviewed,blockingFindings:blocking},null,2));
  if (!ok) process.exitCode=1;
}
