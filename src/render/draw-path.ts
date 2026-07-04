import { VIEW_WIDTH, WORLD_WIDTH } from "../data/world-constants";
import { torusDistance } from "../engine/torus-distance";
import type { Vec2 } from "../types";

/** 描いた道のりを表示する。先頭（次の目標点）だけ大きく濃く描く */
export function drawPath(
  ctx: CanvasRenderingContext2D,
  path: readonly Vec2[],
  camX: number,
  camY: number,
): void {
  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const x = torusDistance(point.x, camX, WORLD_WIDTH);
    if (x < -2 || x > VIEW_WIDTH) continue;
    const isHead = i === 0;
    ctx.fillStyle = `rgba(255,176,198,${isHead ? 0.95 : 0.6})`;
    const size = isHead ? 2 : 1;
    ctx.fillRect(x, point.y - camY, size, size);
  }
}
