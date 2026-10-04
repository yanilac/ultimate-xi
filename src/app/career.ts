import type { Mode } from "./modes";

/**
 * Your record across every season you've drafted and played on this device.
 * Kept in localStorage (there are no accounts), so it survives reloads but not
 * a cleared browser. Replays of someone else's link don't count.
 */
export interface Career {
  seasons: number;
  titles: number;
  top4: number;
  invincibles: number;
  /** Titles in a row, counting back from the latest season. */
  streak: number;
  bestStreak: number;
  /** Finishing positions, oldest first, at most the last 10. */
  recent: number[];
  /** Seeds already counted, so the same run is never counted twice. */
  counted: string[];
}

/** Each mode keeps its own record. The history key predates modes, so it stays as it was. */
const key = (mode: Mode) => (mode === "pl" ? "ultimate-xi:career" : "ultimate-xi:career:top5");

export const EMPTY_CAREER: Career = {
  seasons: 0, titles: 0, top4: 0, invincibles: 0, streak: 0, bestStreak: 0, recent: [], counted: [],
};

export function readCareer(mode: Mode): Career {
  try {
    const raw = localStorage.getItem(key(mode));
    return raw ? { ...EMPTY_CAREER, ...(JSON.parse(raw) as Partial<Career>) } : EMPTY_CAREER;
  } catch {
    return EMPTY_CAREER;
  }
}

/** Add one finished season to the record. Returns the record unchanged if this run was already counted. */
export function addSeason(career: Career, seed: string, position: number, unbeaten: boolean): Career {
  if (career.counted.includes(seed)) return career;
  const won = position === 1;
  const streak = won ? career.streak + 1 : 0;
  return {
    seasons: career.seasons + 1,
    titles: career.titles + (won ? 1 : 0),
    top4: career.top4 + (position <= 4 ? 1 : 0),
    invincibles: career.invincibles + (unbeaten ? 1 : 0),
    streak,
    bestStreak: Math.max(career.bestStreak, streak),
    recent: [...career.recent, position].slice(-10),
    counted: [...career.counted, seed].slice(-200),
  };
}

export function saveCareer(mode: Mode, career: Career) {
  try {
    localStorage.setItem(key(mode), JSON.stringify(career));
  } catch {
    /* storage unavailable: the record lasts for this visit only */
  }
}
