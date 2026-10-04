import { useState } from "react";
import { FORMATIONS } from "../../engine";

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

export function Home({ onPlay, loading }: { onPlay: () => void; loading: boolean }) {
  const [help, setHelp] = useState(false);
  const last = readLastResult();
  return (
    <main className="screen home">
      <div className="home__hero">
        <p className="eyebrow">Premier League 1992 to today</p>
        <h1 className="home__title">Ultimate XI</h1>
        <p className="home__tag">Draft a team from any season. Play a full league season. Can you go 38-0-0?</p>
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
        {help ? "Hide how it works" : "How it works"}
      </button>
      {help && (
        <ol className="howto">
          <li>Pick one of {FORMATIONS.length} formations.</li>
          <li>Each round spins a Premier League club and season. Pick 1 of 4 players and put him in a slot he can play.</li>
          <li>Players from the same club, nation or era link up. Better links mean better chemistry and higher ratings.</li>
          <li>Watch out for rare Icon spins: Maradona, Pelé, Messi and more.</li>
          <li>Your XI then plays a full Premier League season, week by week.</li>
        </ol>
      )}
      <p className="version">
        v{__APP_VERSION__} · {__APP_COMMIT__}
      </p>
    </main>
  );
}
