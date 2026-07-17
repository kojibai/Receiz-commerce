import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWildsSaveScheduler } from "../src/features/play/wilds-save-scheduler.js";

describe("Wilds large-Vault save scheduling", () => {
  it("coalesces rapid movement into one serialization of the newest state", () => {
    let timer: (() => void) | null = null;
    let serializations = 0;
    const writes: string[] = [];
    const scheduler = createWildsSaveScheduler<{ step: number }>({
      delayMs: 650,
      serialize(value) {
        serializations += 1;
        return JSON.stringify(value);
      },
      write(serialized) {
        writes.push(serialized);
      },
      setTimer(callback) {
        timer = callback;
        return {} as ReturnType<typeof setTimeout>;
      },
      clearTimer() {
        timer = null;
      }
    });

    for (let step = 1; step <= 40; step += 1) scheduler.schedule({ step });

    assert.equal(serializations, 0);
    assert.equal(writes.length, 0);
    assert.ok(timer);
    (timer as () => void)();
    assert.equal(serializations, 1);
    assert.deepEqual(writes, [JSON.stringify({ step: 40 })]);
  });

  it("flushes the latest pending state for page lifecycle safety", () => {
    const writes: string[] = [];
    const scheduler = createWildsSaveScheduler<number>({
      serialize: String,
      write: (serialized) => writes.push(serialized),
      setTimer: () => ({} as ReturnType<typeof setTimeout>),
      clearTimer: () => undefined
    });

    scheduler.schedule(101);
    scheduler.schedule(102);

    assert.equal(scheduler.flush(), true);
    assert.deepEqual(writes, ["102"]);
    assert.equal(scheduler.flush(), false);
  });
});
