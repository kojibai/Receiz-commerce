import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "public/audio/wilds/hearttree/manifest.json");
const ledgerPath = join(root, "assets-src/audio/hearttree/licenses.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const errors = [];

const requiredLoops = new Set(["ambience.exterior", "ambience.interior", ...["exploration", "mystery", "danger", "mastery", "boss", "victory", "extraction", "memorial"].map((role) => `music.${role}`), ...["grove", "spark", "tide", "stone"].map((role) => `motif.${role}`)]);
const requiredEffects = ["movement.movement-leaves", "root.root-surge", "leaf.leaf-rustle", "wood.wood-break", "stone.stone-strike", "water.water-cast", "energy.energy-cast", "mechanism.mechanism-turn", ...["grove", "spark", "tide", "stone"].map((role) => `ability.ability-${role}`), "guard.guard-impact", "dodge.dodge-rush", "switch.switch-card", "impact.heavy-impact", "injury.injury-hit", "reward.reward-awaken", "extraction.extraction-open", "death.death-seal", "ui.ui-confirm", "ui.ui-cancel", "ui.ui-error", "boss.boss-telegraph"];
const required = new Set([...requiredLoops, ...requiredEffects].map((id) => `hearttree.${id}`));
const ids = new Set();
const sources = new Map(ledger.sources.map((source) => [source.id, source]));

for (const source of ledger.sources) {
  if (source.license !== "CC0-1.0") errors.push(`${source.id}: license must be CC0-1.0`);
  if (!source.sourceUrl?.startsWith("https://freesound.org/") || !source.licenseUrl?.startsWith("https://creativecommons.org/publicdomain/zero/")) errors.push(`${source.id}: rights evidence is incomplete`);
  if (!existsSync(join(root, "assets-src/audio/hearttree", source.file))) errors.push(`${source.id}: source file is missing`);
}

for (const asset of manifest.assets) {
  if (ids.has(asset.id)) errors.push(`${asset.id}: duplicate id`);
  ids.add(asset.id);
  if (asset.status !== "generated" || asset.provider !== "open-source-offline") errors.push(`${asset.id}: not a completed local render`);
  if (asset.license !== "CC0-1.0" || !asset.source.length || asset.source.some((id) => !sources.has(id))) errors.push(`${asset.id}: source/license chain is invalid`);
  if (!Number.isFinite(asset.durationSeconds) || asset.durationSeconds <= 0) errors.push(`${asset.id}: duration is invalid`);
  if (!Number.isFinite(asset.truePeakDb) || asset.truePeakDb > -1) errors.push(`${asset.id}: true peak exceeds -1 dBFS (${asset.truePeakDb})`);
  if (asset.group === "music" && (asset.integratedLufs < -18 || asset.integratedLufs > -14)) errors.push(`${asset.id}: music loudness outside -18..-14 LUFS`);
  if (asset.group === "ambience" && (asset.integratedLufs < -22 || asset.integratedLufs > -18)) errors.push(`${asset.id}: ambience loudness outside -22..-18 LUFS`);
  const runtimePath = join(root, "public", asset.file);
  const masterPath = join(root, asset.archivalMaster);
  if (!existsSync(runtimePath) || !existsSync(masterPath)) errors.push(`${asset.id}: runtime or archival master is missing`);
  else if (createHash("sha256").update(readFileSync(runtimePath)).digest("hex") !== asset.sha256) errors.push(`${asset.id}: checksum mismatch`);
  if (requiredLoops.has(asset.id.slice("hearttree.".length)) && (asset.loopStart !== 0 || asset.loopEnd !== asset.durationSeconds)) errors.push(`${asset.id}: loop points are invalid`);
  if (/\btone\b|oscillator|\bsine\b|placeholder/i.test(JSON.stringify(asset))) errors.push(`${asset.id}: prohibited synthetic placeholder marker`);
}

for (const id of required) if (!ids.has(id)) errors.push(`${id}: required asset is missing`);
if (manifest.assets.length !== required.size) errors.push(`expected ${required.size} assets, received ${manifest.assets.length}`);
if (!/No synthetic or browser voice/.test(manifest.dialoguePolicy)) errors.push("human dialogue policy is missing");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${manifest.assets.length} Hearttree assets and ${ledger.sources.length} CC0 source records.`);
