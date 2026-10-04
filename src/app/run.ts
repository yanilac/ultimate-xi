import { ICON_PLAYERS, type Lineup, type Player, type SeasonData } from "../engine";

/** Everything needed to replay a finished run: the seed, formation, league season and the XI. */
export interface RunCode {
  seed: string;
  formation: string;
  league: string;
  /** Player card key per slot. */
  xi: string[];
}

export function encodeRun(run: RunCode): string {
  const json = JSON.stringify([run.seed, run.formation, run.league, run.xi]);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeRun(code: string): RunCode | null {
  try {
    const json = decodeURIComponent(escape(atob(code.replace(/-/g, "+").replace(/_/g, "/"))));
    const [seed, formation, league, xi] = JSON.parse(json) as [string, string, string, string[]];
    if (typeof seed !== "string" || !Array.isArray(xi)) return null;
    return { seed, formation, league, xi };
  } catch {
    return null;
  }
}

/** Find the player cards named in a run code. Returns null if any is missing. */
export function lineupFromKeys(keys: string[], seasons: SeasonData[]): Lineup | null {
  const bySeason = new Map(seasons.map((s) => [s.season, s]));
  const lineup = keys.map((key): Player | null => {
    if (key.startsWith("icon:")) return ICON_PLAYERS.find((p) => p.key === key) ?? null;
    const season = bySeason.get(key.split("@")[1] ?? "");
    for (const club of season?.clubs ?? []) {
      const p = club.players.find((x) => x.key === key);
      if (p) return p;
    }
    return null;
  });
  return lineup.every((p) => p !== null) ? lineup : null;
}

export function shareUrl(run: RunCode): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = `r=${encodeRun(run)}`;
  return url.toString();
}

export function runFromLocation(): RunCode | null {
  const match = window.location.hash.match(/r=([A-Za-z0-9_-]+)/);
  return match ? decodeRun(match[1]!) : null;
}

export function newSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
