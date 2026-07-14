import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clampInventoryPage, inventoryPageSize } from "../src/features/play/inventory-pagination.js";

describe("Wilds inventory pagination", () => {
  it("uses four cards on compact screens and eight on wider screens", () => {
    assert.equal(inventoryPageSize(true), 4);
    assert.equal(inventoryPageSize(false), 8);
  });

  it("clamps pages for empty, short, and multi-page collections", () => {
    assert.equal(clampInventoryPage(4, 0, 4), 0);
    assert.equal(clampInventoryPage(4, 5, 4), 1);
    assert.equal(clampInventoryPage(9, 17, 8), 2);
    assert.equal(clampInventoryPage(-1, 17, 8), 0);
  });
});
