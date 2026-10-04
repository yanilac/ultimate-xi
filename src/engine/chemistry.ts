import { seasonStart } from "./data";
import { type Formation, linkedSlots } from "./formations";
import { FIT_NATURAL, positionFit } from "./positions";
import type { Player } from "./types";

export type LinkStrength = "strong" | "weak" | "none";

/** Seasons no more than this many years apart count as the same era. */
export const ERA_YEARS = 4;

/**
 * Strong: same club (any season), or same nation and same era.
 * Weak: same nation, or same era.
 * In the Top 5 mode every card is from the same season, so the league plays the
 * part of the era: strong for same nation and same league, weak for same league.
 * Icons link weakly to everyone and strongly to their own nation.
 */
export function linkStrength(a: Player, b: Player): LinkStrength {
  const sameNation = a.nation !== null && a.nation === b.nation;
  if (a.icon || b.icon) return sameNation ? "strong" : "weak";
  const sameClub = a.club !== null && a.club === b.club;
  const sameGroup =
    a.league !== null && b.league !== null
      ? a.league === b.league
      : a.season !== null && b.season !== null &&
        Math.abs(seasonStart(a.season) - seasonStart(b.season)) <= ERA_YEARS;
  if (sameClub || (sameNation && sameGroup)) return "strong";
  if (sameNation || sameGroup) return "weak";
  return "none";
}

const LINK_VALUE: Record<LinkStrength, number> = { strong: 1, weak: 0.5, none: 0 };

/** Chemistry from links, 0 to 8, plus 2 for playing his main position. */
export const LINK_CHEM_MAX = 8;
export const POSITION_CHEM = 2;
/** Rating change per chemistry point away from CHEM_NEUTRAL: -2 at 0 chem, +6 at 10. */
export const CHEM_RATING_PER_POINT = 0.8;
export const CHEM_NEUTRAL = 2.5;

/** The XI being built: one entry per formation slot, null while empty. */
export type Lineup = (Player | null)[];

export interface SlotChemistry {
  chem: number;
  /** Rating after position fit and chemistry. */
  effective: number;
  links: { slot: number; strength: LinkStrength }[];
}

export interface TeamChemistry {
  slots: (SlotChemistry | null)[];
  /** 0 to 100. */
  teamChem: number;
  /** Average effective rating of the filled slots. */
  teamRating: number;
}

export function slotChemistry(formation: Formation, lineup: Lineup, slot: number): SlotChemistry | null {
  const player = lineup[slot];
  if (!player) return null;
  const links = linkedSlots(formation, slot).flatMap((other) => {
    const mate = lineup[other];
    return mate ? [{ slot: other, strength: linkStrength(player, mate) }] : [];
  });
  // Empty neighbours count as no link, so chemistry builds up as the XI fills.
  const total = linkedSlots(formation, slot).length;
  const linkScore = total === 0 ? 0 : links.reduce((sum, l) => sum + LINK_VALUE[l.strength], 0) / total;
  const fit = positionFit(player, formation.slots[slot]!.pos);
  const chem = Math.round(linkScore * LINK_CHEM_MAX) + (fit === FIT_NATURAL ? POSITION_CHEM : 0);
  const effective = player.rating * fit + (chem - CHEM_NEUTRAL) * CHEM_RATING_PER_POINT;
  return { chem, effective, links };
}

export function teamChemistry(formation: Formation, lineup: Lineup): TeamChemistry {
  const slots = formation.slots.map((_, i) => slotChemistry(formation, lineup, i));
  const filled = slots.filter((s): s is SlotChemistry => s !== null);
  const maxChem = formation.slots.length * (LINK_CHEM_MAX + POSITION_CHEM);
  return {
    slots,
    teamChem: Math.round((filled.reduce((sum, s) => sum + s.chem, 0) / maxChem) * 100),
    teamRating: filled.length ? filled.reduce((sum, s) => sum + s.effective, 0) / filled.length : 0,
  };
}
