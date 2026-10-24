/**
 * Shared leaderboard, stored in a Supabase table (see docs/leaderboard.sql).
 * The publishable key is public by design: the table only allows reading and adding
 * rows. Every finished season you draft is added automatically once you've
 * given a name. The board ranks people by titles won in the period, one row
 * each, and replays every title before counting it, so a doctored record
 * doesn't count.
 */
import { simulateSeason, type SeasonData, type SeasonResult } from "../engine";
import { modeOfSeason, type Mode } from "./modes";
import { addSeason, EMPTY_CAREER, type Career } from "./career";
import { decodeRun, encodeRun, lineupFromKeys, type RunCode } from "./run";

// Public values for the Supabase project. Empty would hide the leaderboard.
const SUPABASE_URL: string = "https://gmvozoufvqdmjnvrrwif.supabase.co";
const SUPABASE_ANON_KEY: string = "sb_publishable_WPxuuH2NjxJ5gKFaNrtFag_tUHCcqs-";

export const leaderboardEnabled = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

export type Period = "today" | "week" | "all";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "all", label: "All time" },
];

/** One finished season as stored. */
export interface Entry {
  name: string;
  /** Random id for the device that played it; absent on rows from before it existed. */
  player?: string | null;
  season: string;
  formation: string;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  position: number;
  seed: string;
  /** The run code (stored in the table's link column). */
  link: string;
  created_at: string;
}

/** One person on the board. */
export interface BoardRow {
  key: string;
  name: string;
  titles: number;
  /** Their best title-winning season: most points per game, then goal difference. */
  best: Entry;
}

// Publishable keys go in the apikey header only; they aren't JWTs, so no Authorization header.
const headers = () => ({
  apikey: SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
});

/** Start of the period in the viewer's time: midnight today, or Monday midnight this week. */
export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === "all") return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Seasons being sent right now. The board waits for them so your latest season shows.
const inFlight = new Set<Promise<unknown>>();
function track<T>(p: Promise<T>): Promise<T> {
  inFlight.add(p);
  void p.finally(() => inFlight.delete(p)).catch(() => {});
  return p;
}

// Board reads must never come from a browser or CDN cache, or today's seasons go missing.
const getRows = (url: string) => fetch(url, { headers: headers(), cache: "no-store" });

/** Every title won in a mode during the period, newest first. */
export async function fetchTitles(mode: Mode, period: Period): Promise<Entry[]> {
  // Seasons that couldn't be sent earlier get another go first.
  if (readPending().length > 0) void flushPending();
  await Promise.allSettled([...inFlight]);
  const q = new URLSearchParams({ select: "*", mode: `eq.${mode}`, position: "eq.1", order: "created_at.desc", limit: "1000" });
  const since = periodStart(period);
  if (since) q.set("created_at", `gte.${since.toISOString()}`);
  const res = await getRows(`${SUPABASE_URL}/rest/v1/scores?${q}`);
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return (await res.json()) as Entry[];
}

export function pointsPerGame(e: Pick<Entry, "won" | "drawn" | "lost">): number {
  return (e.won * 3 + e.drawn) / Math.max(1, e.won + e.drawn + e.lost);
}

/** Replay an entry's run and check it reproduces the record it claims. */
export function verifyEntry(e: Entry, seasons: SeasonData[]): boolean {
  if (typeof e.link !== "string" || !/^[A-Za-z0-9_-]{1,600}$/.test(e.link)) return false;
  const run = decodeRun(e.link);
  if (!run || run.seed !== e.seed || run.league !== e.season || run.formation !== e.formation) return false;
  const season = seasons.find((s) => s.season === run.league);
  const lineup = lineupFromKeys(run.xi, seasons);
  if (!season || !lineup) return false;
  try {
    const { user } = simulateSeason(run.seed, season, run.formation, lineup);
    return (
      user.row.won === e.won && user.row.drawn === e.drawn && user.row.lost === e.lost &&
      user.row.goalsFor - user.row.goalsAgainst === e.gd && user.position === e.position
    );
  } catch {
    return false;
  }
}

// Replays are deterministic, so each seed only needs checking once per visit.
const verified = new Map<string, boolean>();

/** The person an entry belongs to: their device id, or their name for older rows. */
export function personKey(e: Pick<Entry, "player" | "name">): string {
  return e.player ? `p:${e.player}` : `n:${e.name.trim().toLowerCase()}`;
}

function better(a: Entry, b: Entry): boolean {
  const d = pointsPerGame(a) - pointsPerGame(b);
  return d !== 0 ? d > 0 : a.gd > b.gd;
}

/**
 * One row per person: titles won, ranked by titles, then their best title
 * season's points per game, then its goal difference. Entries must be newest
 * first, so each row shows the name the person used most recently.
 */
export function buildBoard(entries: Entry[], seasons: SeasonData[]): BoardRow[] {
  const rows = new Map<string, BoardRow>();
  for (const e of entries) {
    if (e.position !== 1) continue;
    let ok = verified.get(e.seed);
    if (ok === undefined) verified.set(e.seed, (ok = verifyEntry(e, seasons)));
    if (!ok) continue;
    const key = personKey(e);
    const row = rows.get(key);
    if (!row) rows.set(key, { key, name: e.name, titles: 1, best: e });
    else {
      row.titles++;
      if (better(e, row.best)) row.best = e;
    }
  }
  // Rows from before player ids existed only have a name: fold them into
  // the person now using that name, if there is one.
  for (const [key, row] of rows) {
    if (!key.startsWith("n:")) continue;
    const owner = [...rows.values()].find((r) => r.key.startsWith("p:") && r.name.trim().toLowerCase() === key.slice(2));
    if (!owner) continue;
    owner.titles += row.titles;
    if (better(row.best, owner.best)) owner.best = row.best;
    rows.delete(key);
  }
  return [...rows.values()].sort((a, b) =>
    b.titles - a.titles || pointsPerGame(b.best) - pointsPerGame(a.best) || b.best.gd - a.best.gd,
  );
}

