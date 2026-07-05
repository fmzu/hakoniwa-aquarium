import { ringDotOffsets } from "./ring-dot-offsets";

/** 1px ドットで円環を描く。中心は整数に丸めてドットのにじみを防ぐ */
export function drawRingDots(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
): void {
  const cx = Math.round(centerX);
  const cy = Math.round(centerY);
  ctx.fillStyle = color;
  for (const dot of ringDotOffsets(radius)) {
    ctx.fillRect(cx + dot.x, cy + dot.y, 1, 1);
  }
}
