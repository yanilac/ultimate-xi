import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseSeason } from "../src/engine/data";
import type { SeasonData, SeasonIndexEntry } from "../src/engine/types";

const DATA = join(import.meta.dirname, "..", "public", "data");

/** Load every season file for a mode from disk (the browser fetches the same files). */
export function loadSeasons(mode: "pl" | "top5" = "pl"): SeasonData[] {
  const dir = mode === "top5" ? join(DATA, "top5") : DATA;
  const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as { seasons: SeasonIndexEntry[] };
  return index.seasons.map((s) =>
    parseSeason(JSON.parse(readFileSync(join(dir, "seasons", `${s.file ?? s.season}.json`), "utf8"))),
  );
}
