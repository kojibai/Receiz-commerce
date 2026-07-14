# Heartbound Advanced Identity and Living Card Back Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every proof-sealed Wilds card a visibly unique premium anime-companion identity and an accessible two-sided standalone card whose back contains a complete proof-derived story, personality, gameplay, DNA, lineage, and offline-verification dossier.

**Architecture:** Extend the sealed genome with a versioned, bounded identity grammar and isolate its visual projection/signature from SVG shape rendering. Preserve version-1 verification exactly, seal version-2 genomes for new cards, and derive a deterministic compatibility presentation for old cards without rewriting history. Build the card back from a pure safe-public dossier projection, then let the standalone scene own accessible flip state while the dock owns transaction actions.

**Tech Stack:** TypeScript, React 19, Next.js App Router, deterministic SVG, CSS 3D transforms, Node test runner, existing Receiz sorted-JSON SHA-256 proof primitives, qrcode.

## Global Constraints

- Every visible identity must be deterministic from sealed proof inputs and reconstruct offline.
- Existing version-1 card and revision digests must continue to verify byte-for-byte.
- Different proof digests must differ in face geometry, silhouette/body, marking/appendage, and behavior—not color alone.
- The torso, effects, crest, and appendages must never cover the primary eyes or head.
- The front and back remain original Receiz trade dress and may not copy another property's characters or card design.
- Story text may describe only sealed facts and deterministic personality; it may not invent memories.
- Public projections must redact private ownership data, email addresses, tokens, and unpublished achievement metadata.
- The advanced proof view must show full unshortened safe-public proof data and every offline verification check.
- Pointer, touch, keyboard, screen-reader, and reduced-motion operation are required.
- Full-body anatomy and colors must match across game, standalone page, and PNG export.

---

## File map

- `src/features/play/living-card-types.ts`: versioned genome and visual-identity types.
- `src/features/play/heartbound-identity.ts`: deterministic v2 identity derivation, compatibility projection, signature, and validation.
- `src/features/play/heartbound-genome.ts`: birth, Ascension, fusion, and merge orchestration using identity v2.
- `src/features/play/heartbound-shapes.ts`: bounded SVG head, eye, mouth, torso, limb, marking, and appendage templates.
- `src/features/play/heartbound-renderer.ts`: layer composition, locomotion poses, and renderer-version dispatch.
- `src/features/play/living-card-proof.ts`: version-preserving rendered-art commitments.
- `src/features/play/living-card-dossier.ts`: safe deterministic story, personality, game intelligence, DNA, lineage, and proof projection.
- `src/features/play/WildsCardBack.tsx`: physical card-back UI and complete canonical proof disclosure.
- `src/features/play/WildsCardScene.tsx`: accessible 3D flip, drag/swipe, keyboard, and focus state.
- `src/features/play/WildsCardPage.tsx`: standalone page integration, proof QR, and dock controls.
- `app/globals.css`: front/back 3D materials, dossier layout, mobile behavior, and reduced motion.
- `tests/heartbound-identity.test.ts`: determinism, 10,000-signature diversity, family resemblance, and bounds.
- `tests/heartbound-renderer.test.ts`: shape use, layer ordering, framing, and cross-surface determinism.
- `tests/living-card-proof.test.ts`: v1 compatibility and v2 proof-chain commitments.
- `tests/living-card-dossier.test.ts`: factual story, privacy redaction, full proof, and stable output.
- `tests/wilds-render-contract.test.ts`: accessible UI and CSS integration contract.

---

### Task 1: Versioned identity grammar and 10,000-character uniqueness contract

**Files:**
- Modify: `src/features/play/living-card-types.ts`
- Create: `src/features/play/heartbound-identity.ts`
- Create: `tests/heartbound-identity.test.ts`

**Interfaces:**
- Produces: `HeartboundIdentityV2`, `deriveHeartboundIdentity(seed, familyAnchors)`, `identityForGenome(genome, proofDigest)`, `heartboundIdentitySignature(identity)`, and `validateHeartboundIdentity(identity)`.
- Consumes: `sha256PortableBasis`, `canonicalPortableCardJson`, creature anatomy, and the existing stable `identityAnchor`.

