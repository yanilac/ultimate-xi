import { type Formation, getFormation } from "./formations";
import { ICON_PLAYERS } from "./icons";
import { canPlay } from "./positions";
import { createRng, type Rng } from "./rng";
import type { Lineup } from "./chemistry";
import type { Player, SeasonData } from "./types";

export const OPTIONS_PER_SPIN = 4;
export const RESPINS_PER_RUN = 2;
/** Chance that a spin is an Icon spin, while the run hasn't had one yet. */
export const ICON_CHANCE = 0.05;
/** Options come from the club's best this-many players that season (its regulars). */
export const SQUAD_POOL = 6;
/** How many of the options should fit an open slot, when the squad allows. */
export const MIN_FITTING = 2;

export type Spin =
  | { kind: "club"; season: string; club: string; options: Player[] }
  | { kind: "icon"; options: Player[] };

export interface DraftState {
  seed: string;
  formation: string;
  lineup: Lineup;
  /** The season the finished XI will play in. */
  leagueSeason: string;
  respinsLeft: number;
  iconSpinUsed: boolean;
  /** Counts every spin, including re-spins, so each one gets its own random stream. */
  spinCount: number;
  current: Spin | null;
}

export function startDraft(seed: string, formation: string, seasons: SeasonData[]): DraftState {
  const f = getFormation(formation);
  const rng = createRng(`${seed}:league`);
  const state: DraftState = {
    seed,
    formation,
    lineup: f.slots.map(() => null),
    leagueSeason: rng.pick(seasons).season,
    respinsLeft: RESPINS_PER_RUN,
    iconSpinUsed: false,
    spinCount: 0,
    current: null,
  };
  return spin(state, seasons);
}

export function isComplete(state: DraftState): boolean {
  return state.lineup.every((p) => p !== null);
}

export function openSlots(state: DraftState): number[] {
  return state.lineup.flatMap((p, i) => (p === null ? [i] : []));
}

/** Slots the player could be placed in right now. */
export function slotsFor(state: DraftState, player: Player): number[] {
  const f = getFormation(state.formation);
  return openSlots(state).filter((i) => canPlay(player, f.slots[i]!.pos));
}

function usedPeople(state: DraftState): Set<string> {
  return new Set(state.lineup.flatMap((p) => (p ? [p.personId] : [])));
}

function fitsSomewhere(state: DraftState, f: Formation, player: Player): boolean {
  return openSlots(state).some((i) => canPlay(player, f.slots[i]!.pos));
}

function iconSpin(state: DraftState, f: Formation, rng: Rng): Spin | null {
  const used = usedPeople(state);
  const pool = ICON_PLAYERS.filter((p) => !used.has(p.personId));
  // Lead with Icons that fit an open slot, so the spin is never a dead end.
  const fitting = rng.shuffle(pool.filter((p) => fitsSomewhere(state, f, p)));
  if (fitting.length === 0) return null;
  const rest = rng.shuffle(pool.filter((p) => !fitting.includes(p)));
  const options = rng.shuffle([...fitting.slice(0, 2), ...rest].slice(0, OPTIONS_PER_SPIN));
  return { kind: "icon", options };
}

/** Clubs that finished higher come up more often (top club about three times as often as the bottom one). */
function clubWeight(finish: number, clubs: number): number {
  return 1 + 9 * ((clubs - finish) / clubs) ** 2;
}

function clubSpin(state: DraftState, f: Formation, rng: Rng, seasons: SeasonData[]): Spin {
  const used = usedPeople(state);
  for (let attempt = 0; attempt < 200; attempt++) {
    const season = rng.pick(seasons);
    const club = rng.weighted(season.clubs, (c) => clubWeight(c.finish, season.clubs.length));
    const pool = club.players
      .filter((p) => p.draftable)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, SQUAD_POOL)
      .filter((p) => !used.has(p.personId));
    if (pool.length < OPTIONS_PER_SPIN) continue;
    // Up to MIN_FITTING options that fit an open slot, the rest from anyone in the squad.
    const fitting = rng.shuffle(pool.filter((p) => fitsSomewhere(state, f, p)));
    // No one in this squad fits an open slot: re-spin for free.
    if (fitting.length === 0) continue;
    const chosen = fitting.slice(0, MIN_FITTING);
    const rest = rng.shuffle(pool.filter((p) => !chosen.includes(p)));
    const options = rng.shuffle([...chosen, ...rest].slice(0, OPTIONS_PER_SPIN));
    return { kind: "club", season: season.season, club: club.name, options };
  }
  throw new Error("no club spin could fill an open slot");
}

function spin(state: DraftState, seasons: SeasonData[]): DraftState {
  if (isComplete(state)) return { ...state, current: null };
  const f = getFormation(state.formation);
  const rng = createRng(`${state.seed}:spin:${state.spinCount}`);
  let current: Spin | null = null;
  if (!state.iconSpinUsed && rng.next() < ICON_CHANCE) current = iconSpin(state, f, rng);
  current ??= clubSpin(state, f, rng, seasons);
  return {
    ...state,
    current,
    spinCount: state.spinCount + 1,
    iconSpinUsed: state.iconSpinUsed || current.kind === "icon",
  };
}

/** Use one of the run's re-spins on the current round. */
export function respin(state: DraftState, seasons: SeasonData[]): DraftState {
  if (state.respinsLeft <= 0 || !state.current) throw new Error("no re-spins left");
  return spin({ ...state, respinsLeft: state.respinsLeft - 1 }, seasons);
}

/** Place one of the current options in an open slot, then spin the next round. */
export function pick(state: DraftState, playerKey: string, slot: number, seasons: SeasonData[]): DraftState {
  const player = state.current?.options.find((p) => p.key === playerKey);
  if (!player) throw new Error(`${playerKey} is not on offer`);
  if (!slotsFor(state, player).includes(slot)) throw new Error(`${player.name} can't play slot ${slot}`);
  const lineup = [...state.lineup];
  lineup[slot] = player;
  return spin({ ...state, lineup, current: null }, seasons);
}

/** Swap two placed players, if each can play the other's slot. */
export function swap(state: DraftState, a: number, b: number): DraftState {
  const f = getFormation(state.formation);
  const pa = state.lineup[a] ?? null;
  const pb = state.lineup[b] ?? null;
  const ok = (p: Player | null, slot: number) => p === null || canPlay(p, f.slots[slot]!.pos);
  if (!ok(pa, b) || !ok(pb, a)) throw new Error("those players can't swap");
  const lineup = [...state.lineup];
  lineup[a] = pb;
  lineup[b] = pa;
  return { ...state, lineup };
}
