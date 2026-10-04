import { useEffect, useState } from "react";
import type { SeasonData } from "../../engine";
import { seasonLabel } from "../data";
import { fetchBoard, PERIODS, readSubmitted, verifyEntry, type Entry, type Period } from "../leaderboard";
import { MODES, type Mode } from "../modes";
import { decodeRun, shareUrl } from "../run";
import { ordinal } from "./Home";

export function Leaderboard({
  mode,
  seasons,
  onMode,
  onBack,
}: {
  mode: Mode;
  /** This mode's player data, used to replay and check each entry. Null while loading. */
  seasons: SeasonData[] | null;
  onMode: (m: Mode) => void;
  onBack: () => void;
}) {
  const [period, setPeriod] = useState<Period>("today");
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [error, setError] = useState(false);
  const mine = readSubmitted();

  useEffect(() => {
    if (!seasons) return;
    let live = true;
    setRows(null);
    setError(false);
    fetchBoard(mode, period).then(
      (entries) => live && setRows(entries.filter((e) => verifyEntry(e, seasons)).slice(0, 50)),
      () => live && setError(true),
    );
    return () => {
      live = false;
    };
  }, [mode, period, seasons]);

  const open = (e: Entry) => {
    const run = decodeRun(e.link);
    if (!run) return;
    location.href = shareUrl(run);
    location.reload();
  };

  return (
    <main className="screen board">
      <div className="board__top">
        <button className="btn btn--ghost btn--small" onClick={onBack}>Back</button>
        <h1 className="board__title">Leaderboard</h1>
      </div>
      <div className="tabs" role="tablist" aria-label="Mode">
        {MODES.map((m) => (
          <button key={m.id} role="tab" aria-selected={m.id === mode} className={m.id === mode ? "tab tab--on" : "tab"} onClick={() => onMode(m.id)}>
            {m.short}
          </button>
        ))}
      </div>
      <div className="tabs" role="tablist" aria-label="Period">
        {PERIODS.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === period} className={p.id === period ? "tab tab--on" : "tab"} onClick={() => setPeriod(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="hint">Couldn't load the leaderboard. Check your connection and try again.</p>
      ) : !rows ? (
        <p className="hint">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="hint">No seasons yet {period === "today" ? "today" : period === "week" ? "this week" : ""}. Be the first.</p>
      ) : (
        <ol className="board__list">
          {rows.map((e, i) => (
            <li key={e.seed}>
              <button type="button" className={mine.includes(e.seed) ? "board__row board__row--mine" : "board__row"} onClick={() => open(e)}>
                <span className="board__rank">{i + 1}</span>
                <span className="board__who">
                  <b>{e.name}</b>
                  <small>
                    {seasonLabel(e.season)} · {e.formation} · {e.position === 1 ? "Champions" : ordinal(e.position)}
                  </small>
                </span>
                <span className="board__rec">
                  {e.won}-{e.drawn}-{e.lost}
                  <small>{e.points} pts · {e.gd > 0 ? "+" : ""}{e.gd}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="hint board__note">Ranked by points per game, then goal difference. Tap a season to watch it.</p>
    </main>
  );
}
