import { type Lineup, teamChemistry } from "./chemistry";
import { getFormation } from "./formations";
import { createRng, type Rng } from "./rng";
import type { Club, Player, Position, SeasonData } from "./types";

// --- Match model constants (tuned with scripts/tune.ts) ---------------------
/** Goals per team per game between two equal sides, before home advantage. */
export const BASE_GOALS = 1.25;
/** Log-goal change per 10 points of attack-minus-defence difference. */
export const STRENGTH_EFFECT = 0.55;
/** Log-goal home advantage (added at home, taken away on the road). */
export const HOME_ADVANTAGE = 0.12;
/** Real clubs play together every week, so they get the chemistry of a well-linked side. */
export const CLUB_CHEM_BONUS = 0;
/**
 * Difficulty: added to every effective rating in the user's XI. Real clubs are
 * tuned to replay real seasons accurately, so this is the one knob for how often
 * a good draft wins the league. Set for "Generous": a well-drafted XI wins about
 * 1 in 3 seasons and an unbeaten season is a realistic chase.
 */
export const USER_BONUS = 0;

type Line = "G" | "D" | "M" | "F";

const LINE: Record<Position, Line> = {
  GK: "G",
  RB: "D", CB: "D", LB: "D", RWB: "D", LWB: "D",
  CDM: "M", CM: "M", CAM: "M", RM: "M", LM: "M",
  RW: "F", LW: "F", CF: "F", ST: "F",
};
const ATTACK_WEIGHT: Record<Line, number> = { G: 0, D: 0.5, M: 2, F: 3 };
const DEFENCE_WEIGHT: Record<Line, number> = { G: 3, D: 2, M: 1, F: 0 };
const SCORER_WEIGHT: Record<Line, number> = { G: 0, D: 0.1, M: 0.45, F: 1 };

export interface TeamSheet {
  name: string;
  isUser: boolean;
  attack: number;
  defence: number;
  /** The XI with the line each one plays in and his effective rating. */
  xi: { player: Player; line: Line; effective: number }[];
}

function sheet(name: string, isUser: boolean, xi: TeamSheet["xi"]): TeamSheet {
  const avg = (w: Record<Line, number>) => {
    const total = xi.reduce((s, p) => s + w[p.line], 0);
    return xi.reduce((s, p) => s + w[p.line] * p.effective, 0) / total;
  };
  return { name, isUser, attack: avg(ATTACK_WEIGHT), defence: avg(DEFENCE_WEIGHT), xi };
}

export function userSheet(name: string, formationName: string, lineup: Lineup): TeamSheet {
  const formation = getFormation(formationName);
  const chem = teamChemistry(formation, lineup);
  const xi = lineup.map((player, i) => {
    if (!player) throw new Error("the XI is not complete");
    return { player, line: LINE[formation.slots[i]!.pos], effective: chem.slots[i]!.effective + USER_BONUS };
  });
  return sheet(name, true, xi);
}

/** A real club's best XI in a 4-4-2 shape: 1 keeper, 4 defenders, 4 midfielders, 2 forwards. */
export function clubSheet(club: Club): TeamSheet {
  const byRating = [...club.players].sort((a, b) => b.rating - a.rating);
  const need: Record<Line, number> = { G: 1, D: 4, M: 4, F: 2 };
  const xi: TeamSheet["xi"] = [];
  const taken = new Set<Player>();
  for (const p of byRating) {
    const line = LINE[p.positions[0]!];
    if (need[line] > 0) {
      need[line]--;
      xi.push({ player: p, line, effective: p.rating + CLUB_CHEM_BONUS });
      taken.add(p);
    }
  }
  // Thin squads: fill any gaps with the best players left, in the missing line.
  for (const line of ["G", "D", "M", "F"] as Line[]) {
    while (need[line] > 0) {
      const p = byRating.find((x) => !taken.has(x));
      if (!p) break;
      need[line]--;
      xi.push({ player: p, line, effective: p.rating - 5 + CLUB_CHEM_BONUS });
      taken.add(p);
    }
  }
  return sheet(club.name, false, xi);
}

// --- Fixtures -----------------------------------------------------------------

