import { generateCrystalBurrower, type WildsBoss } from "./wilds-boss-generator";
import { generateWildsBoss, type WildsBossDefinition } from "./wilds-boss-ecology";
import { advanceDynamicSite, generateCrystalBurrow, type WildsDynamicSite } from "./wilds-dynamic-sites";
import { deriveWildsEcologyChild, generateWildsEcologyEnsemble, type WildsEcologySite } from "./wilds-ecology";
import { admitRaidPlayer, applyRaidContribution, createWildsRaid, type WildsRaid } from "./wilds-raid-core";
import { applyWildsRaidIntent, createWildsRaidEncounter, type WildsRaidIntent } from "./wilds-raid-encounter";
import { admitWildsRaidParticipant, createWildsRaidRound, renewWildsRaidLease, retreatWildsRaidParticipant, settleWildsRaidRound, type WildsRaidRound } from "./wilds-raid-round";
import type { PortableCardAsset } from "./portable-card";
import { createWildsTeam, joinWildsTeam, scoreWildsLeague } from "./wilds-team-league";
import { createWildsWorldEvent, type WildsWorldEvent, type WildsWorldEventKind } from "./wilds-world-event";
import {
  checkpointWildsWorld,
  initialWildsWorldProjection,
  replayWildsWorld,
  reduceWildsWorldEvent,
  type WildsWorldCheckpoint,
  type WildsWorldEcologyProjection,
  type WildsWorldProjection
} from "./wilds-world-state";

export type WildsWorldCommand =
  | { type: "boss.track"; bossId: string; position: { x: number; z: number }; commandId: string }
  | { type: "raid.enter"; bossId: string; roundId: string; position: { x: number; z: number }; preferredSquad?: number; commandId: string }
  | { type: "raid.act"; bossId: string; roundId: string; intent: WildsRaidIntent["type"]; commandId: string }
  | { type: "raid.lease"; bossId: string; roundId: string; status: "connected" | "disconnected"; commandId: string }
  | { type: "raid.retreat"; bossId: string; roundId: string; commandId: string }
  | { type: "raid.join"; bossId: string; preferredSquad?: number; commandId: string }
  | { type: "raid.contribute"; bossId: string; damage: number; support: number; cardProofDigest: string; commandId: string }
  | { type: "team.create"; name: string; commandId: string }
  | { type: "team.join"; teamId: string; commandId: string }
  | { type: "ecology.discover"; siteId: string; position: { x: number; z: number }; commandId: string }
  | { type: "ecology.contribute"; siteId: string; position: { x: number; z: number }; amount: number; cardProofDigest: string; commandId: string };

export type WildsWorldAuthority = {
  actorId: string;
  canonical: boolean;
  pulse: string;
  occurredAt: string;
  card?: PortableCardAsset;
};

function commandIdValid(value: string) {
  return value.length >= 6 && value.length <= 180 && /^[a-z0-9][a-z0-9:._-]*$/i.test(value);
}

export class WildsWorldService {
  private projection: WildsWorldProjection;
  private eventTail: WildsWorldEvent[];

  constructor(input?: { checkpoint?: WildsWorldCheckpoint; events?: WildsWorldEvent[] }) {
    this.projection = input?.checkpoint ? replayWildsWorld([], input.checkpoint) : initialWildsWorldProjection();
    this.eventTail = [];
    for (const event of input?.events ?? []) this.appendExisting(event);
  }

  snapshot() {
    return this.projection;
  }

  checkpoint() {
    return checkpointWildsWorld(this.projection);
  }

  events() {
    return [...this.eventTail];
  }

  private appendExisting(event: WildsWorldEvent) {
    this.projection = reduceWildsWorldEvent(this.projection, event);
    this.eventTail = [...this.eventTail, event].slice(-2_048);
  }

  private append(kind: WildsWorldEventKind, payload: unknown, authority: Pick<WildsWorldAuthority, "actorId" | "pulse" | "occurredAt">, causeId: string) {
    const kaiKlok = this.projection.cursor?.pulse === authority.pulse ? this.projection.cursor.kaiKlok + 1 : 1;
    const event = createWildsWorldEvent({
      kind,
      actorId: authority.actorId,
      causeId,
      pulse: authority.pulse,
      kaiKlok,
      occurredAt: authority.occurredAt,
      previousEventId: this.projection.cursor?.eventId ?? null,
      payload
    });
    this.appendExisting(event);
    return event;
  }

