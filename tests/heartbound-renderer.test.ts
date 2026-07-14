import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveCardVariant } from "../src/features/play/card-variant.js";
import { deriveBirthGenome } from "../src/features/play/heartbound-genome.js";
import {
  heartboundLayers,
  renderHeartboundSvg,
  renderedHeartboundDigest
} from "../src/features/play/heartbound-renderer.js";
import { sha256PortableBasis } from "../src/features/play/portable-card.js";

const seed = sha256PortableBasis("heartbound-renderer-test");
const genome = deriveBirthGenome({ formId: "mintcub-1", proofDigest: seed, variant: deriveCardVariant(seed, 1) });

describe("Heartbound full-body renderer", () => {
  it("places articulated anatomy behind the expressive foreground face", () => {
    const layers = heartboundLayers(genome, "idle");
    const slot = (name: string) => layers.findIndex((layer) => layer.slot === name);

    assert.ok(slot("torso") >= 0);
    assert.ok(slot("head") > slot("torso"));
    assert.ok(slot("left_forelimb") >= 0);
    assert.ok(slot("right_forelimb") >= 0);
    assert.ok(slot("left_hindlimb") >= 0);
    assert.ok(slot("right_hindlimb") >= 0);
    assert.ok(slot("eyes") > slot("head"));
    assert.ok(slot("mouth") > slot("eyes"));
  });

  it("renders deterministic shared SVG artwork and digest", () => {
    const first = renderHeartboundSvg(genome, "card", { width: 640, height: 405, title: "SealCub" });
    assert.equal(renderHeartboundSvg(genome, "card", { width: 640, height: 405, title: "SealCub" }), first);
    assert.match(first, /data-heartbound="heroic-companion"/);
    assert.match(first, /data-slot="torso"/);
    assert.match(first, /data-slot="head"/);
    assert.match(first, /aria-label="SealCub full-body companion"/);
    assert.match(renderedHeartboundDigest(genome, "card", "SealCub"), /^sha256:[a-f0-9]{64}$/);
  });

  it("offers padded full-body framing for the interactive card viewer", () => {
    const framed = renderHeartboundSvg(genome, "card", { width: 640, height: 405, title: "SealCub", fit: "full-body" });

    assert.match(framed, /data-framing="full-body"/);
    assert.match(framed, /scale\(0\.[0-9]+\)/);
  });
});
