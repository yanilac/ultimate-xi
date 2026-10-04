import { describe, expect, it } from "vitest";
import {
  createRng, FORMATIONS, fixtures, getFormation, ICON_PLAYERS, isComplete, linkStrength,
  pick, positionFit, respin, simulateSeason, slotsFor, startDraft, swap, teamChemistry,
  type DraftState, type Player,
} from "./index";
import { loadSeasons } from "../../scripts/load";

const seasons = loadSeasons();

function card(over: Partial<Player>): Player {
  return {
    key: "x", personId: "x", name: "X", role: "M", positions: ["CM"], nation: "England",
    rating: 80, season: "2003-04", club: "Arsenal", icon: false, goalsPer90: 0.1, assistsPer90: 0.1,
    apps: 30, goals: 3, assists: 3, minutes: 2500, draftable: true, ...over,
  };
}

function autoDraft(seed: string, formation = "4-3-3"): DraftState {
  let state = startDraft(seed, formation, seasons);
  while (!isComplete(state)) {
    const choice = state.current!.options.find((p) => slotsFor(state, p).length > 0)!;
    state = pick(state, choice.key, slotsFor(state, choice)[0]!, seasons);
  }
  return state;
}

describe("rng", () => {
  it("is deterministic per seed", () => {
    const a = createRng("seed"), b = createRng("seed"), c = createRng("other");
    const xs = [a.next(), a.next(), a.next()];
    expect([b.next(), b.next(), b.next()]).toEqual(xs);
    expect(c.next()).not.toEqual(xs[0]);
  });

  it("poisson averages its mean", () => {
    const rng = createRng(1);
    let sum = 0;
    for (let i = 0; i < 20000; i++) sum += rng.poisson(1.4);
    expect(sum / 20000).toBeCloseTo(1.4, 1);
  });
});

describe("positions", () => {
  it("rates main, alternate and neighbour positions", () => {
    const p = card({ positions: ["RM", "CM"] });
    expect(positionFit(p, "RM")).toBe(1);
    expect(positionFit(p, "CM")).toBeLessThan(1);
    expect(positionFit(p, "RW")).toBeLessThan(1); // neighbour of RM
    expect(positionFit(p, "LB")).toBe(0);
  });
});

