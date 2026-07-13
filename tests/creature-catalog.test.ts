import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CREATURE_CATALOG_VERSION,
  creatureFamilies,
  creatureForm,
  creatureForms,
  formsForFamily
} from "../src/features/play/creature-catalog.js";

describe("Wilds creature catalog", () => {
  it("defines 250 unique three-stage families and 750 unique forms", () => {
    assert.equal(CREATURE_CATALOG_VERSION, "receiz.wilds.catalog.v1");
    assert.equal(creatureFamilies.length, 250);
    assert.equal(creatureForms.length, 750);
    assert.equal(new Set(creatureFamilies.map((family) => family.id)).size, 250);
    assert.equal(new Set(creatureForms.map((form) => form.id)).size, 750);
    assert.equal(new Set(creatureForms.map((form) => form.cardNumber)).size, 750);

    for (const family of creatureFamilies) {
      const forms = formsForFamily(family.id);
      assert.deepEqual(forms.map((form) => form.stage), [1, 2, 3]);
      assert.equal(forms[0]?.evolvesFromId, null);
      assert.equal(forms[1]?.evolvesFromId, forms[0]?.id);
      assert.equal(forms[2]?.evolvesFromId, forms[1]?.id);
      assert.equal(forms.every((form) => form.familyId === family.id), true);
    }
  });

  it("keeps the four flagship companions as complete original families", () => {
    for (const id of ["mintcub", "voltray", "ledgerfox", "titanseal"]) {
      const family = creatureFamilies.find((candidate) => candidate.id === id);
      assert.ok(family);
      assert.equal(formsForFamily(id).length, 3);
      assert.equal(creatureForm(`${id}-1`)?.familyId, id);
    }
  });

  it("gives every form complete stats, abilities, render traits, and progression", () => {
    for (const form of creatureForms) {
      assert.equal(Object.values(form.stats).every((value) => Number.isInteger(value) && value > 0 && value <= 200), true);
      assert.equal(form.abilities.length, 2);
      assert.ok(form.palette.primary.startsWith("#"));
      assert.ok(form.palette.accent.startsWith("#"));
      assert.ok(form.anatomy.body);
      assert.ok(form.anatomy.detail);
      assert.ok(form.habitat);
      assert.ok(form.lore);
      assert.ok(form.exchangeEligible);
      if (form.stage > 1) {
        assert.ok(form.evolution.level > 1);
        assert.ok(form.evolution.bond > 0);
      }
    }
  });
});
