export type Position =
  | "GK" | "RB" | "CB" | "LB" | "RWB" | "LWB"
  | "CDM" | "CM" | "CAM" | "RM" | "LM"
  | "RW" | "LW" | "CF" | "ST";

export type Role = "G" | "D" | "M" | "F";

/** One player as he was in one Premier League season, or an Icon. */
export interface Player {
  /** Unique per card: "1619@2003-04" for a season card, "icon:maradona" for an Icon. */
  key: string;
  /** The same person across cards, so one XI can't hold him twice. */
  personId: string;
  name: string;
  role: Role;
  /** Main position first. */
  positions: Position[];
  nation: string | null;
  rating: number;
  /** Season like "2003-04", or null for an Icon. */
  season: string | null;
  club: string | null;
  /** League the card comes from in the Top 5 mode, like "LaLiga". Null for Premier League draft cards and Icons. */
  league: string | null;
  icon: boolean;
  /** Real league goals per 90 that season, used to pick scorers. */
  goalsPer90: number;
  /** Real league assists per 90 that season, used to pick who set up a goal. */
  assistsPer90: number;
  apps: number;
  goals: number;
  assists: number;
  minutes: number;
  draftable: boolean;
}

export interface Club {
  name: string;
  finish: number;
  points: number;
  players: Player[];
}

export interface SeasonData {
  /** "2003-04" in Premier League draft, "2026-27 LaLiga" in the Top 5 mode. */
  season: string;
  /** Set in the Top 5 mode. */
  league?: string;
  games: number;
  clubs: Club[];
}

export interface SeasonIndexEntry {
  season: string;
  /** File name without .json, when it isn't the season key. */
  file?: string;
  games: number;
  clubs: number;
}
