import {
  FACING_FLIP_SPEED,
  HERO_ARRIVE_DISTANCE,
  HERO_ARRIVE_MIN_RATIO,
  HERO_MAX_Y,
  HERO_MIN_Y,
  HERO_SPEED_EASE,
  HERO_SPEED_GLIDE,
  HERO_SPEED_STROKE,
  WORLD_WIDTH,
} from "../data/world-constants";
import { clamp } from "../engine/clamp";
import { mod } from "../engine/mod";
import type { Hero, Vec2 } from "../types";
import { advanceAlongPath } from "./advance-along-path";
import { pathLengthAhead } from "./path-length-ahead";

/**
 * 主人公の 1 tick 更新。描いた線の上をそのまま進む。
 * 速さ: 目標（掻き/滑空。線の終わりでは減速）へ HERO_SPEED_EASE ずつ寄せる。
 * 線を使い切ったら終点で止まる（水流で流されない）。
 * vx / vy はこの tick に実際に動いた量（px/tick）。向きは vx の符号で決める。
 * 純粋関数: 引数を破壊せず、新しい hero と path を返す
 */
export function stepHero(
  hero: Hero,
  path: readonly Vec2[],
  isStroke: boolean,
): { hero: Hero; path: Vec2[] } {
  const speed = Math.hypot(hero.vx, hero.vy);
  let target = 0;
  if (path.length > 0) {
    const ahead = pathLengthAhead(hero, path, HERO_ARRIVE_DISTANCE);
    const arrive = Math.max(
      HERO_ARRIVE_MIN_RATIO,
      Math.min(1, ahead / HERO_ARRIVE_DISTANCE),
    );
    target = (isStroke ? HERO_SPEED_STROKE : HERO_SPEED_GLIDE) * arrive;
  }
  const nextSpeed = speed + (target - speed) * HERO_SPEED_EASE;

  // 線を使い切ったらその場で止まる（終点を行き過ぎない）
  const moved = advanceAlongPath(hero, path, nextSpeed);
  const vx = moved.dx;
  const vy = moved.dy;
  const nextPath = moved.path;

  const x = mod(hero.x + vx, WORLD_WIDTH);
  const y = clamp(hero.y + vy, HERO_MIN_Y, HERO_MAX_Y);
  let facing = hero.facing;
  if (vx < -FACING_FLIP_SPEED) facing = -1;
  else if (vx > FACING_FLIP_SPEED) facing = 1;
  return { hero: { x, y, vx, vy, facing }, path: nextPath };
}
