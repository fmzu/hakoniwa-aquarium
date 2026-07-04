import { EAT_DISTANCE, WORLD_WIDTH } from "../data/world-constants";
import { torusDistance } from "../engine/torus-distance";
import type { Vec2 } from "../types";

/** 餌が頭から EAT_DISTANCE 未満にあれば捕食成立 */
export function isBaitCaught(bait: Vec2, head: Vec2): boolean {
  const dx = torusDistance(bait.x, head.x, WORLD_WIDTH);
  return Math.hypot(dx, bait.y - head.y) < EAT_DISTANCE;
}
