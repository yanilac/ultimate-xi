import { useEffect, useState } from "react";
import type { SeasonData } from "../../engine";
import { seasonLabel } from "../data";
import { buildBoard, fetchTitles, PERIODS, playerId, type BoardRow, type Period } from "../leaderboard";
import { MODES, type Mode } from "../modes";
import { decodeRun, shareUrl } from "../run";

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
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState(false);
  const me = `p:${playerId()}`;

  useEffect(() => {
    if (!seasons) return;
    let live = true;
    setRows(null);
    setError(false);
    fetchTitles(mode, period).then(
      (entries) => live && setRows(buildBoard(entries, seasons).slice(0, 50)),
      () => live && setError(true),
    );
    return () => {
      live = false;
    };
  }, [mode, period, seasons]);

  const open = (row: BoardRow) => {
    const run = decodeRun(row.best.link);
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
        <p className="hint">No titles won {period === "today" ? "today" : period === "week" ? "this week" : "yet"}. Be the first.</p>
      ) : (
        <ol className="board__list">
          {rows.map((row, i) => (
            <li key={row.key}>
              <button type="button" className={row.key === me ? "board__row board__row--mine" : "board__row"} onClick={() => open(row)}>
                <span className="board__rank">{i + 1}</span>
                <span className="board__who">
                  <b>{row.name}</b>
                  <small>
                    Best: {seasonLabel(row.best.season)} · {row.best.won}-{row.best.drawn}-{row.best.lost}
                  </small>
                </span>
                <span className="board__rec">
                  {row.titles}
                  <small>{row.titles === 1 ? "title" : "titles"}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="hint board__note">Ranked by titles. Ties go to the best title season (points per game, then goal difference). Tap a row to watch that season.</p>
    </main>
  );
}
