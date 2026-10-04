/**
 * Checks the match model against reality and shows how drafted XIs fare.
 *
 * 1. Real seasons: every club plays its real season with its best XI. Simulated
 *    points should track real points (correlation) with a similar spread.
 * 2. Drafts: a bot drafts many XIs (taking the best-fitting option each round)
 *    and plays them; shows where they finish and how often anyone goes unbeaten.
 *
 * Usage: npm run tune [-- runs] [top5]
 * Top 5 mode has no real points to compare, so it skips step 1.
 */
import {
  clubSheet, createRng, fixtures, isComplete, pick, playMatch, simulateSeason,
  slotsFor, startDraft, FORMATIONS, teamChemistry, getFormation,
  type DraftState, type SeasonData,
} from "../src/engine";
import { loadSeasons } from "./load";

const mode = process.argv.includes("top5") ? "top5" : "pl";
const seasons = loadSeasons(mode);
const runs = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 300);

function mean(xs: number[]) { return xs.reduce((a, b) => a + b, 0) / xs.length; }
function sd(xs: number[]) { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); }
function corr(a: number[], b: number[]) {
  const ma = mean(a), mb = mean(b);
  const cov = mean(a.map((x, i) => (x - ma) * (b[i]! - mb)));
  return cov / (sd(a) * sd(b));
}

function realSeasons() {
  const sim: number[] = [], real: number[] = [], champs: number[] = [], realChamps: number[] = [];
  let goals = 0, games = 0;
  for (const season of seasons) {
    for (let rep = 0; rep < 3; rep++) {
      const rng = createRng(`real:${season.season}:${rep}`);
      const teams = season.clubs.map(clubSheet);
      const pts = new Array(teams.length).fill(0);
      for (const m of fixtures(teams.length, rng).flat().map(([h, a]) => playMatch(teams, h, a, rng))) {
        goals += m.homeGoals + m.awayGoals; games++;
        if (m.homeGoals > m.awayGoals) pts[m.home] += 3;
        else if (m.homeGoals < m.awayGoals) pts[m.away] += 3;
        else { pts[m.home] += 1; pts[m.away] += 1; }
      }
      // Scale 42-game seasons to 38 so every season is comparable.
      const scale = 38 / ((teams.length - 1) * 2);
      season.clubs.forEach((c, i) => { sim.push(pts[i] * scale); real.push(c.points * scale); });
      champs.push(Math.max(...pts) * scale);
      realChamps.push(Math.max(...season.clubs.map((c) => c.points)) * scale);
    }
  }
  console.log("Real seasons replayed (3x each, points per 38 games):");
  console.log(`  correlation sim vs real points: ${corr(sim, real).toFixed(2)}`);
  console.log(`  spread (SD) sim ${sd(sim).toFixed(1)} vs real ${sd(real).toFixed(1)}`);
  console.log(`  champions' points sim ${mean(champs).toFixed(1)} vs real ${mean(realChamps).toFixed(1)}`);
  console.log(`  goals per game ${(goals / games).toFixed(2)} (real Premier League is about 2.6 to 2.8)`);
}

type Bot = "casual" | "greedy" | "smart";

function botDraft(seed: string, formation: string, bot: Bot): DraftState {
  let state = startDraft(seed, formation, seasons);
  const f = getFormation(formation);
  while (!isComplete(state)) {
    const options = state.current!.options.flatMap((p) => slotsFor(state, p).map((slot) => ({ p, slot })));
    let choice = options[createRng(`${seed}:${state.spinCount}`).int(options.length)]!;
    if (bot === "greedy") choice = options.sort((a, b) => b.p.rating - a.p.rating)[0]!;
    if (bot === "smart") {
      // Best total effective rating (chemistry included) after the pick.
      const score = (o: (typeof options)[number]) => {
        const lineup = [...state.lineup];
        lineup[o.slot] = o.p;
        return teamChemistry(f, lineup).slots.reduce((sum, s) => sum + (s?.effective ?? 0), 0);
      };
      choice = options.sort((a, b) => score(b) - score(a))[0]!;
    }
    state = pick(state, choice.p.key, choice.slot, seasons);
  }
  return state;
}

function drafts(bot: Bot) {
  const positions: number[] = [], points: number[] = [], ratings: number[] = [], chems: number[] = [];
  let unbeaten = 0, perfect = 0, titles = 0, icons = 0;
  for (let i = 0; i < runs; i++) {
    const seed = `${bot}:${i}`;
    const formation = FORMATIONS[i % FORMATIONS.length]!.name;
    const state = botDraft(seed, formation, bot);
    const tc = teamChemistry(getFormation(formation), state.lineup);
    const season = seasons.find((s) => s.season === state.leagueSeason) as SeasonData;
    const result = simulateSeason(seed, season, formation, state.lineup);
    positions.push(result.user.position);
    points.push(result.user.row.points * 38 / result.user.row.played);
    ratings.push(tc.teamRating);
    chems.push(tc.teamChem);
    if (result.user.row.lost === 0) unbeaten++;
    if (result.user.row.won === result.user.row.played) perfect++;
    if (result.user.position === 1) titles++;
    if (state.iconSpinUsed) icons++;
  }
  const dist = [1, 4, 10, 17, 20].map((cut, k, arr) => {
    const lo = k === 0 ? 1 : arr[k - 1]! + 1;
    return `${lo}-${cut}: ${Math.round((100 * positions.filter((p) => p >= lo && p <= cut).length) / runs)}%`;
  });
  console.log(`\n${bot} bot, ${runs} drafts:`);
  console.log(`  team rating ${mean(ratings).toFixed(1)} (sd ${sd(ratings).toFixed(1)}), chemistry ${mean(chems).toFixed(0)}`);
  console.log(`  points per 38: ${mean(points).toFixed(1)}; finish ${dist.join(", ")}`);
  console.log(`  titles ${titles}, unbeaten ${unbeaten}, perfect ${perfect}, runs with an Icon spin ${icons}`);
}

if (mode === "pl") realSeasons();
drafts("casual");
drafts("greedy");
drafts("smart");
