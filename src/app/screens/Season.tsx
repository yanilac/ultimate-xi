import { useEffect, useMemo, useState } from "react";
import type { MatchResult, SeasonResult } from "../../engine";
import { leagueTitle } from "../data";
import { ordinal } from "./Home";

const WEEK_MS = 650;

interface Row { team: number; name: string; isUser: boolean; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }

/** League table after the first `weeks` matchdays. */
export function tableAfter(result: SeasonResult, weeks: number): Row[] {
  const rows: Row[] = result.teams.map((t, i) => ({ team: i, name: t.name, isUser: t.isUser, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
  for (const m of result.matchdays.slice(0, weeks).flat()) {
    const add = (team: number, gf: number, ga: number) => {
      const r = rows[team]!;
      r.p++; r.gf += gf; r.ga += ga;
      if (gf > ga) { r.w++; r.pts += 3; } else if (gf === ga) { r.d++; r.pts++; } else r.l++;
    };
    add(m.home, m.homeGoals, m.awayGoals);
    add(m.away, m.awayGoals, m.homeGoals);
  }
  return rows.sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name));
}

export function MiniTable({ rows, limit }: { rows: Row[]; limit?: number }) {
  const userIndex = rows.findIndex((r) => r.isUser);
  const shown = limit
    ? rows.filter((_, i) => i < limit || i === userIndex)
    : rows;
  return (
    <table className="table">
      <thead>
        <tr><th>#</th><th className="table__team">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
      </thead>
      <tbody>
        {shown.map((r) => (
          <tr key={r.team} className={r.isUser ? "table__user" : ""}>
            <td>{rows.indexOf(r) + 1}</td>
            <td className="table__team">{r.name}</td>
            <td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td>
            <td>{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</td>
            <td><b>{r.pts}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UserMatch({ result, match, week }: { result: SeasonResult; match: MatchResult; week: number }) {
  const user = result.user.team;
  const home = result.teams[match.home]!.name;
  const away = result.teams[match.away]!.name;
  const userGoals = match.home === user ? match.homeGoals : match.awayGoals;
  const otherGoals = match.home === user ? match.awayGoals : match.homeGoals;
  const outcome = userGoals > otherGoals ? "win" : userGoals === otherGoals ? "draw" : "loss";
  return (
    <div className={`match match--${outcome}`}>
      <p className="eyebrow">Matchday {week}</p>
      <div className="match__score">
        <span className="match__team">{home}</span>
        <span className="match__goals">{match.homeGoals} – {match.awayGoals}</span>
        <span className="match__team">{away}</span>
      </div>
      {/* Fixed height, home goals under the home team and away under away, so the table below never jumps. */}
      <div className="match__scorers">
        {[match.home, match.away].map((team) => (
          <ul key={team} className="match__side">
            {match.goals
              .filter((g) => g.team === team)
              .map((g, i) => (
                <li key={i} className={g.team === user ? "match__scorer--user" : ""}>
                  {g.minute}′ {g.scorer}
                  {g.assister && <span className="match__assist"> ({g.assister})</span>}
                </li>
              ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export function Season({ result, onDone }: { result: SeasonResult; onDone: () => void }) {
  const total = result.matchdays.length;
  const [week, setWeek] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || week >= total) return;
    const id = setTimeout(() => setWeek((w) => w + 1), week === 0 ? 300 : WEEK_MS);
    return () => clearTimeout(id);
  }, [week, playing, total]);

  const rows = useMemo(() => tableAfter(result, week), [result, week]);
  const user = rows.find((r) => r.isUser)!;
  const match = week > 0 ? result.matchdays[week - 1]!.find((m) => m.home === result.user.team || m.away === result.user.team) : null;

  return (
    <main className="screen season">
      <header className="topbar">
        <span className="eyebrow">{leagueTitle(result.season)}</span>
        <span className="topbar__round">Week {week}/{total}</span>
      </header>
      <div className="record">
        <span><b>{user.w}</b>W</span><span><b>{user.d}</b>D</span><span><b>{user.l}</b>L</span>
        <span className="record__pos">{ordinal(rows.indexOf(user) + 1)}</span>
      </div>
      {match ? <UserMatch result={result} match={match} week={week} /> : (
        <div className="match"><p className="eyebrow">Kick-off</p><p>Your XI replaces {result.replaced}.</p></div>
      )}
      <MiniTable rows={rows} limit={6} />
      <div className="season__controls">
        {week < total ? (
          <>
            <button className="btn btn--ghost" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
            <button className="btn btn--ghost" onClick={() => setWeek(total)}>Skip to the end</button>
          </>
        ) : (
          <button className="btn btn--primary btn--big" onClick={onDone}>See the final result</button>
        )}
      </div>
    </main>
  );
}
