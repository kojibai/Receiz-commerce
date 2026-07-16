import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const root = process.cwd();
const outDir = join(root, "public/audio/wilds/hearttree");
const licenseLedger = JSON.parse(readFileSync(join(root, "assets-src/audio/hearttree/licenses.json"), "utf8"));
const sources = new Map(licenseLedger.sources.map((source) => [source.id, source]));

const loops = [
  ["ambience-exterior", "ambience", "exterior", ["freesound-687054", "freesound-331047", "freesound-345629", "freesound-424250"]],
  ["ambience-interior", "ambience", "interior", ["freesound-687054", "freesound-331047", "freesound-345629", "freesound-424250"]],
  ...["exploration", "mystery", "danger", "mastery", "boss", "victory", "extraction", "memorial"].map((name) => [`music-${name}`, "music", name, ["freesound-687054", "freesound-331047", "freesound-345629", "freesound-424250"]]),
  ...["grove", "spark", "tide", "stone"].map((name) => [`motif-${name}`, "motif", name, ["freesound-687054", "freesound-331047", "freesound-345629", "freesound-424250"]])
];

const effects = [
  ["movement-leaves", "movement", ["freesound-191454"]], ["root-surge", "root", ["freesound-269717"]],
  ["leaf-rustle", "leaf", ["freesound-191454"]], ["wood-break", "wood", ["freesound-269717"]],
  ["stone-strike", "stone", ["freesound-431019"]], ["water-cast", "water", ["freesound-381243"]],
  ["energy-cast", "energy", ["freesound-424250"]], ["mechanism-turn", "mechanism", ["freesound-269717"]],
  ["ability-grove", "ability", ["freesound-331047"]], ["ability-spark", "ability", ["freesound-424250"]],
  ["ability-tide", "ability", ["freesound-381243"]], ["ability-stone", "ability", ["freesound-431019"]],
  ["guard-impact", "guard", ["freesound-269717", "freesound-431019"]], ["dodge-rush", "dodge", ["freesound-191454"]],
  ["switch-card", "switch", ["freesound-424250"]], ["heavy-impact", "impact", ["freesound-345629", "freesound-269717"]],
  ["injury-hit", "injury", ["freesound-431019"]], ["reward-awaken", "reward", ["freesound-331047"]],
  ["extraction-open", "extraction", ["freesound-424250"]], ["death-seal", "death", ["freesound-345629", "freesound-269717"]],
  ["ui-confirm", "ui", ["freesound-331047"]], ["ui-cancel", "ui", ["freesound-269717"]],
  ["ui-error", "ui", ["freesound-431019"]], ["boss-telegraph", "boss", ["freesound-345629", "freesound-424250"]]
];

function measured(path) {
  const durationSeconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path], { encoding: "utf8" }).trim());
  const result = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", path, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`hearttree_audio_measure_failed:${basename(path)}:${result.stderr}`);
  const stderr = result.stderr;
  const loudness = [...stderr.matchAll(/I:\s+(-?\d+(?:\.\d+)?) LUFS/g)].at(-1)?.[1];
  const peak = [...stderr.matchAll(/Peak:\s+(-?\d+(?:\.\d+)?) dBFS/g)].at(-1)?.[1];
  if (!Number.isFinite(durationSeconds) || loudness === undefined || peak === undefined) throw new Error(`hearttree_audio_measure_failed:${basename(path)}`);
  return { durationSeconds: Number(durationSeconds.toFixed(6)), integratedLufs: Number(loudness), truePeakDb: Number(peak) };
}

function entry(value, loop) {
  const [name, group] = value;
  const role = loop ? value[2] : name;
  const sourceIds = loop ? value[3] : value[2];
  const path = join(outDir, `${name}.mp3`);
  const data = readFileSync(path);
  const values = measured(path);
  const sourceRows = sourceIds.map((id) => sources.get(id));
  return {
    id: `hearttree.${group}.${role}`,
    group,
    role,
    file: `/audio/wilds/hearttree/${name}.mp3`,
    archivalMaster: `assets-src/audio/hearttree/master/${name}.wav`,
    source: sourceIds,
    author: [...new Set(sourceRows.map((source) => source.author))].join(", "),
    license: "CC0-1.0",
    edits: "Offline edit from real recorded material: trim, layer, pitch-transpose, filter, fade/crossfade, loudness master, 44.1 kHz export.",
    provider: "open-source-offline",
    status: "generated",
    format: "mp3_44100_128",
    durationSeconds: values.durationSeconds,
    integratedLufs: values.integratedLufs,
    truePeakDb: values.truePeakDb,
    loopStart: loop ? 0 : null,
    loopEnd: loop ? values.durationSeconds : null,
    sha256: createHash("sha256").update(data).digest("hex")
  };
}

const manifest = {
  schema: "receiz.wilds.hearttree_audio_manifest.v1",
  generatedAt: "2026-07-16T20:00:00.000Z",
  sampleRate: 44100,
  runtimeBitrateKbps: 128,
  sourcePolicy: "original-or-license-audited-cc0-only",
  dialoguePolicy: "No synthetic or browser voice. Human dialogue requires performed recordings, releases, and rights evidence.",
  assets: [...loops.map((value) => entry(value, true)), ...effects.map((value) => entry(value, false))]
};

writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated Hearttree manifest for ${manifest.assets.length} local assets.`);
