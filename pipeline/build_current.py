"""
Build the "Top 5 leagues" data: every club in the Premier League, LaLiga, Serie A,
Bundesliga and Ligue 1 for the current season, from EA SPORTS FC 27 ratings.

Source: players.csv from github.com/LakshmiKanth11/EA_FC_ANALYSIS (EA's public
ratings, snapshot 12 Sep 2026). Download it to pipeline/raw/fc27_players.csv:

  curl -L -o pipeline/raw/fc27_players.csv \
    "https://raw.githubusercontent.com/LakshmiKanth11/EA_FC_ANALYSIS/main/EA_FC_PLAYERS_DATASET_AND_%20DASHBOARD/data/players.csv"

Output uses the same season-file format as build.py, one file per league, so the
engine can draft from all five and simulate any one of them.

Ratings are EA's overall ratings as they are. There are no real match stats yet,
so goals and assists are estimates from finishing and passing attributes, only
used to pick who scores and assists in the sim (the cards don't show them).
"""
import csv
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "pipeline" / "raw" / "fc27_players.csv"
OUT = ROOT / "public" / "data" / "top5"
SEASON = "2026-27"
SNAPSHOT = date(2026, 9, 12)
SQUAD = 23  # best players kept per club
MINUTES = 2700  # notional minutes, so per-90 estimates come out right

LEAGUES = [
    # (EA league name, display name, file slug, games)
    ("Premier League", "Premier League", "premier-league", 38),
    ("LALIGA EA SPORTS", "LaLiga", "laliga", 38),
    ("Serie A Enilive", "Serie A", "serie-a", 38),
    ("Bundesliga", "Bundesliga", "bundesliga", 34),
    ("Ligue 1 McDonald's", "Ligue 1", "ligue-1", 34),
]

# EA's short or unlicensed club names -> the real names people know.
CLUB_NAMES = {
    # Common short names for clubs EA lists by their full title.
    "FC Barcelona": "Barcelona",
    "Villarreal CF": "Villarreal",
    "Valencia CF": "Valencia",
    "Getafe CF": "Getafe",
    "RCD Espanyol": "Espanyol",
    "Sevilla FC": "Sevilla",
    "Levante UD": "Levante",
    "Elche CF": "Elche",
    "Málaga CF": "Málaga",
    "AS Roma": "Roma",
    "VfB Stuttgart": "Stuttgart",
    "TSG Hoffenheim": "Hoffenheim",
    "SC Freiburg": "Freiburg",
    "1. FSV Mainz 05": "Mainz 05",
    "FC Augsburg": "Augsburg",
    "1. FC Köln": "Köln",
    "Hamburger SV": "Hamburg",
    "FC Schalke 04": "Schalke 04",
    "SC Paderborn 07": "Paderborn",
    "AS Monaco": "Monaco",
    "RC Lens": "Lens",
    "OGC Nice": "Nice",
    "Angers SCO": "Angers",
    "Toulouse FC": "Toulouse",
    "FC Lorient": "Lorient",
    "AJ Auxerre": "Auxerre",
    "Havre AC": "Le Havre",
    "ESTAC Troyes": "Troyes",
    "Le Mans FC": "Le Mans",
    "Brighton": "Brighton & Hove Albion",
    "Ipswich": "Ipswich Town",
    "Man Utd": "Manchester United",
    "Newcastle Utd": "Newcastle United",
    "Nott'm Forest": "Nottingham Forest",
    "Spurs": "Tottenham Hotspur",
    "Atlético de Madrid": "Atlético Madrid",
    "CA Osasuna": "Osasuna",
    "Celta": "Celta Vigo",
    "D. Alavés": "Alavés",
    "R. Racing Club": "Racing Santander",
    "RC Deportivo": "Deportivo La Coruña",
    "Bergamo Calcio": "Atalanta",
    "Latium": "Lazio",
    "Lombardia FC": "Inter",
    "Milano FC": "AC Milan",
    "SSC Napoli": "Napoli",
    "FC Bayern München": "Bayern Munich",
    "Frankfurt": "Eintracht Frankfurt",
    "Leverkusen": "Bayer Leverkusen",
    "M'gladbach": "Borussia Mönchengladbach",
    "SV Werder Bremen": "Werder Bremen",
    "OL": "Lyon",
    "OM": "Marseille",
    "Paris SG": "Paris Saint-Germain",
    "LOSC Lille": "Lille",
    "Stade Brestois 29": "Brest",
    "Stade Rennais FC": "Rennes",
}

