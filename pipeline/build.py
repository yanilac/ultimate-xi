"""Build the game's player data from Premier League season statistics.

Downloads the source CSVs (cached in pipeline/raw/), rates every player-season
and writes one JSON file per season to public/data/seasons/, plus an index.

Usage: python3 pipeline/build.py [--refresh]
Standard library only.
"""

import csv
import json
import statistics
import sys
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path

SOURCE = "https://raw.githubusercontent.com/ethankaufman/PL-History-Dashboard/main/data/"
FILES = ["player_seasons.csv", "final_tables.csv"]

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "pipeline" / "raw"
OUT = ROOT / "public" / "data"

ROLE = {"Goalkeeper": "G", "Defender": "D", "Midfielder": "M", "Forward": "F"}

# Players with at least this many league appearances can be drafted.
DRAFT_MIN_APPS = 10
# Players below this are dropped entirely (too little evidence to rate).
KEEP_MIN_APPS = 3

# --- Rating formula ---------------------------------------------------------
# rating = team base + regularity + individual output (+ defence for G/D),
# then a soft cap above SOFT_CAP, then blended with neighbouring seasons.
TEAM_BASE = 62.0          # rating of a regular in a 0-points-per-game side
TEAM_PER_PPG = 9.0        # each point per game adds this much
REGULAR_BONUS = 3.0       # an ever-present starter gains up to this much
REGULAR_PENALTY = 6.0     # a fringe player loses up to this much
YOUTH_PENALTY = {17: 4.0, 18: 3.0, 19: 2.0, 20: 1.0}
OUTPUT_WEIGHT = {"F": 2.4, "M": 1.9, "D": 0.8, "G": 0.0}
DEFENCE_WEIGHT = {"F": 0.0, "M": 0.0, "D": 1.2, "G": 2.0}
SOFT_CAP, SOFT_SLOPE = 88.0, 0.5
NEIGHBOUR_BLEND = 0.3     # share of the rating taken from adjacent seasons
MIN_RATING, MAX_RATING = 55, 95


def fetch(refresh: bool) -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        path = RAW / name
        if refresh or not path.exists():
            print(f"downloading {name}")
            urllib.request.urlretrieve(SOURCE + name, path)


