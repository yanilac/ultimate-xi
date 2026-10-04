import { parseSeason, type SeasonData, type SeasonIndexEntry } from "../engine";

let cache: Promise<SeasonData[]> | null = null;

/** Fetch every season file once (about 400 KB compressed) and keep it for the session. */
export function loadSeasons(): Promise<SeasonData[]> {
  cache ??= (async () => {
    const base = import.meta.env.BASE_URL;
    const index = (await (await fetch(`${base}data/index.json`)).json()) as { seasons: SeasonIndexEntry[] };
    return Promise.all(
      index.seasons.map(async (s) => parseSeason(await (await fetch(`${base}data/seasons/${s.season}.json`)).json())),
    );
  })();
  cache.catch(() => (cache = null));
  return cache;
}

/** "2003-04" -> "2003/04" for display. */
export function seasonLabel(season: string): string {
  return season.replace("-", "/");
}
