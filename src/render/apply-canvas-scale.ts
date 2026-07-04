import { VIEW_HEIGHT, VIEW_WIDTH } from "../data/world-constants";
import { computeCanvasScale } from "./compute-canvas-scale";

/** ウィンドウサイズに合わせて canvas の CSS サイズを整数倍に更新する（リサイズ対応） */
export function applyCanvasScale(
  canvas: HTMLCanvasElement,
  availableWidth: number,
  availableHeight: number,
): void {
  const scale = computeCanvasScale(availableWidth, availableHeight);
  canvas.style.width = `${VIEW_WIDTH * scale}px`;
  canvas.style.height = `${VIEW_HEIGHT * scale}px`;
}
