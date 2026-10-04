import type { Position } from "./types";

export interface Slot {
  pos: Position;
  /** Pitch coordinates for drawing: x 0 (left) to 100 (right), y 0 (own goal) to 100 (attack). */
  x: number;
  y: number;
}

export interface Formation {
  name: string;
  slots: Slot[];
  /** Chemistry links between slots, as pairs of slot indexes. */
  links: [number, number][];
}

/**
 * Formations are written as slot ids ("lcb") with positions and coordinates,
 * plus links between ids, then turned into index-based Formation objects.
 */
function define(
  name: string,
  slots: Record<string, [Position, number, number]>,
  links: string,
): Formation {
  const ids = Object.keys(slots);
  const index = (id: string) => {
    const i = ids.indexOf(id);
    if (i < 0) throw new Error(`${name}: unknown slot ${id}`);
    return i;
  };
  return {
    name,
    slots: ids.map((id) => {
      const [pos, x, y] = slots[id]!;
      return { pos, x, y };
    }),
    links: links
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [a, b] = pair.split("-");
        return [index(a!), index(b!)] as [number, number];
      }),
  };
}

export const FORMATIONS: Formation[] = [
  define(
    "4-3-3",
    {
      gk: ["GK", 50, 5],
      lb: ["LB", 15, 25], lcb: ["CB", 37, 20], rcb: ["CB", 63, 20], rb: ["RB", 85, 25],
      lcm: ["CM", 30, 52], cdm: ["CDM", 50, 42], rcm: ["CM", 70, 52],
      lw: ["LW", 18, 80], st: ["ST", 50, 86], rw: ["RW", 82, 80],
    },
    `gk-lcb gk-rcb lb-lcb lcb-rcb rcb-rb lcb-cdm rcb-cdm lb-lcm rb-rcm
     lcm-cdm cdm-rcm lb-lw rb-rw lcm-lw rcm-rw lcm-st rcm-st lw-st st-rw`,
  ),
  define(
    "4-4-2",
    {
      gk: ["GK", 50, 5],
      lb: ["LB", 15, 25], lcb: ["CB", 37, 20], rcb: ["CB", 63, 20], rb: ["RB", 85, 25],
      lm: ["LM", 15, 56], lcm: ["CM", 38, 50], rcm: ["CM", 62, 50], rm: ["RM", 85, 56],
      ls: ["ST", 38, 85], rs: ["ST", 62, 85],
    },
    `gk-lcb gk-rcb lb-lcb lcb-rcb rcb-rb lb-lm rb-rm lcb-lcm rcb-rcm
     lm-lcm lcm-rcm rcm-rm lm-ls lcm-ls rcm-rs rm-rs ls-rs`,
  ),
  define(
    "4-1-2-1-2",
    {
      gk: ["GK", 50, 5],
      lb: ["LB", 15, 25], lcb: ["CB", 37, 20], rcb: ["CB", 63, 20], rb: ["RB", 85, 25],
      cdm: ["CDM", 50, 38],
      lcm: ["CM", 27, 53], rcm: ["CM", 73, 53],
      cam: ["CAM", 50, 66],
      ls: ["ST", 36, 86], rs: ["ST", 64, 86],
    },
    `gk-lcb gk-rcb lb-lcb lcb-rcb rcb-rb lcb-cdm rcb-cdm lb-lcm rb-rcm
     cdm-lcm cdm-rcm lcm-cam rcm-cam lcm-ls rcm-rs cam-ls cam-rs ls-rs`,
  ),
  define(
    "4-2-4",
    {
      gk: ["GK", 50, 5],
      lb: ["LB", 15, 25], lcb: ["CB", 37, 20], rcb: ["CB", 63, 20], rb: ["RB", 85, 25],
      lcm: ["CM", 38, 48], rcm: ["CM", 62, 48],
      lw: ["LW", 15, 78], ls: ["ST", 38, 86], rs: ["ST", 62, 86], rw: ["RW", 85, 78],
    },
    `gk-lcb gk-rcb lb-lcb lcb-rcb rcb-rb lcb-lcm rcb-rcm lb-lw rb-rw
     lcm-rcm lcm-lw lcm-ls rcm-rs rcm-rw lw-ls ls-rs rs-rw`,
  ),
  define(
    "3-4-3",
    {
      gk: ["GK", 50, 5],
      lcb: ["CB", 25, 22], cb: ["CB", 50, 18], rcb: ["CB", 75, 22],
      lm: ["LM", 12, 54], lcm: ["CM", 38, 48], rcm: ["CM", 62, 48], rm: ["RM", 88, 54],
      lw: ["LW", 20, 80], st: ["ST", 50, 86], rw: ["RW", 80, 80],
    },
    `gk-lcb gk-cb gk-rcb lcb-cb cb-rcb lcb-lm lcb-lcm cb-lcm cb-rcm rcb-rcm rcb-rm
     lm-lcm lcm-rcm rcm-rm lm-lw lcm-lw lcm-st rcm-st rcm-rw rm-rw lw-st st-rw`,
  ),
  define(
    "3-5-2",
    {
      gk: ["GK", 50, 5],
      lcb: ["CB", 25, 22], cb: ["CB", 50, 18], rcb: ["CB", 75, 22],
      lwb: ["LWB", 10, 48], ldm: ["CDM", 36, 42], cam: ["CAM", 50, 62], rdm: ["CDM", 64, 42], rwb: ["RWB", 90, 48],
      ls: ["ST", 38, 86], rs: ["ST", 62, 86],
    },
    `gk-lcb gk-cb gk-rcb lcb-cb cb-rcb lcb-lwb rcb-rwb lcb-ldm cb-ldm cb-rdm rcb-rdm
     lwb-ldm ldm-cam cam-rdm rdm-rwb lwb-ls cam-ls cam-rs rwb-rs ls-rs`,
  ),
  define(
    "5-3-2",
    {
      gk: ["GK", 50, 5],
      lwb: ["LWB", 10, 32], lcb: ["CB", 30, 20], cb: ["CB", 50, 17], rcb: ["CB", 70, 20], rwb: ["RWB", 90, 32],
      lcm: ["CM", 30, 52], cdm: ["CDM", 50, 45], rcm: ["CM", 70, 52],
      ls: ["ST", 38, 86], rs: ["ST", 62, 86],
    },
    `gk-lcb gk-cb gk-rcb lwb-lcb lcb-cb cb-rcb rcb-rwb lwb-lcm rwb-rcm lcb-lcm cb-cdm rcb-rcm
     lcm-cdm cdm-rcm lcm-ls cdm-ls cdm-rs rcm-rs ls-rs`,
  ),
  define(
    "5-4-1",
    {
      gk: ["GK", 50, 5],
      lwb: ["LWB", 10, 32], lcb: ["CB", 30, 20], cb: ["CB", 50, 17], rcb: ["CB", 70, 20], rwb: ["RWB", 90, 32],
      lm: ["LM", 15, 60], lcm: ["CM", 38, 52], rcm: ["CM", 62, 52], rm: ["RM", 85, 60],
      st: ["ST", 50, 86],
    },
    `gk-lcb gk-cb gk-rcb lwb-lcb lcb-cb cb-rcb rcb-rwb lwb-lm rwb-rm lcb-lcm cb-lcm cb-rcm rcb-rcm
     lm-lcm lcm-rcm rcm-rm lm-st lcm-st rcm-st rm-st`,
  ),
];

export function getFormation(name: string): Formation {
  const f = FORMATIONS.find((x) => x.name === name);
  if (!f) throw new Error(`unknown formation ${name}`);
  return f;
}

/** Slot indexes linked to the given slot. */
export function linkedSlots(formation: Formation, slot: number): number[] {
  return formation.links.flatMap(([a, b]) => (a === slot ? [b] : b === slot ? [a] : []));
}
