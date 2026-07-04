import {
  INPUT_MAX_Y,
  INPUT_MIN_Y,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_WIDTH,
} from "../data/world-constants";
import type { Vec2 } from "../types";
import { clamp } from "./clamp";
import { mod } from "./mod";

type Rect = { left: number; top: number; width: number; height: number };

/** ポインタのクライアント座標をワールド座標に変換する（CSS 拡大率を打ち消す） */
export function screenToWorld(
  clientX: number,
  clientY: number,
  canvasRect: Rect,
  camX: number,
  camY: number,
): Vec2 {
  const screenX = ((clientX - canvasRect.left) * VIEW_WIDTH) / canvasRect.width;
  const screenY =
    ((clientY - canvasRect.top) * VIEW_HEIGHT) / canvasRect.height;
  return {
    x: mod(camX + screenX, WORLD_WIDTH),
    y: clamp(camY + screenY, INPUT_MIN_Y, INPUT_MAX_Y),
  };
}
