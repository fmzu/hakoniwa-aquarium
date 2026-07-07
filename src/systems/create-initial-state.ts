import { VISIT_INTERVAL_MS } from "../data/roster-constants";
import {
  BAIT_COUNT,
  BAIT_MAX_BASE_Y,
  BAIT_MIN_BASE_Y,
  WORLD_WIDTH,
} from "../data/world-constants";
import type { Bait, GameState } from "../types";

/** 初期状態を作る。乱数は注入（テストの決定性のため） */
export function createInitialState(random: () => number): GameState {
  const baits: Bait[] = [];
  for (let i = 0; i < BAIT_COUNT; i++) {
    const baseY =
      BAIT_MIN_BASE_Y + random() * (BAIT_MAX_BASE_Y - BAIT_MIN_BASE_Y);
    baits.push({
      x: random() * WORLD_WIDTH,
      baseY,
      y: baseY,
      dir: random() < 0.5 ? -1 : 1,
      phase: random() * 6,
    });
  }
  return {
    hero: { x: 80, y: 60, vx: 0, vy: 0, facing: -1 },
    path: [],
    baits,
    residents: [],
    flashes: [],
    satiety: 0,
    elapsedMs: 0,
    nextVisitCheckMs: VISIT_INTERVAL_MS,
  };
}
