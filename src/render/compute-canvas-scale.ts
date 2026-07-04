import { VIEW_HEIGHT, VIEW_WIDTH } from "../data/world-constants";

/** 利用可能な領域に収まる最大の整数倍率（最低 1）。ドットの正方形を保つ */
export function computeCanvasScale(
  availableWidth: number,
  availableHeight: number,
): number {
  const scale = Math.floor(
    Math.min(availableWidth / VIEW_WIDTH, availableHeight / VIEW_HEIGHT),
  );
  return Math.max(1, scale);
}
