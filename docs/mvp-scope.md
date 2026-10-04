# Ultimate XI Season: MVP scope

*Working title. Scoped with Yani on 2026-10-04 and revised the same day to Premier League only, with Icons. Nothing is built yet.*

## The pitch

Draft a starting XI one spin at a time from any Premier League season since 1992, like 38-0-0.com. If you're lucky, you might land a legend like Maradona or Eusébio. Build chemistry between your players, like FIFA Ultimate Team. Then watch your team play a full league season, week by week. Can you go 38-0-0?

## Decisions so far

| # | Question | Decision |
|---|----------|----------|
| 1 | How you get players | Spin and draft. No packs and no budget. |
| 2 | Real or fictional | Real names, ratings and nations. No club badges, kits or player photos. |
| 3 | Chemistry | FUT-style links between neighbouring positions, reworked for a single league (see below). |
| 4 | What one game is | A single run: build, simulate, share, replay. A persistent club comes after the MVP. |
| 5 | Player pool | **Premier League only, 1992/93 to the latest completed season**, plus a small set of rare **Icons**: all-time greats from outside the Premier League. |
| 6 | Draft round | Each round spins a new club and season. You pick 1 of 4 players. |
| 7 | Sim depth | Every match result with scorers, revealed week by week, then the final table and awards. |
| 8 | Tech | A browser-only web app with no server, on free static hosting. |

## Core loop (one run, about 5 minutes)

1. **Pick a formation.** Choose from 4-3-3, 4-4-2, 4-2-4, 3-4-3, 3-5-2, 5-3-2 or 5-4-1. Every slot shows its exact position, for example 4-3-3 is GK, RB, CB, CB, LB, CDM, CM, CM, RW, ST, LW.
2. **Draft 11 rounds.**
   - Each round spins a random Premier League club and season, for example *Blackburn 1994/95*.
   - You see 4 players from that squad and pick one.
   - You tap an open slot to put him in. He can only go in a slot matching one of his real positions (see Positions below).
   - At least one of the 4 must fit an open slot. If none does, the round re-spins automatically.
   - You get **3 re-spins per run**.
3. **Icon spin (rare).**
   - Any round has about a 5% chance of becoming an Icon spin. You get at most one Icon spin per run, so roughly 4 runs in 10 see one.
   - Instead of a club, you're shown 4 Icons and pick one.
   - Your other 10 slots stay Premier League players.
4. **Review the team.** You see the team rating, chemistry per player and links on the pitch. While slots are still open, you can swap a player between two slots he can both play.
5. **Simulate the season.** Matchdays are revealed one by one, with scores and scorers. You can also skip straight to the end.
6. **See the result.** This shows your record, final table position, top scorer, player of the season and badges such as Invincibles, 38-0-0, 100 goals or "Won it with an Icon".
7. **Share** an image card and a link, or **build another** team.

## Icons

- **What they are:** a hand-picked roster of about 30 to 40 all-time greats who mostly never played in the Premier League, such as Maradona, Eusébio, Pelé, Cruyff, Beckenbauer, Zidane, Ronaldo (R9), Maldini, Puskás and Yashin.
- **The list:** an approved list of 48 is in `icons-draft.md`.
- **Players who also had Premier League seasons,** like Davids or Okocha, can be Icons too, as a career-peak card on top of their normal season cards. Two copies of the same player can't be in one XI.
- **Ratings:** hand-set, around 89 to 95, and shown with a gold card.
- **Chemistry:** an Icon gets a **weak link to every neighbour**, and a **strong link** to a neighbour of the same nation. He's never a chemistry dead end, but he doesn't fix your team on his own.
- **Name:** "Icon" is FUT's term. We may want our own word, such as "Legend".

## Positions

- **What each player has:** 1 to 3 real positions, using FIFA codes: GK, RB, CB, LB, RWB, LWB, CDM, CM, CAM, RM, LM, RW, LW, CF and ST. His main position comes first.
- **Where positions come from:**
  - For seasons from 2004/05, they come from FIFA's own ratings, using the FIFA edition nearest the season. That covers about 72% of draftable players.
  - Earlier players were labelled by hand. About 1 in 5 of those labels are guesses for little-known squad players.
- **Which slots a player can fill:**
  - Any of his listed positions.
  - Near neighbours too: full-back and wing-back swap freely, wide midfielders and wingers swap on the same side, and CF and ST swap.
  - **Natural fit:** his main position, at 100% of his rating.
  - **Listed alternate or near neighbour:** 95% of his rating.

## Chemistry (single-league version)

Every player is from the same league, so the FUT "same league" link no longer means anything. The links are reworked like this:

- **Links** follow the formation's lines between neighbouring slots. Each link is scored like this:
  - **Strong** (green): same club (any season), *or* same nation and same era (seasons no more than 3 apart).
  - **Weak** (amber): same nation (any era), *or* same era.
  - **None** (red): nothing in common.
