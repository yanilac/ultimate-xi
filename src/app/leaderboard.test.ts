import { describe, expect, it } from "vitest";
import { isComplete, pick, simulateSeason, slotsFor, startDraft } from "../engine";
import { loadSeasons } from "../../scripts/load";
import { periodStart, verifyEntry, type Entry } from "./leaderboard";
import { encodeRun } from "./run";

const seasons = loadSeasons("top5");

function entryFor(seed: string): Entry {
  let state = startDraft(seed, "4-3-3", seasons);
  while (!isComplete(state)) {
    const choice = state.current!.options.find((p) => slotsFor(state, p).length > 0)!;
    state = pick(state, choice.key, slotsFor(state, choice)[0]!, seasons);
  }
  const run = { seed, formation: state.formation, league: state.leagueSeason, xi: state.lineup.map((p) => p!.key) };
  const season = seasons.find((s) => s.season === run.league)!;
  const { user } = simulateSeason(seed, season, run.formation, state.lineup);
  return {
    name: "Test", season: run.league, formation: run.formation,
    won: user.row.won, drawn: user.row.drawn, lost: user.row.lost,
    points: user.row.points, ppg: 0, gd: user.row.goalsFor - user.row.goalsAgainst, position: user.position,
    seed, link: encodeRun(run), created_at: "",
  };
}

describe("leaderboard", () => {
  it("accepts an entry whose replay matches and rejects a doctored one", () => {
    const e = entryFor("board-test");
    expect(verifyEntry(e, seasons)).toBe(true);
    expect(verifyEntry({ ...e, won: e.won + 1, lost: e.lost - 1 }, seasons)).toBe(false);
    expect(verifyEntry({ ...e, seed: "other" }, seasons)).toBe(false);
    expect(verifyEntry({ ...e, link: "<script>" }, seasons)).toBe(false);
  });

  it("starts today at midnight and the week on Monday", () => {
    const wed = new Date(2026, 9, 7, 15, 30); // Wednesday 7 Oct 2026
    expect(periodStart("today", wed)).toEqual(new Date(2026, 9, 7));
    expect(periodStart("week", wed)).toEqual(new Date(2026, 9, 5));
    expect(periodStart("week", new Date(2026, 9, 4, 9))).toEqual(new Date(2026, 8, 28)); // Sunday
    expect(periodStart("all", wed)).toBeNull();
  });
});
