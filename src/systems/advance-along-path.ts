import { WORLD_WIDTH } from "../data/world-constants";
import { mod } from "../engine/mod";
import { torusDistance } from "../engine/torus-distance";
import type { Vec2 } from "../types";

/**
 * 線（ウェイポイント列）に沿って distance だけ進む。通り過ぎた点は消費する。
 * 曲がり角では次の点へそのまま折れるので、行き過ぎない。純粋関数（path を破壊しない）
 * @returns 残りの線と、この呼び出しで動いた量（dx, dy）
 */
export function advanceAlongPath(
  from: Vec2,
  path: readonly Vec2[],
  distance: number,
): { path: Vec2[]; dx: number; dy: number } {
  const rest = [...path];
  let { x, y } = from;
  let budget = distance;
  let dx = 0;
  let dy = 0;
  while (budget > 0 && rest.length > 0) {
    const target = rest[0];
    const tx = torusDistance(target.x, x, WORLD_WIDTH);
    const ty = target.y - y;
    const gap = Math.hypot(tx, ty);
    const ratio = gap <= budget ? 1 : budget / gap;
    x = mod(x + tx * ratio, WORLD_WIDTH);
    y += ty * ratio;
    dx += tx * ratio;
    dy += ty * ratio;
    if (ratio === 1) {
      rest.shift();
      budget -= gap;
    } else {
      budget = 0;
    }
  }
  return { path: rest, dx, dy };
}
