import { creatureForm } from "./creature-catalog";
import {
  canonicalPortableCardJson,
  sha256PortableBasis,
  verifyPortableCard,
  type PortableCardAsset
} from "./portable-card";

export type PortableCardPngProof = {
  schema: "receiz.wilds_png_proof.v1";
  imageDigest: string;
  asset: PortableCardAsset;
};

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const PROOF_CHUNK_TYPE = "rzCd";

function xml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function statRow(label: string, value: number, x: number, color: string) {
  return `<g transform="translate(${x} 0)"><rect width="116" height="70" rx="18" fill="#071c26" fill-opacity=".88" stroke="${xml(color)}" stroke-opacity=".55"/><text x="58" y="26" text-anchor="middle" fill="#8da9b3" font-family="system-ui,sans-serif" font-size="15" font-weight="700" letter-spacing="1.5">${label}</text><text x="58" y="55" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="27" font-weight="850">${value}</text></g>`;
}

function creatureMark(body: string, detail: string, primary: string, accent: string) {
  const bodyShape = body === "serpentine"
    ? `<path d="M200 178c90-116 259-75 213 38-31 75-157 23-125 101 20 50 104 28 142-2" fill="none" stroke="${xml(primary)}" stroke-width="86" stroke-linecap="round"/>`
    : body === "winged"
      ? `<path d="M188 235 62 124l42 176 118 45m306-110 126-111-42 176-118 45" fill="${xml(accent)}" opacity=".9"/><ellipse cx="358" cy="240" rx="145" ry="132" fill="${xml(primary)}"/>`
      : body === "armored"
        ? `<path d="M194 330 156 187l88-91 114-37 114 37 88 91-38 143-164 72z" fill="${xml(primary)}" stroke="${xml(accent)}" stroke-width="18"/>`
        : body === "long"
          ? `<ellipse cx="358" cy="245" rx="184" ry="105" fill="${xml(primary)}"/><path d="M500 255c120 7 118 119 30 126" fill="none" stroke="${xml(primary)}" stroke-width="54" stroke-linecap="round"/>`
          : `<circle cx="358" cy="246" r="145" fill="${xml(primary)}"/>`;
  const detailShape = detail === "horns"
    ? `<path d="m262 142-48-99 99 76m141 23 48-99-99 76" fill="${xml(accent)}"/>`
    : detail === "ears"
      ? `<path d="m253 150-73-111 126 63m157 48 73-111-126 63" fill="${xml(accent)}"/>`
      : detail === "crest"
        ? `<path d="m358 81-54-70 4 101 50-31 50 31 4-101z" fill="${xml(accent)}"/>`
        : detail === "shell"
          ? `<path d="M236 253c17-99 227-99 244 0-34 101-210 101-244 0z" fill="none" stroke="${xml(accent)}" stroke-width="24"/>`
          : detail === "tail"
            ? `<path d="M494 303c134 36 134-115 47-117" fill="none" stroke="${xml(accent)}" stroke-width="34" stroke-linecap="round"/>`
            : `<path d="M244 236 84 133l111 176m277-73 160-103-111 176" fill="${xml(accent)}" opacity=".78"/>`;
  return `${bodyShape}${detailShape}<circle cx="310" cy="236" r="13" fill="#05131b"/><circle cx="406" cy="236" r="13" fill="#05131b"/><path d="M329 288q29 24 58 0" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".86"/>`;
}

