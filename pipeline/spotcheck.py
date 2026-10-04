"""Print the top-rated XI-ish of famous club-seasons and a few named players,
to eyeball whether the rating formula feels right.

Usage: python3 pipeline/spotcheck.py [season club ...]
"""

import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "public" / "data" / "seasons"

SQUADS = [
    ("1993-94", "Manchester United"),
    ("1994-95", "Blackburn Rovers"),
    ("1998-99", "Manchester United"),
    ("2003-04", "Arsenal"),
    ("2004-05", "Chelsea"),
    ("2015-16", "Leicester City"),
    ("2017-18", "Manchester City"),
    ("2019-20", "Liverpool"),
    ("2022-23", "Manchester City"),
    ("2005-06", "Sunderland"),
]

PLAYERS = [
    "Alan Shearer", "Eric Cantona", "Dennis Bergkamp", "Thierry Henry", "Frank Lampard",
    "John Terry", "Steven Gerrard", "Cristiano Ronaldo", "Mohamed Salah", "Virgil van Dijk",
    "Erling Haaland", "Peter Schmeichel", "Matthew Le Tissier", "David Ginola", "Gianfranco Zola", "Paul Scholes",
]


def load(season: str) -> dict:
    return json.loads((DATA / f"{season}.json").read_text(encoding="utf-8"))


def squad(season: str, club: str) -> None:
    data = load(season)
    c = next(c for c in data["clubs"] if c["name"] == club)
    print(f"\n{club} {season}  (finished {c['finish']}, {c['points']} pts)")
    for p in c["players"][:14]:
        _, name, role, nation, age, rating, apps, goals, assists, minutes, draft = p
        print(f"  {rating:>3} {role} {name:<26} {nation or '?':<14} {apps:>2} apps {goals:>2}g {assists:>2}a")


def player(name: str) -> None:
    rows = []
    for path in sorted(DATA.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for c in data["clubs"]:
            for p in c["players"]:
                if p[1] == name:
                    rows.append(f"{data['season']} {c['name'][:14]}:{p[5]}")
    print(f"{name}: " + ", ".join(rows))


if __name__ == "__main__":
    args = sys.argv[1:]
    if args:
        for i in range(0, len(args), 2):
            squad(args[i], args[i + 1])
    else:
        for s, c in SQUADS:
            squad(s, c)
        print()
        for n in PLAYERS:
            player(n)
