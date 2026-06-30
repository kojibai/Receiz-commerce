import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pendingPublishStorageKey, shouldResumePendingPublish } from "../src/lib/storage/pending-publish.js";

describe("pending publish resume", () => {
  it("scopes pending publish to the platform storage key", () => {
    assert.equal(
      pendingPublishStorageKey("receiz-app-commerce-state-v1:platform"),
      "receiz-app-commerce-state-v1:platform:pending-publish-v1"
    );
  });

  it("resumes publish only after Receiz login callback succeeds", () => {
    assert.equal(shouldResumePendingPublish("?receiz=connected"), true);
    assert.equal(shouldResumePendingPublish("?receiz_error=missing_client_id"), false);
    assert.equal(shouldResumePendingPublish(""), false);
  });
});