- **Player chemistry** runs from 0 to 10. It comes from his links, with a bonus for playing his natural position.
- **Team chemistry** runs from 0 to 100, as the sum across the XI.
- **Effect:** each player's effective rating is his base rating, adjusted by how well he fits the slot and by his chemistry.
  - Position fit: natural position is 100%, a listed alternate is 95%.
  - Chemistry: from −3 at 0 chem up to +3 at 10 chem.
  - All numbers are first guesses to tune by playtesting.
- **Why "era" counts:** it rewards building a coherent side, such as a 2000s XI, and the same-club link rewards spins that land on clubs you already have.

## Season simulation

- **Which season you play in:**
  - Before the draft, a spin picks a Premier League season.
  - Your XI replaces one of that season's clubs, chosen at random from the bottom half.
  - The other clubs are the real opponents for that season, rated from the average of their best 11 players.
  - **1992/93 to 1994/95 had 22 clubs and 42 games, so the target in those seasons is 42-0-0.** That's a fun twist worth keeping.
- **Match model:**
  - Each team gets an attack and a defence strength, taken from the ratings of its attackers and defenders, with a small home advantage.
  - Goals are drawn from a Poisson distribution, which is the standard simple football model.
- **Scorers:** goals are given to your players by position and attacking rating. Opposition scorers are shown as the club name only.
- **Seeded randomness:** a run can be replayed exactly from its share link, and later the same seed could drive a daily challenge.
- **Tuning target:** an average XI should finish mid-table, and 38-0-0 should be rare even for a stacked team.

## Player data (the biggest job)

FIFA/FC ratings only exist from the mid-2000s, and public datasets mostly cover 2014 onward. So the ratings for 1992 to the mid-2000s have to be made by us.

- **Squads, appearances and goals for every season:**
  - The likely source is a public Premier League 1992 to 2024 player dataset. [This Kaggle one](https://www.kaggle.com/datasets/samoilovmikhail/all-premier-league-team-and-players-1992-2024/versions/2) is the first candidate, but I haven't checked its fields or licence yet.
  - Wikipedia's season squad pages are the fallback.
- **Ratings (picked default):**
  - One consistent formula for every season, based on minutes or appearances, goals and assists, clean sheets for keepers and defenders, and the club's final position.
  - It is calibrated against real FIFA ratings for the seasons where both exist, so the two eras feel the same.
  - Famous players get a quick hand-check, so peak Cantona or Henry feel right.
  - The alternative is to use real FIFA ratings where they exist and the formula only before then. That's more accurate for recent seasons, but the scale may jump between eras.
- **Positions:** taken from the squad data. They may need hand-cleaning for the 1990s, which only used broad labels like DF/MF/FW, so full-backs versus centre-backs and wingers versus central midfielders need splitting.
- **Pool filter:** each club-season only offers players with about 10 or more league appearances, so the 4 cards are real squad members.
- **Size:** 33 seasons × about 20 clubs × about 20 players is roughly 13,000 player-seasons, which is easily small enough to ship as static JSON.
- **Legal posture:** this is a fan project. It uses real names and ratings but no badges, kits, photos or Premier League/EA branding. Making money from it later would need a rethink.

## Screens (mobile-first, portrait)

1. **Home:** play, how it works, and your last result.
2. **Formation picker.**
3. **Draft:** the spin animation, then the club and season, 4 player cards (gold for Icons), and the pitch with open slots highlighted.
4. **Team review:** the pitch with link lines, plus team rating and chemistry.
5. **Season:** a matchday ticker with a mini table and skip button.
6. **Result:** the record, table, awards and a share card.

## Tech

- **Stack:** Vite, TypeScript and React (Preact is also fine).
- **Hosting:** static, on GitHub Pages, Netlify or Cloudflare Pages, all free.
- **Server:** none. The last result and settings are kept in localStorage.
- **Share card:** drawn on a canvas in the browser.
- **Code layout:** the season sim, chemistry and rating formula are plain TypeScript modules with unit tests, kept separate from the UI, so they're easy to tune and to reuse for the persistent-club mode later.

## Not in the MVP

- Other leagues.
- Accounts, saving clubs and multi-season careers. This is the planned next phase.
- Packs, coins, budget or a transfer market.
- Live match commentary.
- Badges, photos and kits.
- Leaderboards, multiplayer and a daily challenge. A daily challenge is cheap to add after the MVP thanks to seeded runs.
- Cups and European competition.
- Expert mode with hidden ratings.

## Milestones

1. **Data:**
   - Pick and check the squad dataset, then build the rating formula and calibrate it.
   - Hand-clean the positions for the 1990s.
   - Draft the Icons list for Yani to approve.
   - Spot-check famous squads, such as Arsenal 2003/04 and Man United 1998/99.
2. **Engine:** build the draft rules, chemistry and season sim, with tests, and tune with a script that simulates thousands of random XIs.
3. **UI:** build the six screens on mobile, then share cards.
4. **Ship:** deploy to static hosting and playtest with friends.

## Open questions (none block starting)

- **Icons:** the final list of names and the name for them.
- **Name of the game.** "Ultimate XI Season" is a placeholder.
- **Repository:** a GitHub repo needs to be created or connected before any code is written.
