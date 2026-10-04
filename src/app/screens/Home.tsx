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
  loading,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  onPlay: () => void;
  loading: boolean;
}) {
  const [help, setHelp] = useState(false);
  const last = readLastResult();
  return (
    <main className="screen home">
      <div className="home__hero">
        <h1 className="home__title">Ultimate XI</h1>
        <p className="home__tag">Draft a team, play a full league season. Can you go unbeaten?</p>
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
          Last time: {last.record} and finished {ordinal(last.position)} in {last.season.replace("-", "/")}
        </p>
      )}
      <button className="btn btn--ghost" onClick={() => setHelp(!help)}>
        {help ? "Hide how to play" : "How to play"}
      </button>
      {help && <HowToPlay />}
      <p className="version">
        v{__APP_VERSION__} · {__APP_COMMIT__}
      </p>
    </main>
  );
}