  tick(input: { pulse: string; occurredAt: string; systemActorId: "receiz:pulse" }) {
    if (input.systemActorId !== "receiz:pulse") throw new Error("wilds_world_pulse_authority_invalid");
    const causeId = `pulse:${input.pulse}`;
    if (this.eventTail.some((event) => event.causeId === causeId)) return { events: [], projection: this.projection };
    const authority = { actorId: input.systemActorId, pulse: input.pulse, occurredAt: input.occurredAt };
    const activeSites = Object.values(this.projection.sites).filter((site): site is WildsDynamicSite => site.familyId === "crystal-burrow") as WildsDynamicSite[];
    const site = generateCrystalBurrow({ pulse: input.pulse, ordinal: activeSites.length + 1, activeSites });
    const events: WildsWorldEvent[] = [];
    events.push(this.append("site.spawned", { site }, authority, causeId));
    const tracked = advanceDynamicSite(site, "tracked");
    events.push(this.append("site.phase_changed", { siteId: site.id, phase: tracked.phase }, authority, causeId));
    const emerged = advanceDynamicSite(tracked, "emerged");
    events.push(this.append("site.phase_changed", { siteId: site.id, phase: emerged.phase }, authority, causeId));
    const boss = generateWildsBoss({ familyId: "crystal-burrower", site: emerged, pulse: input.pulse, ordinal: 1, existingBosses: Object.values(this.projection.bosses) as WildsBossDefinition[] });
    const raid = createWildsRaidRound({ boss, ordinal: 1, openedAt: input.occurredAt });
    events.push(this.append("boss.emerged", { boss, raid }, authority, causeId));
    return { events, projection: this.projection };
  }

  tickEcology(input: { pulse: string; occurredAt: string; systemActorId: "receiz:pulse" }) {
    if (input.systemActorId !== "receiz:pulse") throw new Error("wilds_world_pulse_authority_invalid");
    const causeId = `ecology-pulse:${input.pulse}`;
    if (this.eventTail.some((event) => event.causeId === causeId)) return { events: [], projection: this.projection };
    const authority = { actorId: input.systemActorId, pulse: input.pulse, occurredAt: input.occurredAt };
    const events: WildsWorldEvent[] = [];
    const aftermath = Object.values(this.projection.ecologySites)
      .filter((site) => site.phase === "aftermath")
      .filter((site) => !Object.values(this.projection.ecologySites).some((candidate) => candidate.parentSiteId === site.id));
    for (const parent of aftermath) {
      const existingSites = Object.values(this.projection.ecologySites) as WildsEcologySite[];
      const child = deriveWildsEcologyChild({ parent, ordinal: existingSites.length + 1, existingSites });
      if (child) events.push(this.append("ecology.spawned", { site: ecologyProjection(child) }, authority, causeId));
    }
    const existingSites = Object.values(this.projection.ecologySites) as WildsEcologySite[];
    const ensemble = generateWildsEcologyEnsemble({ pulse: input.pulse, existingSites, ordinalStart: existingSites.length + 1 });
    for (const site of ensemble) events.push(this.append("ecology.spawned", { site: ecologyProjection(site) }, authority, causeId));
    return { events, projection: this.projection };
  }