- [ ] **Step 1: Write failing type and diversity tests**

```ts
it("creates deterministic identities with no duplicate signatures in 10,000 proofs", () => {
  const signatures = new Set<string>();
  for (let index = 0; index < 10_000; index += 1) {
    const proof = sha256PortableBasis(`identity-sample:${index}`);
    const identity = deriveHeartboundIdentity(proof, { familyId: `family-${index % 250}`, locomotion: "biped", signatureDetail: "ears" });
    assert.equal(validateHeartboundIdentity(identity).ok, true);
    assert.equal(signatures.has(heartboundIdentitySignature(identity)), false, `duplicate ${index}`);
    signatures.add(heartboundIdentitySignature(identity));
  }
});

it("changes structure and behavior rather than only palette", () => {
  const first = deriveHeartboundIdentity(sha256PortableBasis("first"), anchors);
  const second = deriveHeartboundIdentity(sha256PortableBasis("second"), anchors);
  assert.notEqual(first.faceGeometry.signature, second.faceGeometry.signature);
  assert.notEqual(first.body.signature, second.body.signature);
  assert.notEqual(first.behavior.signature, second.behavior.signature);
});
```

- [ ] **Step 2: Run the new test and verify the missing module failure**

Run: `pnpm test`

Expected: FAIL because `heartbound-identity.ts` and its exported functions do not exist.

- [ ] **Step 3: Add the v2 identity types and bounded derivation**

```ts
export type HeartboundIdentityV2 = {
  version: 2;
  faceGeometry: { head: HeadShape; cheek: number; forehead: number; muzzle: number; jaw: number; eyeSize: number; eyeSpacing: number; eyeTilt: number; pupil: PupilShape; highlight: HighlightShape; signature: string };
  body: { build: BodyBuild; neck: number; shoulder: number; torso: number; hip: number; limb: number; paw: number; signature: string };
  appendageMorphs: { ears: MorphName; horns: MorphName; wings: MorphName; tail: MorphName; crest: MorphName };
  markings: { topology: MarkingTopology; placements: MarkingPlacement[]; asymmetry: number; signature: string };
  behavior: { posture: PostureName; blinkMs: number; gaze: GazeStyle; gesture: GestureName; celebration: CelebrationName; signature: string };
  signature: string;
};

export function heartboundIdentitySignature(identity: HeartboundIdentityV2) {
  return sha256PortableBasis(canonicalPortableCardJson({ ...identity, signature: undefined }));
}
```

Use digest byte windows for every choice, clamp geometry to documented ranges, include digest-derived signature fragments to guarantee individual identity, and validate all numeric bounds and enum membership.

- [ ] **Step 4: Run identity tests and typecheck**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass; 10,000 unique signatures are asserted.

- [ ] **Step 5: Commit the identity grammar**

```bash
git add src/features/play/living-card-types.ts src/features/play/heartbound-identity.ts tests/heartbound-identity.test.ts
git commit -m "feat: add deterministic Heartbound identity grammar"
```

### Task 2: Seal v2 births and inherit coherent child identities

**Files:**
- Modify: `src/features/play/heartbound-genome.ts`
- Modify: `src/features/play/living-card-proof.ts`
- Modify: `tests/heartbound-genome.test.ts`
- Modify: `tests/living-card-proof.test.ts`

**Interfaces:**
- Consumes: `HeartboundIdentityV2`, `deriveHeartboundIdentity`, and `validateHeartboundIdentity` from Task 1.
- Produces: version-2 birth genomes, face-anchor-preserving Ascensions, coherent parent provenance for child identity groups, and `rendererVersionForGenome(genome): 1 | 2`.

- [ ] **Step 1: Write failing compatibility, Ascension, and inheritance tests**

