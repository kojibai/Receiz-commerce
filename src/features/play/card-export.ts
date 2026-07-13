import { creatureForm } from "./creature-catalog";
import { canonicalPortableCardJson, type PortableCardAsset } from "./portable-card";

export type PortableCardPackage = {
  schema: "receiz.wilds_portable_package.v1";
  asset: PortableCardAsset;
  lineage: PortableCardAsset["manifest"]["lineage"];
  cardSvg: string;
  offlineVerification: string;
};

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

export function portableCardPackage(asset: PortableCardAsset): PortableCardPackage {
  return {
    schema: "receiz.wilds_portable_package.v1",
    asset,
    lineage: asset.manifest.lineage,
    cardSvg: renderWildsCardSvg(asset),
    offlineVerification: "Recompute SHA-256 over the sorted-key canonical manifest JSON and compare it with asset.proof.digest. Then validate catalog version, form identity, stats, owner, and lineage."
  };
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
  const pkg = portableCardPackage(asset);
  const filename = asset.manifest.formId;
  const png = await svgPngBlob(pkg.cardSvg);
  downloadBlob(png, `${filename}.png`);
  downloadBlob(
    new Blob([canonicalPortableCardJson(pkg)], { type: "application/json" }),
    `${filename}.receiz-card.json`
  );
}
