import { WORLD_WIDTH } from "../data/world-constants";
import { torusDistance } from "../engine/torus-distance";
import type { Vec2 } from "../types";

/**
 * 現在地から線の終点までの道のり（torus）。減速判定に使うので、limit を超えた時点で打ち切る。
 * 純粋関数
 * @param limit - これを超えたら数えるのをやめる（戻り値は limit 以上の何か）
 */
export function pathLengthAhead(
  from: Vec2,
  path: readonly Vec2[],
  limit: number,
): number {
  let length = 0;
  let prev = from;
  for (const point of path) {
    length += Math.hypot(
      torusDistance(point.x, prev.x, WORLD_WIDTH),
      point.y - prev.y,
    );
    if (length >= limit) return length;
    prev = point;
  }
  return length;
}
