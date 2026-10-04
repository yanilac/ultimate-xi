/** Small seeded random number generator, so a run can be replayed from its seed. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** Pick one item with probability proportional to its weight. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
  /** Poisson-distributed integer with mean lambda. */
  poisson(lambda: number): number;
}

export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: string | number): Rng {
  let state = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
  // mulberry32
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number) => Math.floor(next() * n);
  return {
    next,
    int,
    pick(items) {
      if (items.length === 0) throw new Error("pick from empty list");
      return items[int(items.length)]!;
    },
    shuffle(items) {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    weighted(items, weight) {
      const weights = items.map(weight);
      const total = weights.reduce((a, b) => a + b, 0);
      if (items.length === 0 || total <= 0) throw new Error("weighted pick with no weight");
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i]!;
        if (r < 0) return items[i]!;
      }
      return items[items.length - 1]!;
    },
    poisson(lambda) {
      const limit = Math.exp(-lambda);
      let k = 0;
      let p = next();
      while (p > limit) {
        k++;
        p *= next();
      }
      return k;
    },
  };
}
