import { useState } from "react";
import { readName, saveName } from "../leaderboard";

/** Name box and button to put a finished season on the shared leaderboard. */
export function SubmitScore({ onSubmit, onView }: { onSubmit: (name: string) => Promise<boolean>; onView: () => void }) {
  const [name, setName] = useState(readName);
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");

  const send = async () => {
    const clean = name.trim().slice(0, 16);
    if (!clean) return;
    saveName(clean);
    setState("sending");
    try {
      setState((await onSubmit(clean)) ? "done" : "failed");
    } catch {
      setState("failed");
    }
  };

  if (state === "done") {
    return (
      <div className="submit">
        <p className="submit__done">On the leaderboard as {name.trim()}.</p>
        <button className="btn btn--ghost" onClick={onView}>View leaderboard</button>
      </div>
    );
  }
  return (
    <form className="submit" onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <label className="submit__label" htmlFor="lb-name">Add this season to the leaderboard</label>
      <div className="submit__row">
        <input
          id="lb-name"
          className="submit__input"
          value={name}
          maxLength={16}
          placeholder="Your name"
          autoComplete="nickname"
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn--primary" type="submit" disabled={!name.trim() || state === "sending"}>
          {state === "sending" ? "Adding…" : "Add"}
        </button>
      </div>
      {state === "failed" && <p className="hint">Couldn't add it. Check your connection and try again.</p>}
    </form>
  );
}
