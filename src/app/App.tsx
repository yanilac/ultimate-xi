import { useEffect, useMemo, useRef, useState } from "react";
import { simulateSeason, startDraft, type DraftState, type Lineup, type SeasonData, type SeasonResult } from "../engine";
import { addSeason, readCareer, saveCareer, type Career } from "./career";
import { CareerStrip } from "./components/CareerStrip";
import { loadSeasons } from "./data";
import { leaderboardEnabled, markSubmitted, submitEntry } from "./leaderboard";
import { modeOfSeason, readMode, saveMode, type Mode } from "./modes";
import { lineupFromKeys, newSeed, runFromLocation, shareUrl, type RunCode } from "./run";
import { Draft } from "./screens/Draft";
import { FormationPicker } from "./screens/FormationPicker";
import { Home, saveLastResult } from "./screens/Home";
import { Leaderboard } from "./screens/Leaderboard";
import { Result } from "./screens/Result";
import { Season } from "./screens/Season";
import { recordText } from "./share";

type Screen =
  | { name: "home" }
  | { name: "formation" }
  | { name: "leaderboard" }
  | { name: "draft"; draft: DraftState }
  | { name: "season"; run: RunCode; lineup: Lineup; result: SeasonResult; own: boolean }
  | { name: "result"; run: RunCode; lineup: Lineup; result: SeasonResult; own: boolean };

export function App() {
  // A replay link decides the mode; otherwise it's whatever you played last.
  const [mode, setMode] = useState<Mode>(() => {
    const run = runFromLocation();
    return run ? modeOfSeason(run.league) : readMode();
  });
  const [loaded, setLoaded] = useState<{ mode: Mode; data: SeasonData[] } | null>(null);
  const seasons = loaded?.mode === mode ? loaded.data : null;
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [career, setCareer] = useState<Career>(() => readCareer(mode));

  useEffect(() => {
    loadSeasons(mode).then(
      (data) => setLoaded({ mode, data }),
      () => setError("Couldn't load the player data. Check your connection and reload."),
    );
  }, [mode]);

  const chooseMode = (m: Mode) => {
    setMode(m);
    saveMode(m);
    setCareer(readCareer(m));
  };

  // own: drafted on this device, so it counts toward your record. Replays of shared links don't.
  const playRun = (run: RunCode, lineup: Lineup, data: SeasonData[], own: boolean) => {
    const season = data.find((s) => s.season === run.league);
    if (!season) return;
    const result = simulateSeason(run.seed, season, run.formation, lineup);
    setScreen({ name: "season", run, lineup, result, own });
  };

  // A shared replay link goes straight to that run's season, once, when its data arrives.
  const replayed = useRef(false);
  useEffect(() => {
    if (!seasons || replayed.current) return;
    replayed.current = true;
    const run = runFromLocation();
    if (!run) return;
    const lineup = lineupFromKeys(run.xi, seasons);
    if (lineup) playRun(run, lineup, seasons, false);
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

  return (
    <>
      <CareerStrip career={career} />
      {renderScreen()}
    </>
  );

  function renderScreen() {
  switch (screen.name) {
    case "home":
      return (
        <Home
          mode={mode}
          onMode={chooseMode}
          loading={!seasons}
          onPlay={() => setScreen({ name: "formation" })}
          onBoard={leaderboardEnabled ? () => setScreen({ name: "leaderboard" }) : null}
        />
      );
    case "leaderboard":
      return <Leaderboard mode={mode} seasons={seasons} onMode={chooseMode} onBack={() => setScreen({ name: "home" })} />;;
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
            playRun(run, d.lineup, seasons!, true);
          }}
        />
      );
    case "season":
      return (
        <Season
          result={screen.result}
          onDone={() => {
            const { result, run, own } = screen;
            saveLastResult({ record: recordText(result), position: result.user.position, season: result.season });
            if (own) {
              const next = addSeason(career, run.seed, result.user.position, result.user.row.lost === 0);
              saveCareer(modeOfSeason(run.league), next);
              setCareer(next);
            }
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
          career={screen.own ? career : null}
          onSubmit={
            screen.own && leaderboardEnabled
              ? async (name) => {
                  const ok = await submitEntry(name, screen.run, screen.result);
                  if (ok) markSubmitted(screen.run.seed);
                  return ok;
                }
              : null
          }
          onBoard={() => {
            history.replaceState(null, "", location.pathname);
            chooseMode(modeOfSeason(screen.run.league));
            setScreen({ name: "leaderboard" });
          }}
          onAgain={() => {
            history.replaceState(null, "", location.pathname);
            setScreen({ name: "formation" });
          }}
        />
      );
  }
  }
}
