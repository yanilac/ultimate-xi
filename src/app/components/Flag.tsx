import { flagUrl } from "../flags";

export function Flag({ nation, small }: { nation: string | null; small?: boolean }) {
  const url = flagUrl(nation);
  if (!url) return null;
  return (
    <img
      className={small ? "flag flag--small" : "flag"}
      src={url}
      alt={nation ?? ""}
      title={nation ?? ""}
      loading="lazy"
      decoding="async"
    />
  );
}
