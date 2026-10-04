import type { Player, Position } from "./types";

/**
 * Positions that can stand in for each other: full-back <-> wing-back,
 * wide midfielder <-> winger on the same side, and CF <-> ST.
 */
const NEIGHBOURS: Partial<Record<Position, Position[]>> = {
  RB: ["RWB"], RWB: ["RB"],
  LB: ["LWB"], LWB: ["LB"],
  RM: ["RW"], RW: ["RM"],
  LM: ["LW"], LW: ["LM"],
  CF: ["ST"], ST: ["CF"],
};

/** Share of his rating a player of this kind brings to a slot. */
export const FIT_NATURAL = 1;
export const FIT_ALTERNATE = 0.975;

/**
 * How well a player fits a slot: 1 in his main position, 0.975 in another
 * listed position or a near neighbour of one, 0 if he can't play there.
 */
export function positionFit(player: Player, slot: Position): number {
  const [main] = player.positions;
  if (main === slot) return FIT_NATURAL;
  for (const pos of player.positions) {
    if (pos === slot || NEIGHBOURS[pos]?.includes(slot)) return FIT_ALTERNATE;
  }
  return 0;
}

export function canPlay(player: Player, slot: Position): boolean {
  return positionFit(player, slot) > 0;
}
