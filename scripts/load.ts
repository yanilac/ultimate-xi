import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseSeason } from "../src/engine/data";
import type { SeasonData, SeasonIndexEntry } from "../src/engine/types";

const DATA = join(import.meta.dirname, "..", "public", "data");

/** Load every season file from disk (the browser fetches the same files). */
export function loadSeasons(): SeasonData[] {
  const index = JSON.parse(readFileSync(join(DATA, "index.json"), "utf8")) as { seasons: SeasonIndexEntry[] };
  return index.seasons.map((s) =>
    parseSeason(JSON.parse(readFileSync(join(DATA, "seasons", `${s.season}.json`), "utf8"))),
  );
}