```ts
it("keeps a stored v1 card valid and seals new births with identity v2", () => {
  assert.equal(verifyLivingCard(storedVersionOneFixture).ok, true);
  const fresh = admitLegacyCard(newLegacyCard, admittedAt);
  assert.equal(fresh.manifest.birthGenome.generatorVersion, 2);
  assert.equal(currentRevision(fresh).rendererVersion, 2);
});

it("preserves the face anchor through Ascension and inherits both parents", () => {
  const child = deriveFusionGenome({ parentA, parentB, emphasis: "balanced", kaiPulse, mutationNonce });
  assert.equal(child.identity?.faceGeometry.parentSources.includes("parent_a"), true);
  assert.equal(child.identity?.faceGeometry.parentSources.includes("parent_b"), true);
  assert.notEqual(child.identity?.signature, parentA.identity?.signature);
});
```

- [ ] **Step 2: Run tests and verify v2 expectations fail**

Run: `pnpm test`

Expected: FAIL because birth genomes still use generator version 1 and no identity group exists.

- [ ] **Step 3: Upgrade birth, Ascension, fusion, and proof digest dispatch**

```ts
export function rendererVersionForGenome(genome: LivingCardGenome): 1 | 2 {
  return genome.generatorVersion === 2 ? 2 : 1;
}

function renderedArtDigest(genome: LivingCardGenome, formId: string, title: string, rendererVersion: 1 | 2) {
  if (rendererVersion === 1) return sha256PortableBasis(canonicalPortableCardJson({ renderer: 1, genome, formId, title }));
  return renderedHeartboundDigest(genome, "card", title);
}
```

Keep the exact version-1 formula unchanged. Derive v2 identity at birth, retain the stable face anchor during Ascension, blend compatible parent identity groups during fusion, and mark each group with its provenance.

- [ ] **Step 4: Run proof, genome, and full tests**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass, including the stored version-1 fixture.

- [ ] **Step 5: Commit versioned living proof support**

```bash
git add src/features/play/heartbound-genome.ts src/features/play/living-card-proof.ts tests/heartbound-genome.test.ts tests/living-card-proof.test.ts
git commit -m "feat: seal advanced living character identities"
```

### Task 3: Parameterized anime-companion shape renderer

**Files:**
- Create: `src/features/play/heartbound-shapes.ts`
- Modify: `src/features/play/heartbound-renderer.ts`
- Modify: `tests/heartbound-renderer.test.ts`

**Interfaces:**
- Consumes: `identityForGenome(genome, proofDigest)` and versioned genome data.
- Produces: `renderHeadShape`, `renderEyes`, `renderMouth`, `renderTorso`, `renderLimbs`, `renderAppendages`, `renderMarkings`, and v1/v2 renderer dispatch through `renderHeartboundSvg`.

- [ ] **Step 1: Write failing structural render tests**

```ts
it("renders different face, body, marking, and motion structures for different identities", () => {
  const a = renderHeartboundSvg(genomeA, "card", options);
  const b = renderHeartboundSvg(genomeB, "card", options);
  for (const slot of ["head", "eyes", "torso", "face_markings"]) {
    assert.match(a, new RegExp(`data-slot="${slot}"`));
  }
  assert.notEqual(extractSlot(a, "head"), extractSlot(b, "head"));
  assert.notEqual(extractSlot(a, "torso"), extractSlot(b, "torso"));
});
```

Add locomotion cases asserting biped, quadruped, flying, and serpentine limb/body paths differ and that head/eyes remain after torso in layer order.
Add behavior cases asserting different genomes emit different deterministic blink, idle, gesture, and celebration timing variables while the same genome remains stable.

- [ ] **Step 2: Run the renderer tests and verify structural equality fails**

Run: `pnpm test`

Expected: FAIL because the current renderer always emits one head, torso, eye, and limb shape.

- [ ] **Step 3: Implement bounded shape templates and locomotion poses**

