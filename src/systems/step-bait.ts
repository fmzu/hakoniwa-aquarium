import {
  BAIT_BOB_AMPLITUDE,
  BAIT_BOB_FREQUENCY,
  BAIT_SPEED,
  WORLD_WIDTH,
} from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Bait } from "../types";

/** 餌の 1 tick 更新。一定方向に周回し、baseY を中心に正弦波で揺れる */
export function stepBait(bait: Bait, elapsedMs: number): Bait {
  return {
    ...bait,
    x: mod(bait.x + bait.dir * BAIT_SPEED, WORLD_WIDTH),
    y:
      bait.baseY +
      Math.sin(elapsedMs * BAIT_BOB_FREQUENCY + bait.phase) *
        BAIT_BOB_AMPLITUDE,
  };
}
