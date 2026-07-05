import {
  SAND_TOP_Y,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
} from "../data/world-constants";
import { depthColor } from "./depth-color";

/** 深度グラデーション（3 色 lerp）と海底の砂を描く。camY でスクロールする */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  camY: number,
): void {
  const gradient = ctx.createLinearGradient(0, -camY, 0, WORLD_HEIGHT - camY);
  gradient.addColorStop(0, depthColor(0));
  gradient.addColorStop(0.5, depthColor(WORLD_HEIGHT / 2));
  gradient.addColorStop(1, depthColor(WORLD_HEIGHT));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // 砂の上端を整数に丸めてサブピクセルのにじみを防ぐ
  const sandTop = Math.round(SAND_TOP_Y - camY);
  ctx.fillStyle = "#EAD9AE";
  ctx.fillRect(0, sandTop, VIEW_WIDTH, WORLD_HEIGHT - SAND_TOP_Y + 2);
  ctx.fillStyle = "#D6BF8E";
  ctx.fillRect(0, sandTop, VIEW_WIDTH, 1);
}
