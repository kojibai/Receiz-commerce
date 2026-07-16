import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import {
  WILDS_AUDIO_ASSETS,
  requiredWildsAudioCoverage,
} from "../src/features/play/audio/wilds-audio-catalog.ts";

const root = process.cwd();
const publicAudioRoot = resolve(root, "public/audio/wilds");
const catalogOnly = process.argv.includes("--catalog-only");
const failures = [];

function fail(message) {
  failures.push(message);
}

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const ids = new Set();
const urls = new Set();
const counts = new Map();

for (const asset of WILDS_AUDIO_ASSETS) {
  if (ids.has(asset.id)) fail(`duplicate audio asset id: ${asset.id}`);
  ids.add(asset.id);
  counts.set(asset.bus, (counts.get(asset.bus) ?? 0) + 1);

  if (asset.production.prompt.trim().length < 24) fail(`production prompt too short: ${asset.id}`);
  if (asset.production.format !== "mp3_44100_128") fail(`unsupported runtime format: ${asset.id}`);
  if (!/^(?:original-authored|original-recording|open-source-generated)$/.test(asset.production.rights)) {
    fail(`unsupported audio rights: ${asset.id}`);
  }

  for (const variant of asset.variants) {
    if (!variant.url.startsWith("/audio/wilds/")) fail(`non-local audio URL: ${variant.url}`);
    if (urls.has(variant.url)) fail(`duplicate audio variant URL: ${variant.url}`);
    urls.add(variant.url);

    if (!catalogOnly) {
      const path = resolve(root, `public${variant.url}`);
      if (!existsSync(path)) fail(`missing audio file: ${relative(root, path)}`);
      if (asset.production.status !== "generated" || !asset.production.generatedAt) {
        fail(`asset is not marked generated: ${asset.id}`);
      }
    }
  }
}

for (const id of requiredWildsAudioCoverage()) {
  if (!ids.has(id)) fail(`missing required audio coverage: ${id}`);
}

if (!catalogOnly) {
  for (const path of files(publicAudioRoot)) {
    if (extname(path).toLowerCase() !== ".mp3") fail(`unsupported audio file: ${relative(root, path)}`);
    const url = `/${relative(resolve(root, "public"), path).split("\\").join("/")}`;
    if (!urls.has(url)) fail(`orphan audio file: ${relative(root, path)}`);
  }

  const forbidden = /createOscillator|speechSynthesis|SpeechSynthesisUtterance/;
  for (const path of files(resolve(root, "src/features/play"))) {
    if (![".ts", ".tsx"].includes(extname(path))) continue;
    if (forbidden.test(readFileSync(path, "utf8"))) fail(`forbidden fallback API: ${relative(root, path)}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const summary = [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))
  .map(([bus, count]) => `${bus}=${count}`)
  .join(" ");

console.log(`wilds audio ${catalogOnly ? "catalog" : "release"} validation passed: assets=${ids.size} ${summary}`);
