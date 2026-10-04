import { describe, expect, it } from "vitest";
import { isComplete, pick, simulateSeason, slotsFor, startDraft } from "../engine";
import { loadSeasons } from "../../scripts/load";
import { buildBoard, periodStart, verifyEntry, type Entry } from "./leaderboard";
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
    gd: user.row.goalsFor - user.row.goalsAgainst, position: user.position,
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

  it("gives each person one row, ranked by titles, ties broken by their best title season", () => {
    // Find drafts that win the title, then hand them out to people.
    const wins: Entry[] = [];
    for (let i = 0; wins.length < 5 && i < 200; i++) {
      const e = entryFor(`title-${i}`);
      if (e.position === 1) wins.push(e);
    }
    expect(wins.length).toBe(5);
    const ppg = (e: Entry) => (e.won * 3 + e.drawn) / (e.won + e.drawn + e.lost);
    const [a, b, c, d, e] = wins;
    const entries: Entry[] = [
      { ...a!, name: "Sam", player: "p1" },
      { ...b!, name: "sam old", player: "p1" },
      { ...c!, name: "Sam", player: "p2" }, // same name, different person
      { ...d!, name: "Alex", player: null },
      { ...e!, name: "alex ", player: null }, // older rows group by name
      { ...a!, name: "Cheat", player: "p3", seed: "x", won: 38, drawn: 0, lost: 0 },
    ];
    const board = buildBoard(entries, seasons);
    expect(board.map((r) => [r.name, r.titles])).toEqual(
      expect.arrayContaining([["Sam", 2], ["Sam", 1], ["Alex", 2]]),
    );
    expect(board).toHaveLength(3);
    expect(board[2]!.titles).toBe(1);
    const [first, second] = board;
    expect(ppg(first!.best) >= ppg(second!.best)).toBe(true);
    // An old name-only row joins the person now using that name.
    const merged = buildBoard([{ ...a!, name: "Jo", player: "p9" }, { ...b!, name: "jo", player: null }], seasons);
    expect(merged.map((r) => [r.name, r.titles])).toEqual([["Jo", 2]]);
  });

  it("starts today at midnight and the week on Monday", () => {
    const wed = new Date(2026, 9, 7, 15, 30); // Wednesday 7 Oct 2026
    expect(periodStart("today", wed)).toEqual(new Date(2026, 9, 7));
    expect(periodStart("week", wed)).toEqual(new Date(2026, 9, 5));
    expect(periodStart("week", new Date(2026, 9, 4, 9))).toEqual(new Date(2026, 8, 28)); // Sunday
    expect(periodStart("all", wed)).toBeNull();
  });
});