describe("formations", () => {
  it.each(FORMATIONS.map((f) => [f.name, f] as const))("%s has 11 slots, one keeper and a connected link graph", (_, f) => {
    expect(f.slots).toHaveLength(11);
    expect(f.slots.filter((s) => s.pos === "GK")).toHaveLength(1);
    const seen = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const s = queue.shift()!;
      for (const [a, b] of f.links) {
        const next = a === s ? b : b === s ? a : -1;
        if (next >= 0 && !seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    expect(seen.size).toBe(11);
  });
});

describe("icons", () => {
  it("has the 48 approved Icons with valid positions", () => {
    expect(ICON_PLAYERS).toHaveLength(48);
    const keys = new Set(ICON_PLAYERS.map((p) => p.key));
    expect(keys.size).toBe(48);
    for (const p of ICON_PLAYERS) expect(p.positions.length).toBeGreaterThan(0);
  });
});

describe("chemistry", () => {
  it("links by club, nation and era", () => {
    const henry = card({ club: "Arsenal", nation: "France", season: "2003-04" });
    expect(linkStrength(henry, card({ club: "Arsenal", nation: "England", season: "1995-96" }))).toBe("strong");
    expect(linkStrength(henry, card({ club: "Chelsea", nation: "France", season: "2005-06" }))).toBe("strong");
    expect(linkStrength(henry, card({ club: "Chelsea", nation: "France", season: "2020-21" }))).toBe("weak");
    expect(linkStrength(henry, card({ club: "Chelsea", nation: "Spain", season: "2006-07" }))).toBe("weak");
    expect(linkStrength(henry, card({ club: "Chelsea", nation: "Spain", season: "2020-21" }))).toBe("none");
  });

  it("gives Icons a weak link to anyone and a strong one to their nation", () => {
    const pele = ICON_PLAYERS.find((p) => p.name === "Pelé")!;
    expect(linkStrength(pele, card({ nation: "Brazil" }))).toBe("strong");
    expect(linkStrength(pele, card({ nation: "Wales" }))).toBe("weak");
  });

  it("rewards a linked XI over an unlinked one", () => {
    const f = getFormation("4-4-2");
    const linked = f.slots.map((s, i) => card({ key: `a${i}`, positions: [s.pos] }));
    const unlinked = f.slots.map((s, i) =>
      card({ key: `b${i}`, positions: [s.pos], club: `Club ${i}`, nation: `Nation ${i}`, season: `${1992 + i * 5}-00` }),
    );
    const a = teamChemistry(f, linked), b = teamChemistry(f, unlinked);
    expect(a.teamChem).toBe(100);
    expect(a.teamRating).toBeGreaterThan(b.teamRating);
  });
});

describe("draft", () => {
  it("is replayable from its seed", () => {
    expect(autoDraft("replay").lineup.map((p) => p!.key)).toEqual(autoDraft("replay").lineup.map((p) => p!.key));
  });

  it("fills every slot with someone who can play it, never the same person twice", () => {
    for (const formation of FORMATIONS) {
      const state = autoDraft(`fill:${formation.name}`, formation.name);
      state.lineup.forEach((p, i) => expect(positionFit(p!, formation.slots[i]!.pos)).toBeGreaterThan(0));
      const people = state.lineup.map((p) => p!.personId);
      expect(new Set(people).size).toBe(11);
    }
  });

  it("always offers 4 options with at least one that fits", () => {
    let state = startDraft("options", "3-5-2", seasons);
    while (!isComplete(state)) {
      expect(state.current!.options).toHaveLength(4);
      const choice = state.current!.options.find((p) => slotsFor(state, p).length > 0);
      expect(choice).toBeDefined();
      state = pick(state, choice!.key, slotsFor(state, choice!)[0]!, seasons);
    }
  });

  it("draws each option from a different club and season", () => {
    for (const seed of ["mix-a", "mix-b", "mix-c"]) {
      let state = startDraft(seed, "4-3-3", seasons);
      while (!isComplete(state)) {
        const spin = state.current!;
        if (spin.kind === "mixed") {
          expect(new Set(spin.options.map((p) => `${p.club}@${p.season}`)).size).toBe(4);
        }
        const choice = spin.options.find((p) => slotsFor(state, p).length > 0)!;
        state = pick(state, choice.key, slotsFor(state, choice)[0]!, seasons);
      }
    }
  });

  it("allows two re-spins per run", () => {
    let state = startDraft("respin", "4-4-2", seasons);
    state = respin(respin(state, seasons), seasons);
    expect(state.respinsLeft).toBe(0);
    expect(() => respin(state, seasons)).toThrow();
  });

  it("rejects a player in a slot he can't play", () => {
    const state = startDraft("reject", "4-3-3", seasons);
    const p = state.current!.options[0]!;
    const bad = state.lineup.findIndex((_, i) => !slotsFor(state, p).includes(i));
    if (bad >= 0) expect(() => pick(state, p.key, bad, seasons)).toThrow();
  });

  it("swaps two players only if both can play the other slot", () => {
    const state = autoDraft("swap", "4-4-2");
    expect(() => swap(state, 0, 10)).toThrow(); // keeper to striker
    const f = getFormation("4-4-2");
    const [lcb, rcb] = f.slots.flatMap((s, i) => (s.pos === "CB" ? [i] : []));
    const swapped = swap(state, lcb!, rcb!);
    expect(swapped.lineup[lcb!]).toBe(state.lineup[rcb!]);
  });
});

describe("season", () => {
  it("builds a double round robin", () => {
    const rounds = fixtures(20, createRng(3));
    expect(rounds).toHaveLength(38);
    const pairs = new Map<string, number>();
    for (const round of rounds) {
      expect(new Set(round.flat()).size).toBe(20);
      for (const [h, a] of round) pairs.set(`${h}-${a}`, (pairs.get(`${h}-${a}`) ?? 0) + 1);
    }
    expect(pairs.size).toBe(380);
    expect([...pairs.values()].every((n) => n === 1)).toBe(true);
  });

  it("plays a full, consistent season", () => {
    const state = autoDraft("season");
    const season = seasons.find((s) => s.season === state.leagueSeason)!;
    const result = simulateSeason("season", season, state.formation, state.lineup);
    const n = season.clubs.length;
    expect(result.matchdays).toHaveLength((n - 1) * 2);
    expect(result.table).toHaveLength(n);
    for (const row of result.table) {
      expect(row.played).toBe((n - 1) * 2);
      expect(row.points).toBe(row.won * 3 + row.drawn);
    }
    const goals = result.table.reduce((s, r) => s + r.goalsFor, 0);
    expect(goals).toBe(result.table.reduce((s, r) => s + r.goalsAgainst, 0));
    expect(result.topScorers.reduce((s, r) => s + r.goals, 0)).toBe(goals);
    expect(result.user.position).toBe(result.table.findIndex((r) => r.isUser) + 1);
    expect(result.replaced).not.toBe("");
  });

  it("credits assists to a team-mate, on most goals", () => {
    const state = autoDraft("assists");
    const season = seasons.find((s) => s.season === state.leagueSeason)!;
    const result = simulateSeason("assists", season, state.formation, state.lineup);
    const goals = result.matchdays.flat().flatMap((m) => m.goals);
    const assisted = goals.filter((g) => g.assisterKey);
    for (const g of assisted) expect(g.assisterKey).not.toBe(g.scorerKey);
    expect(assisted.length / goals.length).toBeGreaterThan(0.65);
    expect(assisted.length / goals.length).toBeLessThan(0.85);
    expect(result.topAssists.reduce((s, r) => s + r.assists, 0)).toBe(assisted.length);
  });

  it("gives the same season for the same seed", () => {
    const state = autoDraft("same");
    const season = seasons.find((s) => s.season === state.leagueSeason)!;
    const a = simulateSeason("same", season, state.formation, state.lineup);
    const b = simulateSeason("same", season, state.formation, state.lineup);
    expect(a.table).toEqual(b.table);
  });
});
