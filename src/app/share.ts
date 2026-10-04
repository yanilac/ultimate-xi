import { getFormation, type Badge, type Lineup, type SeasonResult } from "../engine";
import { seasonLabel } from "./data";

export const BADGE_LABEL: Record<Badge, string> = {
  perfect: "Perfect season",
  invincibles: "Invincibles",
  champions: "Champions",
  centurions: "Centurions",
  "100-goals": "100 goals",
  "icon-winner": "Won it with an Icon",
};

export function recordText(result: SeasonResult): string {
  const r = result.user.row;
  return `${r.won}-${r.drawn}-${r.lost}`;
}

/** Draw a 1080×1350 result card for sharing. */
export async function drawShareCard(result: SeasonResult, formationName: string, lineup: Lineup): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0b2a1a");
  grad.addColorStop(1, "#06140d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const text = (s: string, x: number, y: number, size: number, colour = "#ffffff", weight = 700, align: CanvasTextAlign = "center") => {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    ctx.fillStyle = colour;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };

  text("ULTIMATE XI", W / 2, 110, 44, "#9fe3b8", 800);
  text(`${seasonLabel(result.season)} Premier League`, W / 2, 170, 34, "#cfe9d9", 500);
  text(recordText(result), W / 2, 330, 150, "#ffffff", 900);
  const pos = result.user.position;
  const suffix = ["th", "st", "nd", "rd"][(pos % 100 - 20) % 10] ?? ["th", "st", "nd", "rd"][pos % 100] ?? "th";
  text(`Finished ${pos}${suffix} · ${result.user.row.points} pts`, W / 2, 410, 44, "#e8f5ec", 600);
  const badges = result.user.badges.map((b) => BADGE_LABEL[b]).join("  ·  ");
  if (badges) text(badges, W / 2, 470, 36, "#ffd76a", 700);

  // The XI on a small pitch.
  const formation = getFormation(formationName);
  const px = 140, py = 500, pw = 800, ph = 690;
  ctx.fillStyle = "#14532d";
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 28);
  ctx.fill();
  formation.slots.forEach((slot, i) => {
    const p = lineup[i];
    if (!p) return;
    const x = px + (slot.x / 100) * pw;
    const y = py + ph - (slot.y / 100) * (ph - 60) - 70;
    ctx.fillStyle = p.icon ? "#e8c35a" : "#f4f7f5";
    ctx.beginPath();
    ctx.arc(x, y - 18, 30, 0, Math.PI * 2);
    ctx.fill();
    text(String(p.rating), x, y - 7, 28, "#0b2a1a", 800);
    const name = p.name.split(" ").slice(-1)[0]!;
    text(name.length > 12 ? `${name.slice(0, 11)}.` : name, x, y + 42, 26, "#ffffff", 600);
  });

  const top = result.user.topScorer;
  text(
    `Player of the season: ${result.user.playerOfSeason.name}`,
    W / 2, 1225, 34, "#e8f5ec", 600,
  );
  if (top) text(`Top scorer: ${top.name} (${top.goals})`, W / 2, 1280, 32, "#cfe9d9", 500);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no image"))), "image/png"));
}
