import type { Player } from "../../engine";
import { ClubBadge } from "./ClubBadge";

export function shortName(name: string): string {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}

export function PlayerCard({
  player,
  selected,
  disabled,
  onClick,
}: {
  player: Player;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const classes = ["card", player.icon && "card--icon", selected && "card--selected", disabled && "card--disabled"]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} onClick={onClick} disabled={disabled} type="button">
      <span className="card__rating">{player.rating}</span>
      <span className="card__pos">{player.positions.join(" · ")}</span>
      <span className="card__name">{player.name}</span>
      <span className="card__club">
        {player.icon || !player.club ? (
          "Icon"
        ) : (
          <>
            <ClubBadge club={player.club} />
            <span className="card__clubname">
              {!player.league && <b>{player.season?.replace("-", "/")} </b>}
              {player.club}
            </span>
          </>
        )}
      </span>
      <span className="card__meta">{[player.nation, player.league].filter(Boolean).join(" · ")}</span>
      {/* Top 5 cards are this season's ratings, so there are no season stats to show yet. */}
      {!player.icon && !player.league && (
        <span className="card__stats">
          {player.apps} apps · {player.goals} g · {player.assists} a
        </span>
      )}
    </button>
  );
}
