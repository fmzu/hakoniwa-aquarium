import {
  BASE_THRUST,
  CURRENT_VX,
  DRAG,
  FACING_FLIP_SPEED,
  HERO_MAX_Y,
  HERO_MIN_Y,
  STROKE_THRUST,
  WAYPOINT_REACH,
  WORLD_WIDTH,
} from "../data/world-constants";
import { clamp } from "../engine/clamp";
import { mod } from "../engine/mod";
import { torusDistance } from "../engine/torus-distance";
import type { Hero, Vec2 } from "../types";

/**
 * 主人公の 1 tick 更新。ウェイポイント追従（推進）→ 水流 → 抗力 → 移動 → 向き。
 * 純粋関数: 引数を破壊せず、新しい hero と path を返す
 */
export function stepHero(
  hero: Hero,
  path: readonly Vec2[],
  isStroke: boolean,
): { hero: Hero; path: Vec2[] } {
  let { x, y, vx, vy, facing } = hero;
  const nextPath = [...path];
  const target = nextPath[0];
  if (target) {
    const dx = torusDistance(target.x, x, WORLD_WIDTH);
    const dy = target.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance < WAYPOINT_REACH) {
      nextPath.shift();
    } else {
      const thrust = BASE_THRUST + (isStroke ? STROKE_THRUST : 0);
      vx += (dx / distance) * thrust;
      vy += (dy / distance) * thrust;
    }
  }
  vx += CURRENT_VX;
  vx *= DRAG;
  vy *= DRAG;
  x = mod(x + vx, WORLD_WIDTH);
  y = clamp(y + vy, HERO_MIN_Y, HERO_MAX_Y);
  if (vx < -FACING_FLIP_SPEED) facing = -1;
  else if (vx > FACING_FLIP_SPEED) facing = 1;
  return { hero: { x, y, vx, vy, facing }, path: nextPath };
}
