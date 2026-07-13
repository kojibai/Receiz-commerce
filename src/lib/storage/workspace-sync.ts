import type { HostContext } from "../hosting/host-context";
import type { CommerceState } from "../../types/domain";
import { selectClientInitialState } from "./client-state";

export type WorkspaceStorageEvent = {
  key: string | null;
  newValue: string | null;
};

export function externalWorkspaceState(
  event: WorkspaceStorageEvent,
  hostContext: HostContext,
  fallback: CommerceState
): CommerceState | null {
  if (
    hostContext.surface !== "platform" ||
    event.key !== hostContext.storageKey ||
    !event.newValue
  ) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(event.newValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    return selectClientInitialState(hostContext, fallback, {
      scoped: event.newValue,
      base: null
    });
  } catch {
    return null;
  }
}
