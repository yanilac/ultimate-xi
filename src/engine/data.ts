import type { Club, Player, Position, Role, SeasonData } from "./types";

/** The season files as written by pipeline/build.py. */
interface RawSeason {
  season: string;
  games: number;
  fields: string[];
  clubs: { name: string; finish: number; points: number; players: unknown[][] }[];
}

export function parseSeason(raw: RawSeason): SeasonData {
  const f = Object.fromEntries(raw.fields.map((name, i) => [name, i])) as Record<string, number>;
  const get = <T>(row: unknown[], name: string) => row[f[name]!] as T;
  const clubs: Club[] = raw.clubs.map((c) => ({
    name: c.name,
    finish: c.finish,
    points: c.points,
    players: c.players.map((row): Player => {
      const id = get<number>(row, "id");
      const minutes = get<number>(row, "minutes");
      const goals = get<number>(row, "goals");
      return {
        key: `${id}@${raw.season}`,
        personId: `pl:${id}`,
        name: get<string>(row, "name"),
        role: get<Role>(row, "role"),
        positions: get<string>(row, "positions").split("/") as Position[],
        nation: get<string | null>(row, "nation"),
        rating: get<number>(row, "rating"),
        season: raw.season,
        club: c.name,
        icon: false,
        goalsPer90: minutes > 0 ? (goals * 90) / minutes : 0,
        apps: get<number>(row, "apps"),
        goals,
        assists: get<number>(row, "assists"),
        minutes,
        draftable: get<number>(row, "draftable") === 1,
      };
    }),
  }));
  return { season: raw.season, games: raw.games, clubs };
}

/** "2003-04" -> 2003 */
export function seasonStart(season: string): number {
  return Number(season.slice(0, 4));
}