```ts
export function renderEyes(identity: HeartboundIdentityV2, palette: Palette) {
  const { eyeSize, eyeSpacing, eyeTilt, pupil, highlight } = identity.faceGeometry;
  const radiusX = 20 * eyeSize;
  const radiusY = 27 * eyeSize;
  const leftX = 280 - 48 * eyeSpacing;
  const rightX = 280 + 48 * eyeSpacing;
  const pupilRadius = pupil === "star" ? 9 : pupil === "slit" ? 6 : 8;
  const highlightRadius = highlight === "double" ? 7 : 9;
  return `<g data-eye-shape="${identity.faceGeometry.signature}" transform="rotate(${eyeTilt} 280 142)"><ellipse cx="${leftX}" cy="142" rx="${radiusX}" ry="${radiusY}" fill="${palette.ink}"/><ellipse cx="${rightX}" cy="142" rx="${radiusX}" ry="${radiusY}" fill="${palette.ink}"/><circle cx="${leftX}" cy="142" r="${pupilRadius}" fill="${palette.glow}"/><circle cx="${rightX}" cy="142" r="${pupilRadius}" fill="${palette.glow}"/><circle cx="${leftX + 6}" cy="134" r="${highlightRadius}" fill="#fff"/><circle cx="${rightX + 6}" cy="134" r="${highlightRadius}" fill="#fff"/></g>`;
}
```

Implement authored path families for every enum, parameterize them only inside validated bounds, select the version-1 renderer unchanged for legacy art commitments, and add v2 markup attributes for visual diagnostics.
Project behavior timing as `--heartbound-blink`, `--heartbound-idle`, and `--heartbound-gesture` SVG style variables; pose-specific transforms must use the locomotion skeleton so flying, quadruped, biped, and serpentine motion cannot collapse to one animation.

- [ ] **Step 4: Run renderer, identity, and full tests**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass with distinct structural slots and stable digests.

- [ ] **Step 5: Commit the advanced renderer**

```bash
git add src/features/play/heartbound-shapes.ts src/features/play/heartbound-renderer.ts tests/heartbound-renderer.test.ts
git commit -m "feat: render unique Heartbound anatomy and faces"
```

### Task 4: Proof-derived story, personality, gameplay, DNA, and full proof projection

**Files:**
- Create: `src/features/play/living-card-dossier.ts`
- Create: `tests/living-card-dossier.test.ts`

**Interfaces:**
- Produces: `LivingCardDossier`, `projectLivingCardDossier(asset, origin)`, `safePublicProofObject(asset)`, and `canonicalPublicProofJson(asset)`.
- Consumes: current genome/revision projection, verifier results, catalog form, growth engine, lineage, and `standaloneCardUrl`.

- [ ] **Step 1: Write failing factuality, completeness, and privacy tests**

```ts
it("projects a stable emotional dossier from sealed facts", () => {
  const dossier = projectLivingCardDossier(child, "https://cards.example");
  assert.deepEqual(projectLivingCardDossier(child, "https://cards.example"), dossier);
  assert.match(dossier.story, new RegExp(child.manifest.name));
  assert.equal(dossier.dna.identityFingerprint.length > 20, true);
  assert.equal(dossier.lineage.parents.length, 2);
});

it("exposes complete proof digests while redacting private owner data", () => {
  const dossier = projectLivingCardDossier(privateOwnerCard, "https://cards.example");
  assert.match(dossier.canonicalProofJson, new RegExp(privateOwnerCard.proof.digest));
  assert.doesNotMatch(dossier.canonicalProofJson, /owner@example\.com|secret-token/);
  assert.equal(dossier.verification.checks.every((check) => check.status === "pass"), true);
});
```

- [ ] **Step 2: Run tests and verify the dossier module is missing**

Run: `pnpm test`

Expected: FAIL because `living-card-dossier.ts` does not exist.

- [ ] **Step 3: Implement pure deterministic projections**

```ts
export type LivingCardDossier = {
  story: string;
  personality: { motivations: string[]; traits: string[]; habitat: string; bonding: string[]; cautions: string[]; quirks: string[]; communication: string; careCues: string[] };
  gameplay: { role: string; strengths: string[]; vulnerabilities: string[]; teammates: string[]; stats: CreatureStats; abilities: string[]; nextRequirements: string[] };
  dna: { identityFingerprint: string; genomeDigest: string; face: string[]; body: string[]; appendages: string[]; markings: string[]; aura: string[]; behavior: string[]; provenance: Record<string, string> };
  lineage: { root: string; parents: string[]; children: string[] };
  verification: { ok: boolean; checks: Array<{ label: string; status: "pass" | "fail"; detail: string }>; route: string };
  canonicalProofJson: string;
};
```

