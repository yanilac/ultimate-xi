import { useEffect, useMemo, useState } from "react";
import {
  getFormation, isComplete, pick, respin, slotsFor, swap, teamChemistry, canPlay,
  type DraftState, type SeasonData,
} from "../../engine";
import { Pitch } from "../components/Pitch";
import { PlayerCard } from "../components/PlayerCard";
import { seasonLabel } from "../data";

const SPIN_MS = 900;

/** A quick reel of random club names before the real spin lands. */
function useSpinReel(state: DraftState, seasons: SeasonData[]) {
  const [reel, setReel] = useState<string | null>(null);
  useEffect(() => {
    if (!state.current) return;
    const started = Date.now();
    const tick = () => {
      const s = seasons[Math.floor(Math.random() * seasons.length)]!;
      const c = s.clubs[Math.floor(Math.random() * s.clubs.length)]!;
      setReel(`${c.name} ${seasonLabel(s.season)}`);
    };
    tick();
    const id = setInterval(() => {
      if (Date.now() - started >= SPIN_MS) {
        clearInterval(id);
        setReel(null);
      } else tick();
    }, 70);
    return () => clearInterval(id);
  }, [state.spinCount]); // eslint-disable-line react-hooks/exhaustive-deps
  return reel;
}

export function Draft({
  state,
  seasons,
  onChange,
  onPlaySeason,
  onQuit,
}: {
  state: DraftState;
  seasons: SeasonData[];
  onChange: (s: DraftState) => void;
  onPlaySeason: () => void;
  onQuit: () => void;
}) {
  const formation = getFormation(state.formation);
  const chem = useMemo(() => teamChemistry(formation, state.lineup), [formation, state.lineup]);
  const [card, setCard] = useState<string | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const reel = useSpinReel(state, seasons);
  const complete = isComplete(state);
  const round = state.lineup.filter(Boolean).length + (complete ? 0 : 1);

  useEffect(() => setCard(null), [state.spinCount]);

  const chosen = state.current?.options.find((p) => p.key === card) ?? null;
  const targets = useMemo(() => {
    if (chosen) return new Set(slotsFor(state, chosen));
    if (moving !== null) {
      const p = state.lineup[moving]!;
      return new Set(
        formation.slots.flatMap((s, i) => {
          const other = state.lineup[i];
          return i !== moving && canPlay(p, s.pos) && (!other || canPlay(other, formation.slots[moving]!.pos)) ? [i] : [];
        }),
      );
    }
    return new Set<number>();
  }, [chosen, moving, state, formation]);

  const tapSlot = (slot: number) => {
    setMessage(null);
    if (chosen) {
      if (!targets.has(slot)) {
        setMessage(state.lineup[slot] ? "That slot is taken." : `${chosen.name} can't play ${formation.slots[slot]!.pos}.`);
        return;
      }
      onChange(pick(state, chosen.key, slot, seasons));
      return;
    }
    if (moving !== null) {
      if (slot === moving) setMoving(null);
      else if (targets.has(slot)) {
        onChange(swap(state, moving, slot));
        setMoving(null);
      } else setMessage("Those two can't swap positions.");
      return;
    }
    if (state.lineup[slot]) setMoving(slot);
  };

  const spin = state.current;
  return (
    <main className="screen draft">
      <header className="topbar">
        <button className="btn btn--ghost btn--small" onClick={onQuit}>Quit</button>
        <div className="topbar__stats">
          <span><b>{Math.round(chem.teamRating || 0)}</b> rating</span>
          <span><b>{chem.teamChem}</b> chem</span>
        </div>
        <span className="topbar__round">{complete ? "XI done" : `Round ${round}/11`}</span>
      </header>

      <Pitch
        formation={formation}
        lineup={state.lineup}
        chem={chem}
        highlight={targets}
        selected={moving}
        onSlotTap={tapSlot}
      />

      <p className="hint" role="status">
        {message ??
          (complete
            ? `Tap a player, then another slot, to swap. You'll play the ${seasonLabel(state.leagueSeason)} season.`
            : chosen
              ? `Tap a highlighted slot for ${chosen.name}.`
              : moving !== null
                ? "Tap a highlighted slot to swap, or the same player to cancel."
                : "Pick a player.")}
      </p>

      {complete ? (
        <div className="draft__done">
          <button className="btn btn--primary btn--big" onClick={onPlaySeason}>
            Play the {seasonLabel(state.leagueSeason)} season
          </button>
        </div>
      ) : (
        <section className="spin">
          <div className={`spin__banner ${spin?.kind === "icon" && !reel ? "spin__banner--icon" : ""}`}>
            {reel ? (
              <span className="spin__reel">{reel}</span>
            ) : spin?.kind === "icon" ? (
              <span>Icon spin!</span>
            ) : spin ? (
              <span>
                {spin.club} <b>{seasonLabel(spin.season)}</b>
              </span>
            ) : null}
            <button
              className="btn btn--small btn--ghost"
              disabled={!!reel || state.respinsLeft === 0}
              onClick={() => onChange(respin(state, seasons))}
            >
              Re-spin ({state.respinsLeft})
            </button>
          </div>
          {!reel && spin && (
            <div className="cards">
              {spin.options.map((p) => (
                <PlayerCard
                  key={p.key}
                  player={p}
                  selected={card === p.key}
                  disabled={slotsFor(state, p).length === 0}
                  onClick={() => {
                    setMoving(null);
                    setMessage(null);
                    setCard(card === p.key ? null : p.key);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
