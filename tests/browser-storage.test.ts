import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  safeGetLocalStorage,
  safeRemoveLocalStorage,
  safeSetLocalStorage
} from "../src/lib/storage/browser-storage.js";

describe("browser storage guards", () => {
  it("does not throw when localStorage quota is exceeded", () => {
    const storage = {
      setItem() {
        throw new DOMException("quota", "QuotaExceededError");
      },
      removeItem() {}
    };

    const result = safeSetLocalStorage(storage, "receiz-app-commerce-state-v1:platform", "{}");

    assert.equal(result.ok, false);
    assert.equal(result.reason, "quota_exceeded");
  });

  it("preserves the last good entry after a failed write", () => {
    let removedKey = "";
    const storage = {
      setItem() {
        throw new Error("storage unavailable");
      },
      removeItem(key: string) {
        removedKey = key;
      }
    };

    const result = safeSetLocalStorage(storage, "receiz-state", "{}");

    assert.equal(result.ok, false);
    assert.equal(result.reason, "unavailable");
    assert.equal(removedKey, "");
  });

  it("returns null when localStorage reads are blocked", () => {
    const storage = {
      getItem() {
        throw new Error("blocked");
      }
    };

    assert.equal(safeGetLocalStorage(storage, "key"), null);
  });

  it("ignores localStorage remove failures", () => {
    const storage = {
      removeItem() {
        throw new Error("blocked");
      }
    };

    assert.doesNotThrow(() => safeRemoveLocalStorage(storage, "key"));
  });
});
