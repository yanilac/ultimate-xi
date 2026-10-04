import { useEffect, useMemo, useState } from "react";
import { simulateSeason, startDraft, type DraftState, type Lineup, type SeasonData, type SeasonResult } from "../engine";
import { loadSeasons } from "./data";
import { lineupFromKeys, newSeed, runFromLocation, shareUrl, type RunCode } from "./run";
import { Draft } from "./screens/Draft";
import { FormationPicker } from "./screens/FormationPicker";
import { Home, saveLastResult } from "./screens/Home";
import { Result } from "./screens/Result";
import { Season } from "./screens/Season";
import { recordText } from "./share";

type Screen =
  | { name: "home" }
  | { name: "formation" }
  | { name: "draft"; draft: DraftState }
  | { name: "season"; run: RunCode; lineup: Lineup; result: SeasonResult }
  | { name: "result"; run: RunCode; lineup: Lineup; result: SeasonResult };

export function App() {
  const [seasons, setSeasons] = useState<SeasonData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useEffect(() => {
    loadSeasons().then(setSeasons, () => setError("Couldn't load the player data. Check your connection and reload."));
  }, []);

  const playRun = (run: RunCode, lineup: Lineup, data: SeasonData[]) => {
    const season = data.find((s) => s.season === run.league);
    if (!season) return;
    const result = simulateSeason(run.seed, season, run.formation, lineup);
    setScreen({ name: "season", run, lineup, result });
  };

  // A shared replay link goes straight to that run's season.
  useEffect(() => {
    if (!seasons) return;
    const run = runFromLocation();
    if (!run) return;
    const lineup = lineupFromKeys(run.xi, seasons);
    if (lineup) playRun(run, lineup, seasons);
    else setError("That replay link doesn't match the current player data.");
  }, [seasons]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => window.scrollTo(0, 0), [screen.name]);

  const link = useMemo(() => ("run" in screen ? shareUrl(screen.run) : ""), [screen]);

  if (error) {
    return (
      <main className="screen home">
        <p className="hint">{error}</p>
        <button className="btn btn--primary" onClick={() => { history.replaceState(null, "", location.pathname); location.reload(); }}>
          Start over
        </button>
      </main>
    );
  }

  switch (screen.name) {
    case "home":
      return <Home loading={!seasons} onPlay={() => setScreen({ name: "formation" })} />;
    case "formation":
      return (
        <FormationPicker
          onBack={() => setScreen({ name: "home" })}
          onPick={(f) => setScreen({ name: "draft", draft: startDraft(newSeed(), f, seasons!) })}
        />
      );
    case "draft":
      return (
        <Draft
          state={screen.draft}
          seasons={seasons!}
          onChange={(draft) => setScreen({ name: "draft", draft })}
          onQuit={() => setScreen({ name: "home" })}
          onPlaySeason={() => {
            const d = screen.draft;
            const run: RunCode = { seed: d.seed, formation: d.formation, league: d.leagueSeason, xi: d.lineup.map((p) => p!.key) };
            history.replaceState(null, "", shareUrl(run));
            playRun(run, d.lineup, seasons!);
          }}
        />
      );
    case "season":
      return (
        <Season
          result={screen.result}
          onDone={() => {
            saveLastResult({ record: recordText(screen.result), position: screen.result.user.position, season: screen.result.season });
            setScreen({ ...screen, name: "result" });
          }}
        />
      );
    case "result":
      return (
        <Result
          result={screen.result}
          formation={screen.run.formation}
          lineup={screen.lineup}
          link={link}
          onAgain={() => {
            history.replaceState(null, "", location.pathname);
            setScreen({ name: "formation" });
          }}
        />
      );
  }
}