export function renderWildsCardSvg(asset: PortableCardAsset) {
  const form = creatureForm(asset.manifest.formId);
  if (!form) throw new Error("wilds_card_form_unknown");
  const stats = asset.manifest.stats;
  const foilOpacity = form.foil === "standard" ? 0.08 : form.foil === "shimmer" ? 0.2 : 0.32;
  const statRows = [
    statRow("HEALTH", stats.health, 0, form.palette.primary),
    statRow("POWER", stats.power, 126, form.palette.accent),
    statRow("GUARD", stats.guard, 252, form.palette.primary),
    statRow("SPEED", stats.speed, 378, form.palette.accent),
    statRow("BOND", stats.bond, 504, form.palette.primary)
  ].join("");
  const abilityOne = form.abilities[0];
  const abilityTwo = form.abilities[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1050" viewBox="0 0 750 1050" role="img" aria-labelledby="title description">
  <title id="title">${xml(asset.manifest.name)} Wilds card</title><desc id="description">Stage ${asset.manifest.stage} ${xml(asset.manifest.rarity)} portable Receiz card</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#06151e"/><stop offset=".5" stop-color="#103345"/><stop offset="1" stop-color="#07141c"/></linearGradient>
    <linearGradient id="foil" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#ff5ead"/><stop offset=".22" stop-color="#ffd75e"/><stop offset=".45" stop-color="#70ffcc"/><stop offset=".7" stop-color="#71a9ff"/><stop offset="1" stop-color="#c772ff"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="18"/></filter>
    <clipPath id="art"><rect x="55" y="164" width="640" height="405" rx="35"/></clipPath>
  </defs>
  <rect x="12" y="12" width="726" height="1026" rx="50" fill="url(#bg)" stroke="${xml(form.palette.accent)}" stroke-width="18"/>
  <rect x="35" y="35" width="680" height="980" rx="34" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2"/>
  <path d="M55 132h640" stroke="${xml(form.palette.primary)}" stroke-width="4"/>
  <text x="58" y="94" fill="#fff" font-family="system-ui,sans-serif" font-size="42" font-weight="900">${xml(asset.manifest.name)}</text>
  <text x="692" y="75" text-anchor="end" fill="${xml(form.palette.accent)}" font-family="system-ui,sans-serif" font-size="18" font-weight="800">STAGE ${asset.manifest.stage}</text>
  <text x="692" y="104" text-anchor="end" fill="#b9d1da" font-family="system-ui,sans-serif" font-size="16" font-weight="700">${xml(asset.manifest.cardNumber)}</text>
  <g clip-path="url(#art)"><rect x="55" y="164" width="640" height="405" fill="#0d2632"/><circle cx="358" cy="330" r="230" fill="${xml(form.palette.glow)}" opacity=".2" filter="url(#glow)"/><g transform="translate(0 82)">${creatureMark(form.anatomy.body, form.anatomy.detail, form.palette.primary, form.palette.accent)}</g><rect x="55" y="164" width="640" height="405" fill="url(#foil)" opacity="${foilOpacity}"/></g>
  <rect x="55" y="164" width="640" height="405" rx="35" fill="none" stroke="${xml(form.palette.accent)}" stroke-width="5"/>
  <text x="70" y="604" fill="${xml(form.palette.accent)}" font-family="system-ui,sans-serif" font-size="17" font-weight="850" letter-spacing="2">${xml(asset.manifest.rarity.toUpperCase())} · ${xml(asset.manifest.foil.toUpperCase())}</text>
  <text x="680" y="604" text-anchor="end" fill="#b9d1da" font-family="system-ui,sans-serif" font-size="17" font-weight="700">${xml(form.species)}</text>
  <g transform="translate(65 630)">${statRows}</g>
  <g transform="translate(65 727)"><rect width="620" height="88" rx="22" fill="#0a202b" stroke="${xml(form.palette.primary)}" stroke-opacity=".52"/><text x="24" y="32" fill="#fff" font-family="system-ui,sans-serif" font-size="23" font-weight="850">${xml(abilityOne.name)}</text><text x="590" y="32" text-anchor="end" fill="${xml(form.palette.accent)}" font-family="system-ui,sans-serif" font-size="23" font-weight="900">${abilityOne.power}</text><text x="24" y="63" fill="#a9c2cb" font-family="system-ui,sans-serif" font-size="16">${xml(abilityOne.text)}</text></g>
  <g transform="translate(65 829)"><rect width="620" height="88" rx="22" fill="#0a202b" stroke="${xml(form.palette.accent)}" stroke-opacity=".52"/><text x="24" y="32" fill="#fff" font-family="system-ui,sans-serif" font-size="23" font-weight="850">${xml(abilityTwo.name)}</text><text x="590" y="32" text-anchor="end" fill="${xml(form.palette.primary)}" font-family="system-ui,sans-serif" font-size="23" font-weight="900">${abilityTwo.power}</text><text x="24" y="63" fill="#a9c2cb" font-family="system-ui,sans-serif" font-size="16">${xml(abilityTwo.text)}</text></g>
  <text x="65" y="960" fill="#7896a1" font-family="ui-monospace,monospace" font-size="12">${xml(asset.proof.digest)}</text>
  <text x="65" y="990" fill="#fff" font-family="system-ui,sans-serif" font-size="15" font-weight="750">RECEIZ WILDS · PORTABLE PROOF CARD</text><text x="685" y="990" text-anchor="end" fill="${xml(form.palette.accent)}" font-family="system-ui,sans-serif" font-size="15" font-weight="850">${xml(asset.status.replace("_", " ").toUpperCase())}</text>
</svg>`;
}

type PngChunk = { type: string; data: Uint8Array };

function uint32(bytes: Uint8Array, offset: number) {
  return (((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0);
}

function uint32Bytes(value: number) {
  return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function concatBytes(parts: readonly Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function parsePng(bytes: Uint8Array): PngChunk[] {
  if (bytes.length < PNG_SIGNATURE.length || PNG_SIGNATURE.some((byte, index) => bytes[index] !== byte)) throw new Error("png_signature_invalid");
  const chunks: PngChunk[] = [];
  let offset = PNG_SIGNATURE.length;
  let ended = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error("png_chunk_truncated");
    const length = uint32(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("png_chunk_truncated");
    const typeBytes = bytes.slice(offset + 4, offset + 8);
    const type = new TextDecoder().decode(typeBytes);
    if (!/^[A-Za-z]{4}$/.test(type)) throw new Error("png_chunk_type_invalid");
    const data = bytes.slice(offset + 8, offset + 8 + length);
    const expectedCrc = uint32(bytes, offset + 8 + length);
    if (crc32(concatBytes([typeBytes, data])) !== expectedCrc) throw new Error(`png_crc_invalid:${type}`);
    chunks.push({ type, data });
    offset = end;
    if (type === "IEND") {
      ended = true;
      break;
    }
  }
  if (!ended || offset !== bytes.length) throw new Error("png_end_invalid");
  if (!chunks.some((chunk) => chunk.type === "IHDR") || !chunks.some((chunk) => chunk.type === "IDAT")) throw new Error("png_critical_chunks_missing");
  return chunks;
}

function makeChunk(type: string, data: Uint8Array) {
  const typeBytes = new TextEncoder().encode(type);
  return concatBytes([uint32Bytes(data.length), typeBytes, data, uint32Bytes(crc32(concatBytes([typeBytes, data])))]);
}

function imageDigest(chunks: readonly PngChunk[]) {
  const basis = chunks
    .filter((chunk) => chunk.type === "IHDR" || chunk.type === "PLTE" || chunk.type === "IDAT")
    .map((chunk) => `${chunk.type}:${Array.from(chunk.data, (byte) => byte.toString(16).padStart(2, "0")).join("")}`)
    .join("|");
  return sha256PortableBasis(basis);
}

export function embedPortableCardInPng(source: Uint8Array, asset: PortableCardAsset) {
  if (!verifyPortableCard(asset).ok) throw new Error("wilds_card_proof_invalid");
  const sourceChunks = parsePng(source).filter((chunk) => chunk.type !== PROOF_CHUNK_TYPE);
  const proof: PortableCardPngProof = {
    schema: "receiz.wilds_png_proof.v1",
    imageDigest: imageDigest(sourceChunks),
    asset
  };
  const proofData = new TextEncoder().encode(canonicalPortableCardJson(proof));
  const output = [PNG_SIGNATURE];
  for (const chunk of sourceChunks) {
    if (chunk.type === "IEND") output.push(makeChunk(PROOF_CHUNK_TYPE, proofData));
    output.push(makeChunk(chunk.type, chunk.data));
  }
  return concatBytes(output);
}

export function readPortableCardFromPng(source: Uint8Array): PortableCardPngProof {
  const chunks = parsePng(source);
  const proofs = chunks.filter((chunk) => chunk.type === PROOF_CHUNK_TYPE);
  if (proofs.length !== 1) throw new Error(proofs.length ? "wilds_png_proof_duplicate" : "wilds_png_proof_missing");
  const decoded = JSON.parse(new TextDecoder().decode(proofs[0]!.data)) as Partial<PortableCardPngProof>;
  if (decoded.schema !== "receiz.wilds_png_proof.v1" || typeof decoded.imageDigest !== "string" || !decoded.asset || typeof decoded.asset !== "object") throw new Error("wilds_png_proof_invalid");
  return decoded as PortableCardPngProof;
}

export function verifyPortableCardPng(source: Uint8Array): { ok: boolean; errors: string[]; asset: PortableCardAsset | null } {
  try {
    const chunks = parsePng(source);
    const proof = readPortableCardFromPng(source);
    const errors = verifyPortableCard(proof.asset).errors;
    if (proof.imageDigest !== imageDigest(chunks)) errors.push("png_image_digest_mismatch");
    return { ok: errors.length === 0, errors, asset: errors.length ? null : proof.asset };
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : "wilds_png_proof_invalid"], asset: null };
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function svgPngBlob(svg: string) {
  const source = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 750;
    canvas.height = 1050;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("wilds_card_canvas_unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("wilds_card_png_failed")), "image/png"));
  } finally {
    URL.revokeObjectURL(source);
  }
}

export async function downloadPortableCard(asset: PortableCardAsset) {
  if (typeof document === "undefined") throw new Error("wilds_card_download_browser_required");
  const filename = asset.manifest.formId;
  const rendered = await svgPngBlob(renderWildsCardSvg(asset));
  const portable = embedPortableCardInPng(new Uint8Array(await rendered.arrayBuffer()), asset);
  downloadBlob(new Blob([portable.slice().buffer], { type: "image/png" }), `${filename}.png`);
}
