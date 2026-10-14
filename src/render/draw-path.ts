import { VIEW_WIDTH, WORLD_WIDTH } from "../data/world-constants";
import { torusDistance } from "../engine/torus-distance";
import type { Vec2 } from "../types";

/** 描いた道のりを点線＋泡で表示する */
export function drawPath(
  ctx: CanvasRenderingContext2D,
  path: readonly Vec2[],
  camX: number,
  camY: number,
  elapsedMs: number,
): void {
  if (path.length === 0) return;

  const now = elapsedMs;

  // 点線（Bresenham）
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < path.length - 1; i++) {
    const x0 = Math.round(torusDistance(path[i].x, camX, WORLD_WIDTH));
    const y0 = Math.round(path[i].y - camY);
    const x1 = Math.round(torusDistance(path[i + 1].x, camX, WORLD_WIDTH));
    const y1 = Math.round(path[i + 1].y - camY);
    if ((x0 < -4 || x0 > VIEW_WIDTH + 4) && (x1 < -4 || x1 > VIEW_WIDTH + 4))
      continue;
    plotDottedLine(ctx, x0, y0, x1, y1);
  }

  // ウェイポイント上にたまに泡がキラッと光る
  for (let i = 0; i < path.length; i++) {
    const x = Math.round(torusDistance(path[i].x, camX, WORLD_WIDTH));
    const y = Math.round(path[i].y - camY);
    if (x < -2 || x > VIEW_WIDTH + 2) continue;
    // 各ウェイポイントに固有のハッシュ値で点滅タイミングをずらす
    const hash = (i * 127 + Math.round(path[i].x * 31)) & 0xffff;
    const cycle = (now + hash * 7) % 800;
    if (cycle < 120) {
      // 120ms間だけ光る（800ms周期）→ 約15%の時間だけ表示
      const alpha = cycle < 60 ? cycle / 60 : (120 - cycle) / 60;
      ctx.fillStyle = `rgba(255,255,255,${(0.5 + alpha * 0.5).toFixed(2)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function plotDottedLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let cx = x0;
  let cy = y0;
  let step = 0;
  for (;;) {
    if (step % 3 === 0) ctx.fillRect(cx, cy, 1, 1);
    step++;
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      cx += sx;
    }
    if (e2 <= dx) {
      err += dx;
      cy += sy;
    }
  }
}
