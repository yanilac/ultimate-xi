import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_PLAYERS } from "../engine";
import { FLAG_CODES, flagCode } from "./flags";

const DATA = join(import.meta.dirname, "..", "..", "public", "data");

function nationsIn(dir: string): Set<string> {
  const out = new Set<string>();
  for (const f of readdirSync(dir)) {
    const season = JSON.parse(readFileSync(join(dir, f), "utf8")) as { fields: string[]; clubs: { players: unknown[][] }[] };
    const i = season.fields.indexOf("nation");
    for (const c of season.clubs) for (const p of c.players) if (p[i]) out.add(p[i] as string);
  }
  return out;
}

describe("flags", () => {
  it("has a flag for every nation in both modes and the Icons", () => {
    const nations = new Set([
      ...nationsIn(join(DATA, "seasons")),
      ...nationsIn(join(DATA, "top5", "seasons")),
      ...ICON_PLAYERS.map((p) => p.nation!),
    ]);
    expect([...nations].filter((n) => !flagCode(n))).toEqual([]);
  });

  it("ships an image for every flag code", () => {
    const dir = join(import.meta.dirname, "..", "..", "public", "flags");
    expect(Object.values(FLAG_CODES).filter((c) => !existsSync(join(dir, `${c}.svg`)))).toEqual([]);
  });
});
