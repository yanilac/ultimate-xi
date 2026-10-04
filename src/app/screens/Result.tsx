import { useState } from "react";
import type { Lineup, SeasonResult } from "../../engine";
import { seasonLabel } from "../data";
import { BADGE_LABEL, drawShareCard, recordText } from "../share";
import { ordinal } from "./Home";
import { MiniTable, tableAfter } from "./Season";

export function Result({
  result,
  formation,
  lineup,
  link,
  onAgain,
}: {
  result: SeasonResult;
  formation: string;
  lineup: Lineup;
  link: string;
  onAgain: () => void;
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
      <p className="eyebrow">{seasonLabel(result.season)} Premier League</p>
      <h1 className="result__record">{recordText(result)}</h1>
      <p className="result__headline">{headline}</p>
      <p className="result__pos">
        Finished {ordinal(user.position)} with {user.row.points} points · {user.row.goalsFor} scored, {user.row.goalsAgainst} conceded
      </p>
      {user.badges.length > 0 && (
        <div className="badges">
          {user.badges.map((b) => <span key={b} className="badge">{BADGE_LABEL[b]}</span>)}
        </div>
      )}
      <dl className="awards">
        <div><dt>Player of the season</dt><dd>{user.playerOfSeason.name}</dd></div>
        {(() => {
          const boot = result.topScorers[0];
          const bootIsYours = boot && boot.team === user.team;
          return (
            <>
              {boot && (
                <div>
                  <dt>Golden Boot (league top scorer)</dt>
                  <dd>
                    {boot.name}, {bootIsYours ? "your XI" : result.teams[boot.team]!.name} ({boot.goals})
                  </dd>
                </div>
              )}
              {user.topScorer && !bootIsYours && (
                <div><dt>Your XI's top scorer</dt><dd>{user.topScorer.name} ({user.topScorer.goals})</dd></div>
              )}
            </>
          );
        })()}
      </dl>
      <div className="result__actions">
        <button className="btn btn--primary btn--big" onClick={share}>Share result</button>
        <button className="btn btn--ghost" onClick={copy}>Copy replay link</button>
        <button className="btn btn--ghost" onClick={onAgain}>Build another XI</button>
      </div>
      {status && <p className="hint" role="status">{status}</p>}
      <h3>Final table</h3>
      <MiniTable rows={rows} />
    </main>
  );
}
