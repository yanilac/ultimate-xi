import { useState } from "react";

/**
 * On the result screen: asks for a name the first time, then just says the
 * season went on the leaderboard, with a way to change the name.
 */
export function LeaderboardName({
  name,
  status,
  onName,
  onView,
}: {
  /** Saved name, or "" if never asked. */
  name: string;
  status: "sending" | "sent" | "queued" | null;
  onName: (name: string) => void;
  onView: () => void;
}) {
  const [editing, setEditing] = useState(!name);
  const [draft, setDraft] = useState(name);

  if (editing) {
    const save = () => {
      const clean = draft.trim().slice(0, 16);
      if (!clean) return;
      setEditing(false);
      onName(clean);
    };
    return (
      <form className="submit" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="submit__label" htmlFor="lb-name">
          {name ? "Change your leaderboard name" : "Your name for the leaderboard"}
        </label>
        <div className="submit__row">
          <input
            id="lb-name"
            className="submit__input"
            value={draft}
            maxLength={16}
            placeholder="Your name"
            autoComplete="nickname"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn--primary" type="submit" disabled={!draft.trim()}>Save</button>
        </div>
        {!name && <p className="hint">You only need to do this once. Every season after this goes on automatically.</p>}
      </form>
    );
  }

  return (
    <div className="submit submit--done">
      <p className="submit__done">
        {status === "queued"
          ? `Couldn't reach the leaderboard. This season will be added next time, as ${name}.`
          : status === "sending"
            ? `Adding to the leaderboard as ${name}…`
            : `On the leaderboard as ${name}.`}
      </p>
      <div className="submit__row">
        <button className="btn btn--ghost btn--small" onClick={onView}>View leaderboard</button>
        <button className="btn btn--ghost btn--small" onClick={() => setEditing(true)}>Change name</button>
      </div>
    </div>
  );
}