  execute(command: WildsWorldCommand, authority: WildsWorldAuthority) {
    if (!authority.canonical) throw new Error("wilds_world_canonical_authority_required");
    if (!commandIdValid(command.commandId)) throw new Error("wilds_world_command_id_invalid");
    if (this.eventTail.some((event) => event.causeId === command.commandId)) return { events: [], projection: this.projection };
    const events: WildsWorldEvent[] = [];

    if (command.type === "boss.track") {
      const boss = this.projection.bosses[command.bossId];
      if (!boss) throw new Error("wilds_world_boss_missing");
      const position = boss.position as { x: number; z: number } | undefined;
      const radius = Number(boss.territoryRadius ?? 18);
      if (!position || !positionNear(command.position, position, radius * 2)) throw new Error("wilds_boss_tracking_location_invalid");
      events.push(this.append("site.phase_changed", { siteId: boss.siteId, phase: "tracked", bossId: boss.id, playerId: authority.actorId }, authority, command.commandId));
    } else if (command.type === "raid.enter") {
      const boss = this.projection.bosses[command.bossId];
      const raid = this.projection.raids[command.roundId] as WildsRaidRound | undefined;
      if (!boss || !raid || raid.bossId !== boss.id) throw new Error("wilds_world_raid_missing");
      const position = boss.position as { x: number; z: number } | undefined;
      if (!position || !positionNear(command.position, position, Number(boss.territoryRadius ?? 18))) throw new Error("wilds_raid_location_invalid");
      const admitted = admitWildsRaidParticipant(raid, { playerId: authority.actorId, occurredAt: authority.occurredAt, eventOrdinal: this.projection.revision + 1, preferredSquad: command.preferredSquad });
      events.push(this.append("raid.entered", { raid: admitted.round, boss, playerId: authority.actorId, role: admitted.role, squad: admitted.squad }, authority, command.commandId));
    } else if (command.type === "raid.lease") {
      const boss = this.projection.bosses[command.bossId];
      const raid = this.projection.raids[command.roundId] as WildsRaidRound | undefined;
      if (!boss || !raid || raid.bossId !== boss.id) throw new Error("wilds_world_raid_missing");
      const nextRound = renewWildsRaidLease(raid, { playerId: authority.actorId, status: command.status, occurredAt: authority.occurredAt });
      events.push(this.append("raid.lease_changed", { raid: nextRound, boss, playerId: authority.actorId, status: command.status }, authority, command.commandId));
    } else if (command.type === "raid.retreat") {
      const boss = this.projection.bosses[command.bossId];
      const raid = this.projection.raids[command.roundId] as WildsRaidRound | undefined;
      if (!boss || !raid || raid.bossId !== boss.id) throw new Error("wilds_world_raid_missing");
      const nextRound = retreatWildsRaidParticipant(raid, { playerId: authority.actorId, occurredAt: authority.occurredAt });
      events.push(this.append("raid.retreated", { raid: nextRound, boss, playerId: authority.actorId }, authority, command.commandId));
    } else if (command.type === "raid.act") {
      if (!authority.card) throw new Error("wilds_world_verified_card_required");
      const boss = this.projection.bosses[command.bossId] as unknown as WildsBossDefinition | undefined;
      const raid = this.projection.raids[command.roundId] as WildsRaidRound & { encounter?: ReturnType<typeof createWildsRaidEncounter> } | undefined;
      if (!boss || !raid || raid.bossId !== boss.id) throw new Error("wilds_world_raid_missing");
      if (!raid.squads.flat().includes(authority.actorId) && !raid.supportPlayerIds.includes(authority.actorId)) throw new Error("wilds_raid_player_not_admitted");
      const encounter = raid.encounter ?? createWildsRaidEncounter({ boss, roundId: raid.id, openedAt: raid.openedAt });
      const nextEncounter = applyWildsRaidIntent(encounter, { type: command.intent, commandId: command.commandId }, {
        actorId: authority.actorId, card: authority.card, eventOrdinal: this.projection.revision + 1, occurredAt: authority.occurredAt
      });
      const nextBoss = { ...boss, health: nextEncounter.bossHealth, phase: nextEncounter.phase === "active" ? "contested" : nextEncounter.phase } as WildsBossDefinition;
      const nextRound = nextEncounter.phase === "defeated"
        ? { ...settleWildsRaidRound(raid, { occurredAt: authority.occurredAt, winningEventId: command.commandId }), encounter: nextEncounter }
        : { ...raid, phase: nextEncounter.phase === "transforming" ? "transformation_lock" as const : "active" as const, encounter: nextEncounter };
      const acceptedAction = nextEncounter.actions.at(-1);
      events.push(this.append("raid.acted", { raid: nextRound, boss: nextBoss, playerId: authority.actorId, acceptedAction: acceptedAction ? { ...acceptedAction } : null }, authority, command.commandId));
      if (nextEncounter.phase === "defeated") {
        events.push(this.append("boss.defeated", { bossId: boss.id, defeatedAt: authority.occurredAt, winningCommandId: command.commandId }, authority, command.commandId));
      }
    } else if (command.type === "ecology.discover") {
      const site = this.projection.ecologySites[command.siteId];
      if (!site || site.phase !== "foreshadowed") throw new Error("wilds_ecology_discovery_phase_invalid");
      if (!positionNear(command.position, site.position, site.radius)) throw new Error("wilds_ecology_location_invalid");
      const discovered: WildsWorldEcologyProjection = {
        ...site,
        phase: "discovered",
        discoveredAt: authority.occurredAt,
        discoveredBy: authority.actorId
      };
      events.push(this.append("ecology.discovered", { site: discovered, playerId: authority.actorId }, authority, command.commandId));
    } else if (command.type === "ecology.contribute") {
      if (!/^sha256:[a-f0-9]{64}$/.test(command.cardProofDigest)) throw new Error("wilds_world_card_proof_invalid");
      if (!Number.isSafeInteger(command.amount) || command.amount < 1 || command.amount > 10) throw new Error("wilds_ecology_contribution_invalid");
      let site = this.projection.ecologySites[command.siteId];
      if (!site || (site.phase !== "discovered" && site.phase !== "active")) throw new Error("wilds_ecology_contribution_phase_invalid");
      if (!positionNear(command.position, site.position, site.radius)) throw new Error("wilds_ecology_location_invalid");
      if (site.phase === "discovered") {
        events.push(this.append("ecology.phase_changed", { siteId: site.id, phase: "active" }, authority, command.commandId));
        site = this.projection.ecologySites[site.id]!;
      }
      const contributed: WildsWorldEcologyProjection = {
        ...site,
        contributionTotal: Math.min(10, site.contributionTotal + command.amount),
        participantIds: site.participantIds.includes(authority.actorId) ? site.participantIds : [...site.participantIds, authority.actorId].slice(-128)
      };
      events.push(this.append("ecology.contributed", { site: contributed, playerId: authority.actorId, amount: command.amount, cardProofDigest: command.cardProofDigest }, authority, command.commandId));
      if (contributed.contributionTotal >= 10) {
        events.push(this.append("ecology.phase_changed", { siteId: site.id, phase: "resolving" }, authority, command.commandId));
        const resolved: WildsWorldEcologyProjection = { ...contributed, phase: "aftermath", resolvedAt: authority.occurredAt };
        events.push(this.append("ecology.resolved", { site: resolved }, authority, command.commandId));
      }
    } else if (command.type === "raid.join") {
      const raid = Object.values(this.projection.raids).find((item) => item.bossId === command.bossId) as WildsRaid | undefined;
      if (!raid) throw new Error("wilds_world_raid_missing");
      const admitted = admitRaidPlayer(raid, authority.actorId, command.preferredSquad);
      events.push(this.append("raid.joined", { raid: admitted.raid, playerId: authority.actorId, role: admitted.role, squad: admitted.squad }, authority, command.commandId));
    } else if (command.type === "raid.contribute") {
      if (!/^sha256:[a-f0-9]{64}$/.test(command.cardProofDigest)) throw new Error("wilds_world_card_proof_invalid");
      const raid = Object.values(this.projection.raids).find((item) => item.bossId === command.bossId) as WildsRaid | undefined;
      const boss = this.projection.bosses[command.bossId] as WildsBoss | undefined;
      if (!raid || !boss) throw new Error("wilds_world_raid_missing");
      const contributionId = `contribution:${command.commandId}`;
      const result = applyRaidContribution({ ...command, raid, boss, playerId: authority.actorId, eventId: contributionId, occurredAt: authority.occurredAt });
      events.push(this.append("raid.contributed", { raid: result.raid, boss: result.boss, playerId: authority.actorId, cardProofDigest: command.cardProofDigest }, authority, command.commandId));
      const team = Object.values(this.projection.teams).find((item) => item.memberIds.includes(authority.actorId));
      if (team) {
        const league = scoreWildsLeague({ league: this.projection.league, teamId: team.id, eventId: contributionId, raidContribution: command.damage + command.support });
        events.push(this.append("league.scored", { league, teamId: team.id, contributionId }, authority, command.commandId));
      }
      if (result.defeated) {
        events.push(this.append("boss.defeated", { bossId: boss.id, defeatedAt: result.boss.defeatedAt }, authority, command.commandId));
        events.push(this.append("site.phase_changed", { siteId: boss.siteId, phase: "defeated" }, authority, command.commandId));
        events.push(this.append("site.memorialized", { siteId: boss.siteId, bossId: boss.id }, authority, command.commandId));
      }
    } else if (command.type === "team.create") {
      if (Object.values(this.projection.teams).some((team) => team.memberIds.includes(authority.actorId))) throw new Error("wilds_team_membership_exists");
      const team = createWildsTeam({ captainId: authority.actorId, name: command.name, occurredAt: authority.occurredAt, existingTeams: Object.values(this.projection.teams) });
      events.push(this.append("team.created", { team }, authority, command.commandId));
    } else if (command.type === "team.join") {
      if (Object.values(this.projection.teams).some((team) => team.memberIds.includes(authority.actorId))) throw new Error("wilds_team_membership_exists");
      const team = this.projection.teams[command.teamId];
      if (!team) throw new Error("wilds_team_missing");
      events.push(this.append("team.joined", { team: joinWildsTeam(team, authority.actorId) }, authority, command.commandId));
    }
    return { events, projection: this.projection };
  }
}

function positionNear(left: { x: number; z: number }, right: { x: number; z: number }, radius: number) {
  return Number.isFinite(left.x) && Number.isFinite(left.z) && Math.hypot(left.x - right.x, left.z - right.z) <= radius;
}

function ecologyProjection(site: WildsEcologySite): WildsWorldEcologyProjection {
  return {
    ...site,
    discoveredAt: null,
    discoveredBy: null,
    contributionTotal: 0,
    participantIds: [],
    resolvedAt: null
  };
}
