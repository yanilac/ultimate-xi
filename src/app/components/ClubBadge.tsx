import { clubColours } from "../clubs";

export function ClubBadge({ club, small }: { club: string; small?: boolean }) {
  const c = clubColours(club);
  return (
    <span
      className={small ? "badge-club badge-club--small" : "badge-club"}
      style={{ background: c.bg, color: c.fg }}
      title={club}
      aria-label={club}
    >
      {c.code}
    </span>
  );
}