def read(name: str) -> list[dict]:
    with open(RAW / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def season_key(season: str) -> str:
    """'1999–2000' / '2003–04' -> '1999-00' / '2003-04' (ASCII, sortable)."""
    start, end = season.replace("–", "-").split("-")
    return f"{start}-{end[-2:]}"


def zscores(values: list[float]) -> list[float]:
    if len(values) < 2:
        return [0.0] * len(values)
    mean = statistics.fmean(values)
    sd = statistics.pstdev(values) or 1.0
    return [(v - mean) / sd for v in values]


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def build() -> None:
    players = [p for p in read("player_seasons.csv") if p["position"] in ROLE]
    tables = read("final_tables.csv")

    table = {(t["season"], t["team"]): t for t in tables}
    games = {}
    for t in tables:
        games[t["season"]] = int(t["played"])

    for p in players:
        p["role"] = ROLE[p["position"]]
        for k in ("appearances", "goals", "assists", "clean_sheets", "minutes"):
            p[k] = int(p[k] or 0)
        t = table[(p["season"], p["club"])]
        g = games[p["season"]]
        p["share"] = p["minutes"] / (g * 90)
        p["ppg"] = int(t["points"]) / int(t["played"])
        p["age"] = age_at(p["birth_date"], p["season"])
    players = [p for p in players if p["appearances"] >= KEEP_MIN_APPS]

    # Individual output, z-scored within each season and role among regulars,
    # so that eras with fewer goals are not penalised.
    by_group = defaultdict(list)
    for p in players:
        by_group[(p["season"], p["role"])].append(p)
    for group in by_group.values():
        for p in group:
            mins = max(p["minutes"], 1200)  # shrink small samples toward zero
            p["output"] = (p["goals"] + 0.6 * p["assists"]) * 90 / mins
        regulars = [p for p in group if p["share"] >= 0.3] or group
        mean = statistics.fmean(p["output"] for p in regulars)
        sd = statistics.pstdev([p["output"] for p in regulars]) or 1.0
        for p in group:
            p["z_out"] = clamp((p["output"] - mean) / sd, -1.5, 3.5)

    # Team defence, z-scored within each season (lower goals against = better).
    by_season = defaultdict(list)
    for t in tables:
        by_season[t["season"]].append(t)
    z_def = {}
    for season, rows in by_season.items():
        ga = [int(r["goals_against"]) / int(r["played"]) for r in rows]
        for r, z in zip(rows, zscores(ga)):
            z_def[(season, r["team"])] = -z

    for p in players:
        r = TEAM_BASE + TEAM_PER_PPG * p["ppg"]
        share = p["share"]
        if share >= 0.5:
            r += REGULAR_BONUS * clamp((share - 0.5) / 0.4, 0.0, 1.0)
        else:
            r -= REGULAR_PENALTY * clamp((0.5 - share) / 0.4, 0.0, 1.0)
        r -= YOUTH_PENALTY.get(p["age"], 4.0 if p["age"] < 17 else 0.0)
        r += OUTPUT_WEIGHT[p["role"]] * p["z_out"]
        r += DEFENCE_WEIGHT[p["role"]] * z_def[(p["season"], p["club"])] * clamp(p["share"] / 0.6, 0, 1)
        if r > SOFT_CAP:
            r = SOFT_CAP + (r - SOFT_CAP) * SOFT_SLOPE
        p["raw"] = r

    # Blend with the same player's adjacent seasons, so one quiet or injured
    # season does not make a great player look ordinary (and vice versa).
    order = sorted({p["season"] for p in players}, key=season_key)
    index = {s: i for i, s in enumerate(order)}
    career = defaultdict(lambda: defaultdict(list))
    for p in players:
        career[p["player_id"]][index[p["season"]]].append(p["raw"])
    for p in players:
        i = index[p["season"]]
        seasons = career[p["player_id"]]
        near = [max(seasons[j]) for j in (i - 1, i + 1) if j in seasons]
        r = p["raw"]
        if near:
            # Low-minute seasons lean more on neighbours.
            w = NEIGHBOUR_BLEND + 0.3 * clamp(1 - p["share"] / 0.5, 0, 1)
            r = (1 - w) * r + w * statistics.fmean(near)
        p["rating"] = int(round(clamp(r, MIN_RATING, MAX_RATING)))

    write(players, tables, order)


def age_at(birth: str, season: str) -> int:
    born = date.fromisoformat(birth)
    start = int(season[:4])
    return start - born.year - ((born.month, born.day) > (9, 1))


def write(players: list[dict], tables: list[dict], order: list[str]) -> None:
    out = OUT / "seasons"
    out.mkdir(parents=True, exist_ok=True)
    clubs = defaultdict(list)
    for p in players:
        clubs[(p["season"], p["club"])].append(p)

    index = []
    for season in order:
        rows = sorted((t for t in tables if t["season"] == season), key=lambda t: int(t["position"]))
        data = {
            "season": season_key(season),
            "games": int(rows[0]["played"]),
            "fields": ["id", "name", "role", "nation", "age", "rating", "apps", "goals", "assists", "minutes", "draftable"],
            "clubs": [],
        }
        for t in rows:
            squad = sorted(clubs[(season, t["team"])], key=lambda p: (-p["rating"], -p["minutes"]))
            data["clubs"].append({
                "name": t["team"],
                "finish": int(t["position"]),
                "points": int(t["points"]),
                "players": [[
                    int(p["player_id"]), p["player"], p["role"], p["nationality"] or None,
                    p["age"], p["rating"], p["appearances"],
                    p["goals"], p["assists"], p["minutes"],
                    1 if p["appearances"] >= DRAFT_MIN_APPS else 0,
                ] for p in squad],
            })
        path = out / f"{data['season']}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        index.append({"season": data["season"], "games": data["games"], "clubs": len(rows)})

    (OUT / "index.json").write_text(json.dumps({"seasons": index}, indent=1), encoding="utf-8")
    print(f"wrote {len(index)} seasons, {len(players)} player-seasons to {out.relative_to(ROOT)}")


if __name__ == "__main__":
    fetch("--refresh" in sys.argv)
    build()