// PostgREST filter value in double quotes, so commas and brackets in names are safe.
const quoted = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
// Case-insensitive name match. * is ilike's wildcard, so it's dropped; % and _ in a name could match loosely.
const nameMatch = (name: string) => `name.ilike.${quoted(name.trim().replace(/\*/g, ""))}`;

/** Every season a person has played in a mode, oldest first. */
export async function fetchPersonSeasons(mode: Mode, row: Pick<BoardRow, "key" | "name">): Promise<Entry[]> {
  const get = async (filter: [string, string]) => {
    const q = new URLSearchParams({ select: "*", mode: `eq.${mode}`, order: "created_at.asc", limit: "1000" });
    q.set(...filter);
    await Promise.allSettled([...inFlight]);
    const res = await getRows(`${SUPABASE_URL}/rest/v1/scores?${q}`);
    if (!res.ok) throw Object.assign(new Error(`leaderboard ${res.status}`), { status: res.status });
    return (await res.json()) as Entry[];
  };
  const byName: [string, string] = ["or", `(${nameMatch(row.name)})`];
  if (!row.key.startsWith("p:")) return get(byName);
  const player = row.key.slice(2);
  try {
    // Their device's seasons, plus older name-only rows under the same name (as the board counts them).
    return await get(["or", `(player.eq.${quoted(player)},and(player.is.null,${nameMatch(row.name)}))`]);
  } catch (e) {
    // A table without the player column: fall back to the name.
    if ((e as { status?: number }).status === 400) return get(byName);
    throw e;
  }
}

/** A person's record from their seasons (oldest first), counting only seasons whose replay checks out. */
export function personRecord(entries: Entry[], seasons: SeasonData[]): Career {
  let career = EMPTY_CAREER;
  for (const e of entries) {
    let ok = verified.get(e.seed);
    if (ok === undefined) verified.set(e.seed, (ok = verifyEntry(e, seasons)));
    if (ok) career = addSeason(career, e.seed, e.position, e.lost === 0);
  }
  return career;
}

type Body = Record<string, string | number>;

function entryBody(name: string, run: RunCode, result: SeasonResult): Body {
  const { row, position } = result.user;
  return {
    mode: modeOfSeason(run.league),
    name,
    player: playerId(),
    season: run.league,
    formation: run.formation,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    games: row.won + row.drawn + row.lost,
    gd: row.goalsFor - row.goalsAgainst,
    position,
    seed: run.seed,
    link: encodeRun(run),
  };
}

async function post(body: Body): Promise<boolean> {
  const send = (b: Body) =>
    fetch(`${SUPABASE_URL}/rest/v1/scores`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify(b),
    });
  let res = await send(body);
  // Tables made before the player column existed reject it; send the row without it.
  if (res.status === 400 && "player" in body) {
    const { player: _player, ...rest } = body;
    res = await send(rest);
  }
  return res.ok || res.status === 409; // 409: this run is already on the board
}

/** Add a finished season. If it can't be sent now, it's kept and sent next time. */
export function submitEntry(name: string, run: RunCode, result: SeasonResult): Promise<boolean> {
  return track(sendEntry(name, run, result));
}

async function sendEntry(name: string, run: RunCode, result: SeasonResult): Promise<boolean> {
  const body = entryBody(name, run, result);
  try {
    if (await post(body)) return true;
  } catch {
    /* offline: keep it for later */
  }
  savePending([...readPending().filter((b) => b.seed !== body.seed), body]);
  return false;
}

/** Send any seasons that couldn't be sent earlier. */
export function flushPending(): Promise<void> {
  return track(sendPending());
}

async function sendPending(): Promise<void> {
  const pending = readPending();
  if (pending.length === 0) return;
  const left: Body[] = [];
  for (const b of pending) {
    try {
      if (!(await post(b))) left.push(b);
    } catch {
      left.push(b);
    }
  }
  savePending(left);
}

const NAME_KEY = "ultimate-xi:name";
const PLAYER_KEY = "ultimate-xi:player";
const PENDING_KEY = "ultimate-xi:pending";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function readName(): string {
  return read(NAME_KEY) ?? "";
}

export function saveName(name: string) {
  write(NAME_KEY, name);
}

let sessionPlayer: string | null = null;

/** A random id for this device, so two people with the same name stay apart. */
export function playerId(): string {
  let id = read(PLAYER_KEY) ?? sessionPlayer;
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    write(PLAYER_KEY, id);
    sessionPlayer = id;
  }
  return id;
}

function readPending(): Body[] {
  try {
    return JSON.parse(read(PENDING_KEY) ?? "[]") as Body[];
  } catch {
    return [];
  }
}

function savePending(list: Body[]) {
  write(PENDING_KEY, JSON.stringify(list.slice(-20)));
}
