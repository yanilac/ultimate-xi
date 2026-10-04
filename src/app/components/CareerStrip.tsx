import type { Career } from "../career";

/** A slim bar on every screen with your titles, current streak and seasons played. */
export function CareerStrip({ career }: { career: Career }) {
  return (
    <div className="career-strip" aria-label="Your record">
      <span className="career-strip__item">
        <span className="career-strip__trophy" aria-hidden>🏆</span>
        <b>{career.titles}</b> {career.titles === 1 ? "title" : "titles"}
      </span>
      <span className={career.streak > 0 ? "career-strip__item career-strip__item--hot" : "career-strip__item"}>
        <b>{career.streak}</b> in a row
        {career.bestStreak > 0 && <span className="career-strip__best"> (best {career.bestStreak})</span>}
      </span>
      <span className="career-strip__item">
        <b>{career.seasons}</b> {career.seasons === 1 ? "season" : "seasons"}
      </span>
    </div>
  );
}
