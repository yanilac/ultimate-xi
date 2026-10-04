import { FIT_NATURAL, positionFit, type Formation, type Lineup, type TeamChemistry } from "../../engine";
import { ClubBadge } from "./ClubBadge";
import { Flag } from "./Flag";
import { shortName } from "./PlayerCard";

const LINK_COLOUR = { strong: "var(--link-strong)", weak: "var(--link-weak)", none: "var(--link-none)" };

export function Pitch({
  formation,
  lineup,
  chem,
  highlight,
  selected,
  onSlotTap,
}: {
  formation: Formation;
  lineup: Lineup;
  chem: TeamChemistry;
  highlight?: Set<number>;
  selected?: number | null;
  onSlotTap?: (slot: number) => void;
}) {
  // Pitch y runs from own goal (0) to attack (100); the screen draws attack at the top.
  const top = (y: number) => 100 - y * 0.88 - 5;
  return (
    <div className="pitch">
      <div className="pitch__markings" />
      <svg className="pitch__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {formation.links.map(([a, b]) => {
          const sa = formation.slots[a]!, sb = formation.slots[b]!;
          const link = chem.slots[a]?.links.find((l) => l.slot === b);
          return (
            <line
              key={`${a}-${b}`}
              x1={sa.x} y1={top(sa.y)} x2={sb.x} y2={top(sb.y)}
              stroke={link ? LINK_COLOUR[link.strength] : "var(--link-empty)"}
              strokeWidth={link ? 3 : 1.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {formation.slots.map((slot, i) => {
        const player = lineup[i];
        const sc = chem.slots[i];
        const classes = [
          "slot",
          player ? "slot--filled" : "slot--empty",
          player?.icon && "slot--icon",
          highlight?.has(i) && "slot--target",
          selected === i && "slot--selected",
        ].filter(Boolean).join(" ");
        return (
          <button
            key={i}
            type="button"
            className={classes}
            style={{ left: `${slot.x}%`, top: `${top(slot.y)}%` }}
            onClick={() => onSlotTap?.(i)}
            aria-label={player ? `${player.name}, ${slot.pos}` : `Empty ${slot.pos}`}
          >
            {player ? (
              <>
                {player.nation && (
                  <span className="slot__flag">
                    <Flag nation={player.nation} small />
                  </span>
                )}
                {player.club && !player.icon && (
                  <span className="slot__badge">
                    <ClubBadge club={player.club} small />
                  </span>
                )}
                {(() => {
                  const effective = Math.round(sc?.effective ?? player.rating);
                  const delta = effective - player.rating;
                  return (
                    <span className="slot__rating">
                      {effective}
                      {delta !== 0 && (
                        <span
                          className={delta > 0 ? "slot__delta slot__delta--up" : "slot__delta slot__delta--down"}
                          title={`Base rating ${player.rating}`}
                        >
                          {delta > 0 ? "▲" : "▼"}
                          {Math.abs(delta)}
                        </span>
                      )}
                    </span>
                  );
                })()}
                <span className="slot__name">{shortName(player.name)}</span>
                <span className="slot__chem">
                  {positionFit(player, slot.pos) === FIT_NATURAL ? (
                    slot.pos
                  ) : (
                    <span className="slot__offpos" title={`Out of position: his main position is ${player.positions[0]}`}>
                      {slot.pos}*
                    </span>
                  )}{" "}
                  · {sc?.chem ?? 0}
                </span>
              </>
            ) : (
              <span className="slot__pos">{slot.pos}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
