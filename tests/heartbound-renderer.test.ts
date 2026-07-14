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

function slotMarkup(svg: string, slot: string) {
  return svg.match(new RegExp(`<g data-slot="${slot}">([\\s\\S]*?)</g>`))?.[1] ?? "";
}

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
    assert.match(first, /data-presentation-signature="sha256:[a-f0-9]{64}"/);
    assert.match(first, /data-template="[a-z-]+"/);
    assert.match(first, /data-archetype="[a-z-]+"/);
    assert.match(first, /data-maturity="baby"/);
    assert.match(first, /data-anime-eyes=/);
    assert.match(first, /data-friendly-mouth=/);
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

  it("keeps the authored baby face prominent without covering its body", () => {
    const head = slotMarkup(renderHeartboundSvg(genome, "card", { width: 640, height: 405, title: "SealCub" }), "head");
    const scale = Number(head.match(/scale\(([0-9.]+)\)/)?.[1]);

    assert.ok(scale >= .78 && scale <= 1.05);
  });

  it("renders structurally different faces, bodies, markings, and behavior", () => {
    const otherSeed = sha256PortableBasis("heartbound-renderer-other");
    const other = deriveBirthGenome({ formId: "mintcub-1", proofDigest: otherSeed, variant: deriveCardVariant(otherSeed, 1) });
    const first = renderHeartboundSvg(genome, "card", { width: 640, height: 405, title: "SealCub A" });
    const second = renderHeartboundSvg(other, "card", { width: 640, height: 405, title: "SealCub B" });

    assert.notEqual(slotMarkup(first, "head"), slotMarkup(second, "head"));
    assert.notEqual(slotMarkup(first, "eyes"), slotMarkup(second, "eyes"));
    assert.notEqual(slotMarkup(first, "torso"), slotMarkup(second, "torso"));
    assert.notEqual(slotMarkup(first, "face_markings"), slotMarkup(second, "face_markings"));
    assert.notEqual(genome.identity?.behavior.signature, other.identity?.behavior.signature);
    assert.match(first, /data-identity-signature="sha256:[a-f0-9]{64}"/);
    assert.match(first, /--heartbound-blink:[0-9]+ms/);
    assert.match(first, /--heartbound-idle:[0-9]+ms/);
    assert.match(first, /--heartbound-gesture:[0-9]+ms/);
  });

  it("uses different anatomy for each locomotion class", () => {
    const forms = ["mintcub-1", "ledgerfox-1", "voltray-1", "titanseal-1"];
    const torsos = new Set(forms.map((formId, index) => {
      const proof = sha256PortableBasis(`locomotion:${formId}:${index}`);
      const individual = deriveBirthGenome({ formId, proofDigest: proof, variant: deriveCardVariant(proof, 1) });
      return slotMarkup(renderHeartboundSvg(individual, "walk", { width: 640, height: 405, title: formId }), "torso");
    }));
    assert.ok(torsos.size >= 3);
  });
});
