# Game engine

The engine is plain TypeScript in `src/engine/`, with no UI code, so it can be tested and tuned on its own. Every random choice comes from a seeded generator. That means a run (draft and season) can be replayed exactly from its seed, which later share links and a daily challenge can use.

| Module | What it does |
|---|---|
| `formations.ts` | The 8 formations, each with exact slot positions, pitch coordinates and chemistry links |
| `positions.ts` | Which slots a player can fill: main position 100%, other listed positions or near neighbours (LB↔LWB, RM↔RW, CF↔ST) 97.5% |
| `icons.ts` | The 48 approved Icons, generated from `docs/icons.md` |
| `chemistry.ts` | Links, player chemistry (0 to 10), team chemistry (0 to 100) and effective ratings |
| `draft.ts` | Spins, picks, re-spins, Icon spins and swaps, as pure functions on a `DraftState` |
| `season.ts` | Team strength, fixtures, the match model, scorers, table, awards and badges |

## Draft rules

- **League:** at the start, a seeded spin picks the Premier League season the XI will play in.
- **Spins:** you tap Spin to start each round. A spin offers 4 players, each from a different random club and season.
  - For each card, a random season is drawn, then a club in it. Clubs that finished higher come up much more often: the champions about 10 times as often as the bottom club.
  - The card is one of that club's best 6 draftable players that season.
  - At least 2 of the 4 fit one of your open slots.
- **Icon spins:** a spin has a 5% chance to be an Icon spin instead, at most once per run. About 4 runs in 10 get one. It offers 4 Icons, at least one of which fits an open slot.
- **Duplicates:** the same person can never appear twice in one XI, across seasons or between an Icon and his Premier League card.
- **Re-spins:** you get 2 per run.
- **Swaps:** two placed players can swap slots if each can play the other's slot.

## Chemistry

- **Strong link:** same club (any season), or same nation and same era (seasons no more than 4 apart).
- **Weak link:** same nation, or same era.
- **Icons:** they link weakly to everyone and strongly to their own nation.
- **Player chemistry:** up to 8 points from the share of strong and weak links to neighbours, plus 2 for playing his main position.
- **Effective rating:** rating × position fit + (chemistry − 2.5) × 0.8. That runs from −2 at 0 chemistry to +6 at 10.

## Season sim

- **The league:** your XI replaces a random bottom-half club in the chosen season. The other clubs field their real best XI in a 4-4-2 shape, at their real ratings.
- **Difficulty:** every player in your XI gets `USER_BONUS` on top of his effective rating. Real clubs are tuned to replay real seasons accurately, so this one constant sets how often a good draft wins. It's set for "Generous": good drafts win about 1 in 3 seasons. With 4 clubs per spin, drafts are strong enough that this needs no bonus, so it is 0.
- **Team strength:** attack and defence are weighted averages of effective ratings by line.
  - Attack weights: forwards 3, midfielders 2, defenders 0.5.
  - Defence weights: keeper 3, defenders 2, midfielders 1.
- **Goals:** each side's goals are a Poisson draw with mean `1.25 × exp(0.55 × (attack − opponent defence) / 10 ± 0.12 home advantage)`.
- **Scorers:** goals go to players weighted by line and their real goals per 90 that season, for both your team and opponents.
- **Assists:** about 75% of goals get an assist from a team-mate, weighted by line and their real assists per 90. Assists use their own random stream, so they did not change any earlier scores or scorers.
- **Awards:** the result gives the final table, top scorers, most assists, your player of the season and badges: perfect season, Invincibles, champions, centurions, 100 goals, and winning with an Icon.

## Tuning

`npm run tune` replays every real season with each club's best XI, then drafts hundreds of XIs with three bots and plays them. Current output:

```
Real seasons replayed (3x each, points per 38 games):
  correlation sim vs real points: 0.89
  spread (SD) sim 17.5 vs real 16.3
  champions' points sim 89.1 vs real 86.8
  goals per game 2.66 (real Premier League is about 2.6 to 2.8)

casual bot (random fitting pick):  68 pts, titles 5%,  top 4 46%
greedy bot (highest rating):       81 pts, titles 27%, top 4 88%
smart bot (rating + chemistry):    83 pts, titles 41%, top 4 91%, unbeaten 2 in 300
```

The match model matches real Premier League seasons. With the Generous setting, a good draft wins the league about 1 in 3 times. An unbeaten season is rare but reachable, and a planned XI with high chemistry and an Icon is the way to chase 38-0-0. The bots only look one pick ahead. Difficulty is set by `USER_BONUS` in `season.ts`. `SQUAD_POOL`, club weighting and the chemistry constants change how strong drafts are.
