import { parseSeason, type SeasonData, type SeasonIndexEntry } from "../engine";
import { modeInfo, modeOfSeason, type Mode } from "./modes";

const cache = new Map<Mode, Promise<SeasonData[]>>();

/** Fetch every season file for a mode once and keep it for the session. */
export function loadSeasons(mode: Mode): Promise<SeasonData[]> {
  let p = cache.get(mode);
  if (!p) {
    p = (async () => {
      const base = `${import.meta.env.BASE_URL}${modeInfo(mode).dataPath}`;
      const index = (await (await fetch(`${base}index.json`)).json()) as { seasons: SeasonIndexEntry[] };
      return Promise.all(
        index.seasons.map(async (s) =>
          parseSeason(await (await fetch(`${base}seasons/${s.file ?? s.season}.json`)).json()),
        ),
      );
    })();
    p.catch(() => cache.delete(mode));
    cache.set(mode, p);
  }
  return p;
}

/** "2003-04" -> "2003/04", "2026-27 LaLiga" -> "2026/27 LaLiga". */
export function seasonLabel(season: string): string {
  return season.replace("-", "/");
}

/** The competition a season is played in, for headings: "2003/04 Premier League", "2026/27 LaLiga". */
export function leagueTitle(season: string): string {
  return modeOfSeason(season) === "top5" ? seasonLabel(season) : `${seasonLabel(season)} Premier League`;
}