/** Double round robin by the circle method: each team plays every other home and away. */
export function fixtures(teams: number, rng: Rng): [number, number][][] {
  const order = rng.shuffle([...Array(teams).keys()]);
  const rounds: [number, number][][] = [];
  for (let r = 0; r < teams - 1; r++) {
    const round: [number, number][] = [];
    for (let i = 0; i < teams / 2; i++) {
      const a = order[i]!;
      const b = order[teams - 1 - i]!;
      // Alternate home and away so nobody plays a long run at home.
      round.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    order.splice(1, 0, order.pop()!);
  }
  return [...rounds, ...rounds.map((round) => round.map(([h, a]) => [a, h] as [number, number]))];
}

// --- Matches ------------------------------------------------------------------

export interface Goal {
  team: number;
  minute: number;
  scorer: string;
  scorerKey: string;
}

export interface MatchResult {
  home: number;
  away: number;
  homeGoals: number;
  awayGoals: number;
  goals: Goal[];
}

export function expectedGoals(attacker: TeamSheet, defender: TeamSheet, home: boolean): number {
  const diff = (attacker.attack - defender.defence) / 10;
  return BASE_GOALS * Math.exp(STRENGTH_EFFECT * diff + (home ? HOME_ADVANTAGE : -HOME_ADVANTAGE));
}

function scorer(team: TeamSheet, rng: Rng): Player {
  return rng.weighted(team.xi, (p) => SCORER_WEIGHT[p.line] * (0.15 + p.player.goalsPer90)).player;
}

export function playMatch(teams: TeamSheet[], home: number, away: number, rng: Rng): MatchResult {
  const h = teams[home]!;
  const a = teams[away]!;
  const homeGoals = rng.poisson(expectedGoals(h, a, true));
  const awayGoals = rng.poisson(expectedGoals(a, h, false));
  const goals: Goal[] = [];
  for (const [team, count] of [[home, homeGoals], [away, awayGoals]] as const) {
    for (let g = 0; g < count; g++) {
      const p = scorer(teams[team]!, rng);
      goals.push({ team, minute: 1 + rng.int(90), scorer: p.name, scorerKey: p.key });
    }
  }
  goals.sort((x, y) => x.minute - y.minute);
  return { home, away, homeGoals, awayGoals, goals };
}

// --- Season -------------------------------------------------------------------

export interface TableRow {
  team: number;
  name: string;
  isUser: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface ScorerRow {
  key: string;
  name: string;
  team: number;
  goals: number;
}

export type Badge = "perfect" | "invincibles" | "champions" | "centurions" | "100-goals" | "icon-winner";

export interface SeasonResult {
  season: string;
  teams: TeamSheet[];
  /** The real club the user's XI replaced. */
  replaced: string;
  matchdays: MatchResult[][];
  table: TableRow[];
  topScorers: ScorerRow[];
  user: {
    team: number;
    position: number;
    row: TableRow;
    playerOfSeason: { key: string; name: string; goals: number };
    topScorer: ScorerRow | null;
    badges: Badge[];
  };
}

export const USER_TEAM_NAME = "Your XI";

export function simulateSeason(
  seed: string,
  season: SeasonData,
  formation: string,
  lineup: Lineup,
): SeasonResult {
  const rng = createRng(`${seed}:season`);
  // The XI takes the place of a random club from the bottom half of the real table.
  const bottomHalf = season.clubs.filter((c) => c.finish > season.clubs.length / 2);
  const replaced = rng.pick(bottomHalf);
  const teams = season.clubs.map((c) =>
    c === replaced ? userSheet(USER_TEAM_NAME, formation, lineup) : clubSheet(c),
  );
  const user = teams.findIndex((t) => t.isUser);

  const matchdays = fixtures(teams.length, rng).map((round) =>
    round.map(([h, a]) => playMatch(teams, h, a, rng)),
  );

  const table: TableRow[] = teams.map((t, i) => ({
    team: i, name: t.name, isUser: t.isUser,
    played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
  }));
  const scorers = new Map<string, ScorerRow>();
  const cleanSheets = new Array<number>(teams.length).fill(0);
  for (const m of matchdays.flat()) {
    const record = (team: number, gf: number, ga: number) => {
      const row = table[team]!;
      row.played++;
      row.goalsFor += gf;
      row.goalsAgainst += ga;
      if (gf > ga) { row.won++; row.points += 3; }
      else if (gf === ga) { row.drawn++; row.points += 1; }
      else row.lost++;
      if (ga === 0) cleanSheets[team]!++;
    };
    record(m.home, m.homeGoals, m.awayGoals);
    record(m.away, m.awayGoals, m.homeGoals);
    for (const g of m.goals) {
      const row = scorers.get(g.scorerKey) ?? { key: g.scorerKey, name: g.scorer, team: g.team, goals: 0 };
      row.goals++;
      scorers.set(g.scorerKey, row);
    }
  }

  const sorted = [...table].sort(
    (a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name),
  );
  const topScorers = [...scorers.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  const row = table[user]!;
  const position = sorted.indexOf(row) + 1;

  // Player of the season: effective rating plus goals, and clean sheets for the back line.
  const goalsOf = (key: string) => scorers.get(key)?.goals ?? 0;
  const pots = [...teams[user]!.xi].sort((a, b) => {
    const score = (p: TeamSheet["xi"][number]) =>
      p.effective + 0.4 * goalsOf(p.player.key) +
      (p.line === "G" || p.line === "D" ? 0.25 * cleanSheets[user]! : 0);
    return score(b) - score(a);
  })[0]!.player;

  const badges: Badge[] = [];
  if (row.won === row.played) badges.push("perfect");
  if (row.lost === 0) badges.push("invincibles");
  if (position === 1) badges.push("champions");
  if (row.points >= 100) badges.push("centurions");
  if (row.goalsFor >= 100) badges.push("100-goals");
  if (position === 1 && teams[user]!.xi.some((p) => p.player.icon)) badges.push("icon-winner");

  return {
    season: season.season,
    teams,
    replaced: replaced.name,
    matchdays,
    table: sorted,
    topScorers,
    user: {
      team: user,
      position,
      row,
      playerOfSeason: { key: pots.key, name: pots.name, goals: goalsOf(pots.key) },
      topScorer: topScorers.find((s) => s.team === user) ?? null,
      badges,
    },
  };
}
