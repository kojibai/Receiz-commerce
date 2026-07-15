"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortableCardAsset } from "./portable-card";
import type { WildsWorldCommand } from "./wilds-world-service";
import { WILDS_WORLD_ID } from "./wilds-world-event";
import type { WildsWorldProjection } from "./wilds-world-state";

export function acceptWildsWorldSnapshot(current: WildsWorldProjection | null, incoming: WildsWorldProjection) {
  return current && current.revision > incoming.revision ? current : incoming;
}

export function buildWildsWorldCommandBody(guestId: string, command: WildsWorldCommand) {
  return { guestId, command };
}

export function parseWildsWorldSnapshotResponse(value: unknown): WildsWorldProjection {
  if (!value || typeof value !== "object") throw new Error("wilds_world_snapshot_invalid");
  const response = value as Record<string, unknown>;
  const projection = response.projection as WildsWorldProjection | undefined;
  if (response.ok !== true || projection?.schema !== "receiz.wilds_world_projection.v3" || projection.worldId !== WILDS_WORLD_ID || !Number.isSafeInteger(projection.revision)) {
    throw new Error("wilds_world_snapshot_invalid");
  }
  return projection;
}

export type WildsWorldClientMode = "connecting" | "receiz_live" | "local_practice" | "reconnecting";

export function useWildsWorld(input: { enabled: boolean; guestId: string; activeCard: PortableCardAsset | null }) {
  const [snapshot, setSnapshot] = useState<WildsWorldProjection | null>(null);
  const [mode, setMode] = useState<WildsWorldClientMode>("connecting");
  const [error, setError] = useState("");
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const commandPending = useRef(false);
  const controllers = useRef(new Set<AbortController>());

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const controller = new AbortController();
    controllers.current.add(controller);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const value = await response.json().catch(() => null) as Record<string, unknown> | null;
      if (!response.ok || !value) throw new Error(typeof value?.error === "string" ? value.error : "wilds_world_request_failed");
      return value;
    } finally {
      controllers.current.delete(controller);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!input.enabled) return;
    try {
      const projection = parseWildsWorldSnapshotResponse(await request("/api/wilds/world/snapshot"));
      setSnapshot((current) => acceptWildsWorldSnapshot(current, projection));
      setMode((current) => current === "receiz_live" || current === "local_practice" ? current : "connecting");
      setError("");
    } catch (cause) {
      if ((cause as Error).name === "AbortError") return;
      setMode("reconnecting");
      setError(cause instanceof Error ? cause.message : "wilds_world_reconnecting");
    }
  }, [input.enabled, request]);

  useEffect(() => {
    void refresh();
    if (!input.enabled) return;
    const timer = window.setInterval(() => void refresh(), 2_000);
    return () => window.clearInterval(timer);
  }, [input.enabled, refresh]);

  useEffect(() => () => {
    for (const controller of controllers.current) controller.abort();
    controllers.current.clear();
  }, []);

  const post = useCallback(async (command: WildsWorldCommand) => {
    if (commandPending.current) throw new Error("wilds_world_command_pending");
    commandPending.current = true;
    setPendingCommand(command.commandId);
    try {
      const value = await request("/api/wilds/world/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildWildsWorldCommandBody(input.guestId, command))
      });
      const projection = parseWildsWorldSnapshotResponse({ ok: true, projection: value.projection });
      setSnapshot((current) => acceptWildsWorldSnapshot(current, projection));
      const publication = value.publication as { mode?: WildsWorldClientMode } | undefined;
      setMode(publication?.mode === "receiz_live" ? "receiz_live" : publication?.mode === "local_practice" ? "local_practice" : "reconnecting");
      setError("");
      return projection;
    } catch (cause) {
      setMode(input.guestId ? "local_practice" : "reconnecting");
      setError(cause instanceof Error ? cause.message : "wilds_world_command_failed");
      throw cause;
    } finally {
      commandPending.current = false;
      setPendingCommand(null);
    }
  }, [input.guestId, request]);

  const commandId = (kind: string) => `${kind}:${crypto.randomUUID()}`;
  return {
    snapshot,
    mode,
    error,
    pendingCommand,
    refresh,
    joinRaid: (bossId: string, preferredSquad?: number) => post({ type: "raid.join", bossId, preferredSquad, commandId: commandId("command:raid:join") }),
    contribute: (bossId: string, damage: number, support: number) => {
      if (!input.activeCard) throw new Error("wilds_world_active_card_required");
      return post({ type: "raid.contribute", bossId, damage, support, cardProofDigest: input.activeCard.proof.digest, commandId: commandId("command:raid:contribute") });
    },
    createTeam: (name: string) => post({ type: "team.create", name, commandId: commandId("command:team:create") }),
    joinTeam: (teamId: string) => post({ type: "team.join", teamId, commandId: commandId("command:team:join") })
  };
}
