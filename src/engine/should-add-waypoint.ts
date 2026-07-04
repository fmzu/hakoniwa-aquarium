import {
  MAX_WAYPOINTS,
  WAYPOINT_SPACING,
  WORLD_WIDTH,
} from "../data/world-constants";
import type { Vec2 } from "../types";
import { torusDistance } from "./torus-distance";

/** 線描き入力のサンプリング判定。4px 間隔・最大 60 点 */
export function shouldAddWaypoint(path: readonly Vec2[], point: Vec2): boolean {
  if (path.length >= MAX_WAYPOINTS) return false;
  const last = path[path.length - 1];
  if (!last) return true;
  const dx = torusDistance(point.x, last.x, WORLD_WIDTH);
  return Math.hypot(dx, point.y - last.y) > WAYPOINT_SPACING;
}
