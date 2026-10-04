/**
 * Generic club badges: a short code in the club's colours, so two players with the
 * same name can be told apart at a glance. No crests or logos.
 */
export interface ClubColours {
  code: string;
  bg: string;
  fg: string;
}

const CLUBS: Record<string, ClubColours> = {
  "AFC Bournemouth": { code: "BOU", bg: "#b50e12", fg: "#ffffff" },
  Arsenal: { code: "ARS", bg: "#ef0107", fg: "#ffffff" },
  "Aston Villa": { code: "AVL", bg: "#670e36", fg: "#95bfe5" },
  Barnsley: { code: "BAR", bg: "#d71920", fg: "#ffffff" },
  "Birmingham City": { code: "BIR", bg: "#1b3c8c", fg: "#ffffff" },
  "Blackburn Rovers": { code: "BLB", bg: "#009ee0", fg: "#ffffff" },
  Blackpool: { code: "BLP", bg: "#f68712", fg: "#ffffff" },
  "Bolton Wanderers": { code: "BOL", bg: "#ffffff", fg: "#263c7e" },
  "Bradford City": { code: "BRA", bg: "#8b1a3a", fg: "#f2b51c" },
  Brentford: { code: "BRE", bg: "#e30613", fg: "#ffffff" },
  "Brighton & Hove Albion": { code: "BHA", bg: "#0057b8", fg: "#ffffff" },
  Burnley: { code: "BUR", bg: "#6c1d45", fg: "#99d6ea" },
  "Cardiff City": { code: "CAR", bg: "#0070b5", fg: "#ffffff" },
  "Charlton Athletic": { code: "CHA", bg: "#d4021d", fg: "#ffffff" },
  Chelsea: { code: "CHE", bg: "#034694", fg: "#ffffff" },
  "Coventry City": { code: "COV", bg: "#59cbe8", fg: "#0b2a4a" },
  "Crystal Palace": { code: "CRY", bg: "#1b458f", fg: "#ff4d5e" },
  "Derby County": { code: "DER", bg: "#ffffff", fg: "#111111" },
  Everton: { code: "EVE", bg: "#003399", fg: "#ffffff" },
  Fulham: { code: "FUL", bg: "#ffffff", fg: "#111111" },
  "Huddersfield Town": { code: "HUD", bg: "#0e63ad", fg: "#ffffff" },
  "Hull City": { code: "HUL", bg: "#f5a12d", fg: "#111111" },
  "Ipswich Town": { code: "IPS", bg: "#3a64a3", fg: "#ffffff" },
  "Leeds United": { code: "LEE", bg: "#ffffff", fg: "#1d428a" },
  "Leicester City": { code: "LEI", bg: "#003090", fg: "#fdbe11" },
  Liverpool: { code: "LIV", bg: "#c8102e", fg: "#ffffff" },
  "Luton Town": { code: "LUT", bg: "#f78f1e", fg: "#002d62" },
  "Manchester City": { code: "MCI", bg: "#6cabdd", fg: "#1c2c5b" },
  "Manchester United": { code: "MUN", bg: "#da291c", fg: "#fbe122" },
  Middlesbrough: { code: "MID", bg: "#e11b22", fg: "#ffffff" },
  "Newcastle United": { code: "NEW", bg: "#111111", fg: "#ffffff" },
  "Norwich City": { code: "NOR", bg: "#fff200", fg: "#00843d" },
  "Nottingham Forest": { code: "NFO", bg: "#dd0000", fg: "#ffffff" },
  "Oldham Athletic": { code: "OLD", bg: "#004a9f", fg: "#ffffff" },
  Portsmouth: { code: "POR", bg: "#001489", fg: "#ffffff" },
  "Queens Park Rangers": { code: "QPR", bg: "#1d5ba4", fg: "#ffffff" },
  Reading: { code: "REA", bg: "#004494", fg: "#ffffff" },
  "Sheffield United": { code: "SHU", bg: "#ee2737", fg: "#ffffff" },
  "Sheffield Wednesday": { code: "SHW", bg: "#3b6eb4", fg: "#ffffff" },
  Southampton: { code: "SOU", bg: "#d71920", fg: "#ffffff" },
  "Stoke City": { code: "STK", bg: "#e03a3e", fg: "#ffffff" },
  Sunderland: { code: "SUN", bg: "#eb172b", fg: "#ffffff" },
  "Swansea City": { code: "SWA", bg: "#ffffff", fg: "#111111" },
  "Swindon Town": { code: "SWI", bg: "#da1f26", fg: "#ffffff" },
  "Tottenham Hotspur": { code: "TOT", bg: "#ffffff", fg: "#132257" },
  Watford: { code: "WAT", bg: "#fbee23", fg: "#111111" },
  "West Bromwich Albion": { code: "WBA", bg: "#122f67", fg: "#ffffff" },
  "West Ham United": { code: "WHU", bg: "#7a263a", fg: "#1bb1e7" },
  "Wigan Athletic": { code: "WIG", bg: "#1d59af", fg: "#ffffff" },
  Wimbledon: { code: "WIM", bg: "#1a2c6b", fg: "#ffe200" },
  "Wolverhampton Wanderers": { code: "WOL", bg: "#fdb913", fg: "#231f20" },
};

export function clubColours(name: string): ClubColours {
  return CLUBS[name] ?? { code: name.slice(0, 3).toUpperCase(), bg: "#3a4a40", fg: "#ffffff" };
}
