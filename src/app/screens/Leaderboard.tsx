import { useEffect, useState } from "react";
import type { SeasonData } from "../../engine";
import { seasonLabel } from "../data";
import type { Career } from "../career";
import { buildBoard, fetchPersonSeasons, fetchTitles, PERIODS, personRecord, playerId, type BoardRow, type Period } from "../leaderboard";
import { MODES, type Mode } from "../modes";

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
  const [openKey, setOpenKey] = useState<string | null>(null);
  const me = `p:${playerId()}`;
  // Bumped when you come back to the page, so the board is never stale.
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && setRefresh((n) => n + 1);
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, []);

  useEffect(() => {
    if (!seasons) return;
    let live = true;
    setRows(null);
    setError(false);
    setOpenKey(null);
    fetchTitles(mode, period).then(
      (entries) => live && setRows(buildBoard(entries, seasons).slice(0, 50)),
      () => live && setError(true),
    );
    return () => {
      live = false;
    };
  }, [mode, period, seasons, refresh]);

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
              <button type="button" className={row.key === me ? "board__row board__row--mine" : "board__row"} onClick={() => setOpenKey(openKey === row.key ? null : row.key)} aria-expanded={openKey === row.key}>
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
              {openKey === row.key && seasons && <PersonRecord mode={mode} row={row} seasons={seasons} />}
            </li>
          ))}
        </ol>
      )}
      <p className="hint board__note">Ranked by titles. Ties go to the best title season (points per game, then goal difference). Tap a name to see their record.</p>
    </main>
  );
}

/** A person's all-time record in this mode, laid out like your own record bar. */
function PersonRecord({ mode, row, seasons }: { mode: Mode; row: BoardRow; seasons: SeasonData[] }) {
  const [record, setRecord] = useState<Career | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    fetchPersonSeasons(mode, row).then(
      (entries) => live && setRecord(personRecord(entries, seasons)),
      () => live && setError(true),
    );
    return () => {
      live = false;
    };
  }, [mode, row, seasons]);

  if (error) return <p className="hint board__record">Couldn't load {row.name}'s record.</p>;
  if (!record) return <p className="hint board__record">Loading…</p>;
  return (
    <div className="board__record career-strip" aria-label={`${row.name}'s record`}>
      <span className="career-strip__item">
        <span className="career-strip__trophy" aria-hidden>🏆</span>
        <b>{record.titles}</b> {record.titles === 1 ? "title" : "titles"}
      </span>
      <span className={record.streak > 0 ? "career-strip__item career-strip__item--hot" : "career-strip__item"}>
        <b>{record.streak}</b> in a row
        {record.bestStreak > 0 && <span className="career-strip__best"> (best {record.bestStreak})</span>}
      </span>
      <span className="career-strip__item">
        <b>{record.seasons}</b> {record.seasons === 1 ? "season" : "seasons"}
      </span>
    </div>
  );
}