Build prose from bounded phrase tables keyed by sealed genome traits and actual revision reasons. Recursively redact keys matching owner email, token, secret, session, and private achievement patterns before canonical serialization; retain full public digests and explicitly list redacted field paths.

- [ ] **Step 4: Run dossier and full tests**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass; output is stable, complete, and privacy-safe.

- [ ] **Step 5: Commit the dossier projection**

```bash
git add src/features/play/living-card-dossier.ts tests/living-card-dossier.test.ts
git commit -m "feat: project living character and proof dossiers"
```

### Task 5: Build the physical Living Card Back

**Files:**
- Create: `src/features/play/WildsCardBack.tsx`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `projectLivingCardDossier(asset, origin)` and `canonicalPublicProofJson(asset)`.
- Produces: `WildsCardBack({ asset, origin, qr }: { asset: PortableCardAsset; origin: string; qr: string })` and an on-demand exact portable PNG wrapper proof preview.

- [ ] **Step 1: Write the failing render contract**

```ts
assert.match(cardBackSource, /aria-label="Living card back"/);
assert.match(cardBackSource, /Character story/);
assert.match(cardBackSource, /Personality/);
assert.match(cardBackSource, /Gameplay intelligence/);
assert.match(cardBackSource, /Full visual DNA/);
assert.match(cardBackSource, /Complete offline proof/);
assert.match(cardBackSource, /Copy canonical proof/);
assert.match(cardBackSource, /Generate exact PNG proof metadata/);
```

- [ ] **Step 2: Run tests and verify the missing component failure**

Run: `pnpm test`

Expected: FAIL because `WildsCardBack.tsx` does not exist.

- [ ] **Step 3: Implement the complete scrollable card back**

```tsx
export function WildsCardBack({ asset, origin, qr }: Props) {
  const dossier = useMemo(() => projectLivingCardDossier(asset, origin), [asset, origin]);
  return <article aria-label="Living card back" className="wilds-card-back">
    <header><span>Living companion dossier</span><strong>{asset.manifest.name}</strong></header>
    <section><h2>Character story</h2><p>{dossier.story}</p></section>
    <DossierSections dossier={dossier} />
    <details><summary>Complete offline proof</summary><VerificationChecks value={dossier.verification} /><pre>{dossier.canonicalProofJson}</pre><button onClick={() => navigator.clipboard.writeText(dossier.canonicalProofJson)}>Copy canonical proof</button></details>
    <img alt="QR code for this exact card page" src={qr} />
  </article>;
}
```

Render every dossier group, full unshortened digests, redaction notices, copy feedback with `aria-live`, and a local canonical-proof download using a Blob URL. The immediate canonical view contains every asset-level field required by `verifyAnyWildsCard`. A `Generate exact PNG proof metadata` control calls `portableCardPngBlob(asset)`, reads the result with `readPortableCardFromPng`, and then displays the exact wrapper schema and `imageDigest` for the currently rendered PNG; no digest is fabricated before those pixels exist.

- [ ] **Step 4: Run render contracts and typecheck**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass.

- [ ] **Step 5: Commit the card back**

```bash
git add src/features/play/WildsCardBack.tsx tests/wilds-render-contract.test.ts
git commit -m "feat: add complete living card back"
```

### Task 6: Accessible 3D flip and standalone integration

**Files:**
- Modify: `src/features/play/WildsCardScene.tsx`
- Modify: `src/features/play/WildsCardPage.tsx`
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `WildsCard` front, `WildsCardBack` back, current-domain QR, and dossier projection.
- Produces: controlled `flipped` scene state and a visible `Flip to front/back` control.

- [ ] **Step 1: Write failing accessibility and motion contracts**

