import { describe, expect, it } from "vitest";
import { addSeason, EMPTY_CAREER } from "./career";

describe("career record", () => {
  it("counts titles and the current streak", () => {
    let c = EMPTY_CAREER;
    c = addSeason(c, "a", 1, false);
    c = addSeason(c, "b", 1, true);
    expect(c).toMatchObject({ seasons: 2, titles: 2, streak: 2, bestStreak: 2, invincibles: 1 });
    c = addSeason(c, "c", 3, false);
    expect(c).toMatchObject({ seasons: 3, titles: 2, streak: 0, bestStreak: 2, top4: 3 });
    expect(c.recent).toEqual([1, 1, 3]);
  });

  it("never counts the same run twice", () => {
    const once = addSeason(EMPTY_CAREER, "same", 1, false);
    expect(addSeason(once, "same", 1, false)).toBe(once);
  });
});
