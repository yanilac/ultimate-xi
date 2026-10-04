/**
 * Shared leaderboard, stored in a Supabase table (see docs/leaderboard.sql).
 * The publishable key is public by design: the table only allows reading and adding
 * rows. Every entry carries its run code, and the board replays each run
 * before showing it, so a row whose record doesn't match its replay is hidden.
 */
import { simulateSeason, type SeasonData, type SeasonResult } from "../engine";
import { modeOfSeason, type Mode } from "./modes";
import { decodeRun, encodeRun, lineupFromKeys, type RunCode } from "./run";

// Filled in once the Supabase project exists. Empty means the leaderboard is hidden.
const SUPABASE_URL: string = "";
const SUPABASE_ANON_KEY: string = "sb_publishable_WPxuuH2NjxJ5gKFaNrtFag_tUHCcqs-";

export const leaderboardEnabled = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

export type Period = "today" | "week" | "all";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "all", label: "All time" },
];

export interface Entry {
  name: string;
  season: string;
  formation: string;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  ppg: number;
  gd: number;
  position: number;
  seed: string;
  /** The run code (stored in the table's link column). */
  link: string;
  created_at: string;
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

export async function fetchBoard(mode: Mode, period: Period): Promise<Entry[]> {
  const q = new URLSearchParams({
    select: "name,season,formation,won,drawn,lost,points,ppg,gd,position,seed,link,created_at",
    mode: `eq.${mode}`,
    order: "ppg.desc,gd.desc,created_at.asc",
    limit: "100",
  });
  const since = periodStart(period);
  if (since) q.set("created_at", `gte.${since.toISOString()}`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores?${q}`, { headers: headers() });
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return (await res.json()) as Entry[];
}

/** Replay an entry's run and check it reproduces the record it claims. */
export function verifyEntry(e: Entry, seasons: SeasonData[]): boolean {
  if (!/^[A-Za-z0-9_-]{1,600}$/.test(e.link)) return false;
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

/** Add a finished run. Resolves true if added, or if this run was already on the board. */
export async function submitEntry(name: string, run: RunCode, result: SeasonResult): Promise<boolean> {
  const { row, position } = result.user;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({
      mode: modeOfSeason(run.league),
      name,
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
    }),
  });
  return res.ok || res.status === 409;
}

const NAME_KEY = "ultimate-xi:name";
const MINE_KEY = "ultimate-xi:submitted";

export function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* storage unavailable */
  }
}

/** Seeds this device has submitted, to highlight your own rows. */
export function readSubmitted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function markSubmitted(seed: string) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify([...readSubmitted(), seed].slice(-200)));
  } catch {
    /* storage unavailable */
  }
}
