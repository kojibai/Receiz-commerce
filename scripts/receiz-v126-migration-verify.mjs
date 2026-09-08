#!/usr/bin/env node
import { RECEIZ_SDK_VERSION, RECEIZ_RELEASE_VERSION, RECEIZ_RULESET_VERSION, RECEIZ_CURRENT_REGISTRY_DIGEST, digestReceizConstitution, loadReceizCurrentRegistry, validateReceizConstitutionRegistry, describeReceizCapabilities } from '@receiz/sdk';
import { reviewPublishedInventoryFindings } from './receiz-v126-inspection.mjs';
import { RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX as matrix, RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST as matrixDigest, generateReceizFrameworkFiles, defineReceizApp } from '@receiz/sdk/compiler';
import { RECEIZ_MCP_TOOLS, RECEIZ_V123_MCP_TOOL_NAMES, RECEIZ_V124_MCP_TOOL_NAMES } from '@receiz/mcp-server';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const root = resolve(process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : '.');
const json = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
const VERSION = '126.0.0';
const REGISTRY = '80137c2e6f294050ef36ff75e4daac15c7790b7f04d9a91fab9d1970fa3c0b09';
const MATRIX = '42c7f0924df91b4ba11c1b891fee2b92abb509430a86b030735c23d055e67949';
const APP_REGISTRY = 'a7873cde93d169c21900d730bd2482a83455c79c4ed046a609b607138fe194c0';
const RANGE = '>=126.0.0 <127.0.0';
const checks = [];
const check = (id, ok) => checks.push({ id, ok: Boolean(ok) });
const pkg = json('package.json'), app = json('receiz.app.json'), generated = json('receiz.generated.json'), registry = json('receiz.constitution.json'), skills = json('ai-skills/skills.json');
const attestation = json('receiz.migration.v124.0.3-v126.0.0.json');
const lock = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
for (const name of ['sdk', 'mcp-server', 'ai-skills']) {
  const coordinate = `@receiz/${name}`;
  check(`package:${coordinate}`, pkg.dependencies[coordinate] === VERSION && json(`node_modules/${coordinate}/package.json`).version === VERSION && pkg.pnpm?.overrides?.[coordinate] === undefined);
  const integrity = attestation.publicPackageIntegrities[coordinate];
  const section = lock.split(`  '${coordinate}@${VERSION}':`)[1]?.split('\n\n')[0];
  check(`integrity:${coordinate}`, typeof integrity === 'string' && section?.includes(`integrity: ${integrity}`));
}
check('release-identity', RECEIZ_SDK_VERSION === VERSION && RECEIZ_RELEASE_VERSION === VERSION && RECEIZ_RULESET_VERSION === VERSION);
check('canonical-registry', RECEIZ_CURRENT_REGISTRY_DIGEST === REGISTRY && await digestReceizConstitution(await loadReceizCurrentRegistry()) === REGISTRY);
check('app-registry-chain', validateReceizConstitutionRegistry(registry).ok && registry.version === VERSION && registry.previousRegistryDigest === REGISTRY && await digestReceizConstitution(registry) === APP_REGISTRY);
for (const id of ['v124.representation-never-outranks-source','v124.json-cannot-mint-runtime-custody','v124.qualification-before-mutation','v124.unknown-outcome-resolve-before-retry','v124.replay-candidate-must-be-sealed','v124.private-additions-trusted-host-only']) check(`law:${id}`, registry.laws.some(law => law.id === id));
check('matrix', matrix.length === 60 && matrixDigest === MATRIX && JSON.stringify(app.operations) === JSON.stringify(matrix) && JSON.stringify(generated.operationAuthorityMatrix) === JSON.stringify(matrix));
check('compatibility', generated.compatibleSdkRange === RANGE && describeReceizCapabilities().packageCompatibility.sdk === RANGE);
for (const file of generateReceizFrameworkFiles(defineReceizApp(app)).filter(file => ['receiz/receiz.boundaries.ts','receiz/receiz.capabilities.json'].includes(file.path))) check(`generated:${file.path}`, readFileSync(join(root,file.path),'utf8') === file.content);
const names = new Set(RECEIZ_MCP_TOOLS.map(tool => tool.name));
check('mcp-inventory', names.size === 221 && RECEIZ_MCP_TOOLS.length === 221 && RECEIZ_V124_MCP_TOOL_NAMES.length === 26 && [...RECEIZ_V123_MCP_TOOL_NAMES,...RECEIZ_V124_MCP_TOOL_NAMES,'receiz_material_url_open','receiz_sealed_kai_moment'].every(name => names.has(name)));
check('registry-law-ids-unique', new Set(registry.laws.map(law => law.id)).size === registry.laws.length);
check('skills-enumerated-counts', skills.skills.length === 43 && skills.skills.filter(skill => skill.manifest).length === 37 && skills.skills.filter(skill => skill.agent).length === 34);
check('skills-identity', skills.schema === 'receiz.ai-skills-index.v126' && skills.version === VERSION && skills.rulesetVersion === VERSION && skills.registryDigest === REGISTRY && skills.operationMatrixDigest === MATRIX && skills.counts.skills === 42 && skills.counts.manifests === 36 && skills.counts.openaiAgentPrompts === 33);
const treeDigest = path => {
  const hash = createHash('sha256');
  const visit = (dir, prefix = '') => readdirSync(dir).sort().forEach(name => {
    if (name === 'package.json') return;
    const file = join(dir,name), relative = `${prefix}${name}`;
    if (statSync(file).isDirectory()) visit(file,`${relative}/`);
    else hash.update(relative).update('\0').update(readFileSync(file)).update('\0');
  });
  visit(join(root,path)); return hash.digest('hex');
};
check('skills-byte-parity', treeDigest('ai-skills') === treeDigest('node_modules/@receiz/ai-skills'));
for (const skill of skills.skills.filter(skill => skill.manifest)) {
  const manifest = json(`ai-skills/${skill.manifest}`);
  check(`skill:${skill.name}`, manifest.version === VERSION && manifest.requires.sdk === RANGE && manifest.requires.registryDigest === REGISTRY && manifest.requires.operationMatrixDigest === MATRIX);
}
const inspection = spawnSync(process.execPath,[join(root,'node_modules/@receiz/sdk/dist/cli.js'),'app','upgrade','--root',root,'--target',VERSION,'--json'],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
const plan = inspection.status === 0 ? JSON.parse(inspection.stdout) : null;
check('official-upgrade-inspection', plan?.targetVersion === VERSION && plan.actions.length === 0 && reviewPublishedInventoryFindings(plan.findings,root).blocking.length === 0);
check('migration-history', attestation.historyRewritten === false && attestation.productionDataMigrated === false && attestation.appRegistryDigest === APP_REGISTRY);
console.log(JSON.stringify({schema:'receiz.repository.v126-migration-verification.v1',ok:checks.every(check=>check.ok),historyRewritten:false,packageVersion:VERSION,registryDigest:REGISTRY,operationMatrixDigest:MATRIX,checks},null,2));
if (checks.some(check=>!check.ok)) process.exitCode=1;
