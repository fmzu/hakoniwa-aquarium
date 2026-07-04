import { WORLD_WIDTH } from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Bait } from "../types";

/** 食べられた餌を主人公の反対側（torus の対蹠点）に置き直す */
export function respawnBait(bait: Bait, heroX: number, newBaseY: number): Bait {
  return {
    ...bait,
    x: mod(heroX + WORLD_WIDTH / 2, WORLD_WIDTH),
    baseY: newBaseY,
  };
}
