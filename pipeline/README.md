# Player data pipeline

`python3 pipeline/build.py` downloads the source data (cached in `pipeline/raw/`, not committed) and writes the game data:

- `public/data/index.json`: the list of seasons, each with its number of games and clubs.
- `public/data/seasons/<season>.json`: one file per season. Each file lists every club with its final position and points. Each player has the fields named in `fields`: id, name, role (G/D/M/F), positions (such as `RW/LW/CF`, main position first), nation, age, rating, apps, goals, assists, minutes, draftable.

`python3 pipeline/spotcheck.py` prints famous squads and career rating lines to sanity-check the formula. Pass `season club` pairs to look at others, for example `python3 pipeline/spotcheck.py 1995-96 "Newcastle United"`.

Both scripts use only the Python standard library.

## Source

The source is the per-player season totals and final tables for every Premier League season from 1992-93 to 2025-26, taken from [ethankaufman/PL-History-Dashboard](https://github.com/ethankaufman/PL-History-Dashboard). That project collected them from the Premier League's public statistics service and cross-checked them against other sources. The repo has no licence file, so its data is used here for a non-commercial fan project only. The raw CSVs are never committed; only derived ratings are.

## Positions

- **2004/05 onward:** detailed positions come from FIFA 05 to FIFA 20 records ([lbenz730/fifa_model](https://github.com/lbenz730/fifa_model)). A player is matched by birth date and a whole-word surname. Each season uses the nearest FIFA edition, so a player who moved positions over his career changes with it. This covers about 72% of draftable players.
- **Everyone else:** players with no FIFA match, mostly those who retired before 2004 plus a few since 2020, take their positions from `pipeline/positions_manual.csv`. Those were labelled by hand from football knowledge, and the `confidence` column marks the roughly 1 in 5 that are guesses. Edit that file to correct anyone.

## Rating formula

FIFA-style ratings don't exist for most of these seasons, so every player-season is rated by one formula. This keeps all eras on the same scale. It works in these steps:

1. **Team base:** 62 + 9 × the club's points per game. A regular for a 90-point side starts around 83; for a relegated side, around 69.
2. **Regularity:** an ever-present starter gains up to +3, and a fringe player loses up to −6.
3. **Youth:** players aged 17 to 20 lose 4, 3, 2 or 1 respectively.
4. **Output:** goals plus 0.6 × assists per 90 minutes, z-scored against players in the same role and season. It's weighted 2.4 for forwards, 1.9 for midfielders, 0.8 for defenders and 0 for keepers.
5. **Defence:** for keepers and defenders, the club's goals conceded, z-scored within the season.
6. **Soft cap:** above 88, only half of any extra counts.
7. **Neighbour blend:** 30 to 60% of the rating comes from the same player's adjacent seasons. Low-minute seasons lean on neighbours more, so an injury year doesn't sink a great player.

All the weights are constants at the top of `build.py`, ready to tune.

**Known limits:**
- The team base dominates, so stars at weak clubs come out low. For example, Le Tissier peaks at 82.
- The top of the scale is about 91 (Haaland 2022-23, Henry 2002-05).

Players with 10 or more appearances in a season are marked draftable. Players with fewer than 3 appearances are dropped.
