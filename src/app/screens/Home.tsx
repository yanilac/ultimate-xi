import { useState } from "react";
import { HowToPlay } from "../components/HowToPlay";
import { MODES, type Mode } from "../modes";

export interface LastResult {
  record: string;
  position: number;
  season: string;
}

export function readLastResult(): LastResult | null {
  try {
    const raw = localStorage.getItem("ultimate-xi:last");
    return raw ? (JSON.parse(raw) as LastResult) : null;
  } catch {
    return null;
  }
}

export function saveLastResult(r: LastResult) {
  try {
    localStorage.setItem("ultimate-xi:last", JSON.stringify(r));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}
export { ordinal };

export function Home({
  mode,
  onMode,
  onPlay,
  onBoard,
  loading,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  onPlay: () => void;
  /** Open the shared leaderboard, or null when there isn't one. */
  onBoard: (() => void) | null;
  loading: boolean;
}) {
  const [help, setHelp] = useState(false);
  const last = readLastResult();
  return (
    <main className="screen home">
      <div className="home__hero">
        <h1>Draft an XI, play a season</h1>
        <p className="home__tag">Eleven spins, one squad, a full league season. Can you go unbeaten?</p>
      </div>
      <div className="modes" role="radiogroup" aria-label="Game mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === mode}
            className={m.id === mode ? "mode mode--on" : "mode"}
            onClick={() => onMode(m.id)}
          >
            <span className="mode__dot" aria-hidden />
            <span className="mode__name">{m.name}</span>
            <span className="mode__blurb">{m.blurb}</span>
          </button>
        ))}
      </div>
      <button className="btn btn--primary btn--big" onClick={onPlay} disabled={loading}>
        {loading ? "Loading players…" : "Play"}
      </button>
      {last && (
        <p className="home__last">
          <span>Last season, {last.season.replace("-", "/")}</span>
          <span>
            <b>{last.record}</b> · {ordinal(last.position)}
          </span>
        </p>
      )}
      <div className="home__more">
        {onBoard && (
          <button className="btn btn--ghost" onClick={onBoard}>
            Leaderboard
          </button>
        )}
        <button className="btn btn--ghost" onClick={() => setHelp(!help)} aria-expanded={help}>
          {help ? "Hide how to play" : "How to play"}
        </button>
      </div>
      {help && <HowToPlay />}
      <p className="version">
        v{__APP_VERSION__} · {__APP_COMMIT__}
      </p>
    </main>
  );
}
