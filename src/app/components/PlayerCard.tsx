import type { Player } from "../../engine";

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
      {player.icon && <span className="card__meta">Icon</span>}
      <span className="card__meta">{player.nation ?? ""}</span>
      {!player.icon && (
        <span className="card__stats">
          {player.apps} apps · {player.goals} g · {player.assists} a
        </span>
      )}
    </button>
  );
}
