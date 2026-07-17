export const WILDS_SAVE_DEBOUNCE_MS = 650;

type TimerHandle = ReturnType<typeof setTimeout>;

export type WildsSaveScheduler<T> = {
  schedule(value: T): void;
  flush(): boolean;
  cancel(): void;
};

export function createWildsSaveScheduler<T>(options: {
  serialize: (value: T) => string;
  write: (serialized: string) => void;
  delayMs?: number;
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer?: (handle: TimerHandle) => void;
}): WildsSaveScheduler<T> {
  const delayMs = Math.max(0, options.delayMs ?? WILDS_SAVE_DEBOUNCE_MS);
  const setTimer = options.setTimer ?? ((callback, delay) => setTimeout(callback, delay));
  const clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle));
  let pending: T | undefined;
  let timer: TimerHandle | null = null;

  const commit = () => {
    if (pending === undefined) return false;
    const value = pending;
    try {
      options.write(options.serialize(value));
      if (pending === value) pending = undefined;
      return true;
    } catch {
      // Keep the newest state pending so a later lifecycle flush can retry.
      return false;
    }
  };

  return {
    schedule(value) {
      pending = value;
      if (timer !== null) clearTimer(timer);
      timer = setTimer(() => {
        timer = null;
        commit();
      }, delayMs);
    },
    flush() {
      if (timer !== null) {
        clearTimer(timer);
        timer = null;
      }
      return commit();
    },
    cancel() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      pending = undefined;
    }
  };
}
