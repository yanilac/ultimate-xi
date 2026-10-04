/** The two ways to play. Top 5 is the default. */
export type Mode = "top5" | "pl";

export interface ModeInfo {
  id: Mode;
  name: string;
  blurb: string;
  /** Folder under public/data. */
  dataPath: string;
}

export const MODES: ModeInfo[] = [
  {
    id: "top5",
    name: "Top 5 leagues",
    blurb: "This season's players from the Premier League, LaLiga, Serie A, Bundesliga and Ligue 1. Play a season in one of them.",
    dataPath: "data/top5/",
  },
  {
    id: "pl",
    name: "Premier League history",
    blurb: "Every Premier League season since 1992. Mix eras in one XI and play a season from any year.",
    dataPath: "data/",
  },
];

export function modeInfo(mode: Mode): ModeInfo {
  return MODES.find((m) => m.id === mode)!;
}

/** Top 5 season keys name the league ("2026-27 LaLiga"); history keys are just the years. */
export function modeOfSeason(season: string): Mode {
  return season.includes(" ") ? "top5" : "pl";
}

const KEY = "ultimate-xi:mode";

export function readMode(): Mode {
  try {
    const m = localStorage.getItem(KEY);
    return m === "pl" || m === "top5" ? m : "top5";
  } catch {
    return "top5";
  }
}

export function saveMode(mode: Mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* storage unavailable */
  }
}
