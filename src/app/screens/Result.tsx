import { useState } from "react";
import type { Lineup, SeasonResult } from "../../engine";
import type { Career } from "../career";
import { leagueTitle, seasonLabel } from "../data";
import { LeaderboardName } from "../components/LeaderboardName";
import { BADGE_LABEL, drawShareCard, recordText } from "../share";
import { ordinal } from "./Home";
import { MiniTable, tableAfter } from "./Season";

export function Result({
  result,
  formation,
  lineup,
  link,
  career,
  board,
  onBoard,
  onAgain,
  onHome,
}: {
  result: SeasonResult;
  formation: string;
  lineup: Lineup;
  link: string;
  /** Your record after this season, or null for a replay of someone else's run. */
  career: Career | null;
  /** Leaderboard state for this run; null when it can't go there (a replay, or no leaderboard). */
  board: { name: string; status: "sending" | "sent" | "queued" | null; onName: (name: string) => void } | null;
  onBoard: () => void;
  onAgain: () => void;
  onHome: () => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const { user } = result;
  const rows = tableAfter(result, result.matchdays.length);
  const headline =
    user.badges.includes("perfect") ? `${recordText(result)}. Perfect.`
      : user.badges.includes("invincibles") ? "Invincibles!"
        : user.position === 1 ? "Champions!"
          : user.position <= 4 ? "Champions League football."
            : user.position >= rows.length - 2 ? "Relegated."
              : "A season to remember. Sort of.";

  const streakLine = !career
    ? null
    : user.position === 1
      ? career.streak >= 2
        ? `That's ${career.streak} titles in a row!`
        : career.titles === 1 ? "Your first title!" : `Title number ${career.titles}.`
      : `Your record: ${career.titles} ${career.titles === 1 ? "title" : "titles"} from ${career.seasons} ${career.seasons === 1 ? "season" : "seasons"}.`;

  const share = async () => {
    const text = `Ultimate XI: ${recordText(result)}, ${ordinal(user.position)} in ${seasonLabel(result.season)}. Can you beat it?`;
    try {
      const blob = await drawShareCard(result, formation, lineup);
      const file = new File([blob], "ultimate-xi.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url: link });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text, url: link });
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ultimate-xi.png";
      a.click();
      await navigator.clipboard?.writeText(`${text} ${link}`);
      setStatus("Image saved and link copied.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setStatus("Couldn't share. Try copying the link instead.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setStatus("Link copied.");
    } catch {
      setStatus(link);
    }
  };

  return (
    <main className="screen result">
      <p className="eyebrow">{leagueTitle(result.season)}</p>
      <h1 className="result__record">{recordText(result)}</h1>
      <p className="result__headline">{headline}</p>
      {streakLine && <p className={user.position === 1 ? "result__streak result__streak--win" : "result__streak"}>{streakLine}</p>}
      <p className="result__pos">
        Finished {ordinal(user.position)} with {user.row.points} points · {user.row.goalsFor} scored, {user.row.goalsAgainst} conceded
      </p>
      {user.badges.length > 0 && (
        <div className="badges">
          {user.badges.map((b) => <span key={b} className="badge">{BADGE_LABEL[b]}</span>)}
        </div>
      )}
      <div className="awards">
        {(() => {
          const boot = result.topScorers[0];
          const bootIsYours = !!boot && boot.team === user.team;
          const assistKing = result.topAssists[0];
          const assistKingIsYours = !!assistKing && assistKing.team === user.team;
          const teamName = (t: number) => (t === user.team ? "Your XI" : result.teams[t]!.name);
          return (
            <>
              <Award icon="⭐" label="Player of the season" name={user.playerOfSeason.name} sub="Your XI" yours />
              {boot && <Award icon="👟" label="Golden Boot" name={boot.name} sub={`${teamName(boot.team)} · ${boot.goals} goals`} yours={bootIsYours} />}
              {assistKing && (
                <Award icon="🎯" label="Most assists" name={assistKing.name} sub={`${teamName(assistKing.team)} · ${assistKing.assists} assists`} yours={assistKingIsYours} />
              )}
              {user.topScorer && !bootIsYours && (
                <Award icon="⚽" label="Your top scorer" name={user.topScorer.name} sub={`${user.topScorer.goals} goals`} yours />
              )}
              {user.topAssister && !assistKingIsYours && (
                <Award icon="🅰️" label="Your top assister" name={user.topAssister.name} sub={`${user.topAssister.assists} assists`} yours />
              )}
            </>
          );
        })()}
      </div>
      {board && <LeaderboardName {...board} onView={onBoard} />}
      <div className="result__actions">
        <button className="btn btn--primary btn--big" onClick={share}>Share result</button>
        <button className="btn btn--ghost" onClick={copy}>Copy replay link</button>
        <button className="btn btn--ghost" onClick={onAgain}>Build another XI</button>
        <button className="btn btn--ghost" onClick={onHome}>🏠 Home</button>
      </div>
      {status && <p className="hint" role="status">{status}</p>}
      <h3>Final table</h3>
      <MiniTable rows={rows} />
    </main>
  );
}

function Award({ icon, label, name, sub, yours }: { icon: string; label: string; name: string; sub: string; yours?: boolean }) {
  return (
    <div className={yours ? "award award--yours" : "award"}>
      <span className="award__icon" aria-hidden>{icon}</span>
      <span className="award__label">{label}</span>
      <span className="award__name">{name}</span>
      <span className="award__sub">{sub}</span>
    </div>
  );
}