ROLE = {
    "GK": "G",
    "CB": "D", "LB": "D", "RB": "D", "LWB": "D", "RWB": "D",
    "CDM": "M", "CM": "M", "CAM": "M", "LM": "M", "RM": "M",
    "LW": "F", "RW": "F", "ST": "F", "CF": "F",
}


def num(row, key, default=50):
    try:
        return int(row[key])
    except (KeyError, ValueError):
        return default


def age(birthdate):
    try:
        d, m, y = (int(x) for x in birthdate.split("-"))
    except ValueError:
        return None
    return SNAPSHOT.year - y - ((SNAPSHOT.month, SNAPSHOT.day) < (m, d))


def estimates(row, role):
    """Season goals and assists, guessed from attributes, scaled to MINUTES."""
    fin, pos_ = num(row, "attacking_finishing"), num(row, "mentality_positioning")
    vis, pas = num(row, "mentality_vision"), num(row, "attacking_short_passing")
    cross = num(row, "attacking_crossing")
    shoot = max(0.0, (fin + pos_) / 2 - 45) / 45  # 0 to about 1.1
    create = max(0.0, (vis + pas + cross) / 3 - 45) / 45
    goal_scale = {"G": 0, "D": 0.12, "M": 0.35, "F": 0.75}[role]
    assist_scale = {"G": 0.01, "D": 0.12, "M": 0.3, "F": 0.25}[role]
    per90_goals = goal_scale * shoot ** 2
    per90_assists = assist_scale * create ** 2
    return round(per90_goals * MINUTES / 90), round(per90_assists * MINUTES / 90)


def main():
    rows = [r for r in csv.DictReader(open(RAW, encoding="utf-8-sig")) if r["gender"].startswith("Men")]
    OUT.joinpath("seasons").mkdir(parents=True, exist_ok=True)
    index = []
    for ea_name, display, slug, games in LEAGUES:
        clubs = {}
        for r in rows:
            if r["league"] != ea_name:
                continue
            clubs.setdefault(CLUB_NAMES.get(r["club"], r["club"]), []).append(r)
        built = []
        for name, players in clubs.items():
            players.sort(key=lambda r: -num(r, "overall_rating"))
            squad = []
            for r in players[:SQUAD]:
                main_pos = r["position"]
                alts = [p for p in r["alternate_positions"].split() if p in ROLE and p != main_pos]
                role = ROLE.get(main_pos, "M")
                goals, assists = estimates(r, role)
                squad.append([
                    int(r["player_id"]),
                    r["common_name"] or f'{r["first_name"]} {r["last_name"]}'.strip(),
                    role,
                    "/".join([main_pos, *alts]),
                    r["nationality"] or None,
                    age(r["birthdate"]),
                    num(r, "overall_rating"),
                    0, goals, assists, MINUTES, 1,
                ])
            # Club strength: average of its best 14, used to rank the table.
            top = sorted((p[6] for p in squad), reverse=True)[:14]
            built.append({"name": name, "strength": sum(top) / len(top), "players": squad})
        built.sort(key=lambda c: -c["strength"])
        out_clubs = [
            {"name": c["name"], "finish": i + 1, "points": 0, "players": c["players"]}
            for i, c in enumerate(built)
        ]
        season = f"{SEASON} {display}"
        data = {
            "season": season,
            "league": display,
            "games": games,
            "fields": ["id", "name", "role", "positions", "nation", "age", "rating",
                       "apps", "goals", "assists", "minutes", "draftable"],
            "clubs": out_clubs,
        }
        (OUT / "seasons" / f"{slug}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
        index.append({"season": season, "file": slug, "games": games, "clubs": len(out_clubs)})
        print(f"{display}: {len(out_clubs)} clubs, top {out_clubs[0]['name']}, bottom {out_clubs[-1]['name']}")
    (OUT / "index.json").write_text(json.dumps({"seasons": index}, indent=1))


if __name__ == "__main__":
    main()