```ts
assert.match(sceneSource, /aria-pressed=\{flipped\}/);
assert.match(sceneSource, /Flip to \{flipped \? "front" : "back"\}/);
assert.match(sceneSource, /event\.key === "Enter"/);
assert.match(sceneSource, /event\.key === " "/);
assert.match(css, /transform-style:\s*preserve-3d/);
assert.match(css, /backface-visibility:\s*hidden/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /\.wilds-capture-dialog[^}]*max-height:\s*calc\(100dvh - 20px\)/s);
assert.match(css, /\.wilds-capture-stage[^}]*min-height:\s*clamp\(150px,/s);
assert.ok(playCampaignSource.indexOf("wilds-inventory-tray") < playCampaignSource.indexOf("<aside className=\"wilds-command-panel\""));
assert.doesNotMatch(playCampaignSource, /\{deckCards\.length\}\/4/);
assert.match(playCampaignSource, /\{deckCards\.length\}\/∞/);
```

- [ ] **Step 2: Run tests and verify flip contracts fail**

Run: `pnpm test`

Expected: FAIL because the scene has only a front face and tilt interaction.

- [ ] **Step 3: Implement controlled flipping and responsive card materials**

```tsx
const [flipped, setFlipped] = useState(false);
const flip = () => setFlipped((value) => !value);
return <div className="wilds-card-scene" onKeyDown={(event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flip(); }
}}>
  <button aria-pressed={flipped} aria-label={`Flip to ${flipped ? "front" : "back"}`} onClick={flip} type="button">{flipped ? "Show front" : "Reveal character back"}</button>
  <div className={cx("wilds-card-flipper", flipped && "is-flipped")}>
    <div className="wilds-card-face front"><WildsCard asset={asset} /></div>
    <div className="wilds-card-face back"><WildsCardBack asset={asset} origin={origin} qr={qr} /></div>
  </div>
</div>;
```

Track pointer-down/up horizontal distance for swipe without interfering with internal back scrolling. Disable tilt while flipped or while a proof disclosure has focus. CSS uses `rotateY(180deg)`, preserves dimensions, provides internal scrolling, enlarges to viewport-safe mobile bounds, and replaces rotation with an instant face switch under reduced motion.

Keep the capture ceremony's existing capsule, rays, proof ring, copy, and reveal sequence unchanged while reducing padding, gaps, capsule/ring footprint, and text margins. Bound `.wilds-capture-dialog` to `calc(100dvh - 20px)` and set `.wilds-capture-stage` to `min-height: clamp(150px, 25dvh, 190px)` on mobile so the complete ceremony and Continue action fit without page scrolling.

Move the collapsed `.wilds-inventory-tray` into `.wilds-shell` between the world and command panel in DOM order. Define desktop grid areas so the closed vault sits above the World Mission column while the playable world retains its height; when opened, let the full inventory span both columns below the game. On mobile, preserve the order world → card vault → World Mission. Replace both deck counters with `{deckCards.length}/∞`; do not impose an inventory cap.

- [ ] **Step 4: Run full tests and typecheck**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass with no raw internal `<a>` navigation and no missing hook dependencies.

- [ ] **Step 5: Commit standalone flipping**

```bash
git add src/features/play/WildsCardScene.tsx src/features/play/WildsCardPage.tsx app/globals.css tests/wilds-render-contract.test.ts
git commit -m "feat: flip standalone living cards in 3d"
```

### Task 7: Cross-surface visual and portable-proof consistency

**Files:**
- Modify: `src/features/play/WildsCard.tsx`
- Modify: `src/features/play/card-export.ts`
- Modify: `tests/card-export.test.ts`
- Modify: `tests/heartbound-renderer.test.ts`

**Interfaces:**
- Consumes: renderer-version dispatch and current living identity.
- Produces: identical anatomy/palette commitments on interactive front and exported PNG plus proof metadata identifying the full-domain card route.

- [ ] **Step 1: Write failing cross-surface comparison tests**

