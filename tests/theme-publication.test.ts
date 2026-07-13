import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("theme publication contract", () => {
  it("uses one durable publication transaction for store and theme", () => {
    const source = readFileSync("src/lib/storage/use-template-store.ts", "utf8");

    assert.match(source, /const publishWorkspace = useCallback/);
    assert.match(source, /feedbackId: "publish"/);
    assert.match(source, /feedbackId: "brand\.saveTheme"/);
    assert.doesNotMatch(
      source,
      /saveTheme\(\)\s*\{\s*setActionFeedback\("brand\.saveTheme", "success"/
    );
  });

  it("rehydrates other merchant tabs and labels the action as publication", () => {
    const storeSource = readFileSync("src/lib/storage/use-template-store.ts", "utf8");
    const panelSource = readFileSync("src/features/admin/BrandPanel.tsx", "utf8");

    assert.match(storeSource, /externalWorkspaceState/);
    assert.match(storeSource, /window\.addEventListener\("storage"/);
    assert.match(panelSource, /Publishing theme/);
    assert.match(panelSource, /Theme published/);
    assert.match(panelSource, /Publish theme/);
  });
});