```ts
it("uses the current living identity on the card front and exported PNG", () => {
  const interactive = renderHeartboundSvg(genome, "card", interactiveOptions);
  const exported = renderWildsCardSvg(asset, { origin: "https://collection.example" });
  assert.match(exported, new RegExp(`data-identity-signature="${heartboundIdentitySignature(identity)}"`));
  assert.match(interactive, new RegExp(`data-identity-signature="${heartboundIdentitySignature(identity)}"`));
  assert.match(exported, /https:\/\/collection\.example\/cards\//);
});
```

- [ ] **Step 2: Run tests and verify exported identity metadata is absent**

Run: `pnpm test`

Expected: FAIL because current SVG metadata does not expose the identity signature consistently.

- [ ] **Step 3: Share the same projection and add portable proof route metadata**

Use `currentLivingGenome` and renderer dispatch in both surfaces, embed the full identity signature and renderer version in SVG diagnostics, preserve `window.location.origin` for downloads, and retain v1/v2 PNG verifier compatibility.

- [ ] **Step 4: Run export, renderer, and full tests**

Run: `pnpm test && pnpm typecheck`

Expected: all tests pass, including living PNG round trips and domain-correct QR tests.

- [ ] **Step 5: Commit cross-surface consistency**

```bash
git add src/features/play/WildsCard.tsx src/features/play/card-export.ts tests/card-export.test.ts tests/heartbound-renderer.test.ts
git commit -m "feat: preserve character identity across card surfaces"
```

### Task 8: Browser verification, lint cleanup, production build, and release evidence

**Files:**
- Modify if required by findings: `src/features/play/PlayCampaign.tsx`
- Modify if required by findings: `src/features/play/WildsCardPage.tsx`
- Modify if required by findings: `src/features/play/WildsCardScene.tsx`
- Modify if required by findings: `src/features/play/WildsCardBack.tsx`
- Modify if required by findings: `app/globals.css`

**Interfaces:**
- Consumes: the complete implementation from Tasks 1–7.
- Produces: verified desktop/mobile behavior, clean lint/types/tests, and a successful guarded production build.

- [ ] **Step 1: Run the complete automated gate**

Run: `pnpm test && pnpm typecheck`

Expected: every test passes and TypeScript exits zero.

- [ ] **Step 2: Inspect and resolve Next lint warnings**

Run: `pnpm lint`

Expected: zero errors. Add `dispatch` to the affected `PlayCampaign` effect dependency list, and replace proof QR `<img>` with `next/image` using `unoptimized` if those warnings remain.

- [ ] **Step 3: Verify desktop in a real browser**

Open the active local Wilds card page at 1440×1000. Verify the complete character fits the front, tilt does not clip anatomy, flip control and drag work, story and DNA are readable, proof disclosure contains the complete digest and revisions, copy works, QR resolves to the current host, and flipping back restores the exact front.

- [ ] **Step 4: Verify mobile and accessibility behavior**

Repeat at 390×844. Verify swipe flip, internal back scrolling, one-thumb Flip control, visible focus, keyboard Enter/Space, readable proof, no page-width overflow, and reduced-motion face switching. Complete a capture and verify the unchanged capsule/reveal artwork plus Continue action fit in the viewport without scrolling the page.

- [ ] **Step 5: Stop the guarded dev runtime, build, and restart preview**

Stop only the workspace-owned guarded Next dev process, then run: `pnpm build`

Expected: Next production compilation, lint, and type validation complete with exit code zero. Restart the prior local preview command and confirm the standalone route still loads.

- [ ] **Step 6: Commit only verified release fixes**

```bash
git add src/features/play/PlayCampaign.tsx src/features/play/WildsCardPage.tsx src/features/play/WildsCardScene.tsx src/features/play/WildsCardBack.tsx app/globals.css
git commit -m "fix: release advanced living card experience"
```

- [ ] **Step 7: Record final evidence**

Run: `git status --short && git log -8 --oneline`

Expected: clean worktree and one reviewed commit per task. Report test count, typecheck, lint, production build, desktop/mobile browser checks, and any intentionally retained limitations.
