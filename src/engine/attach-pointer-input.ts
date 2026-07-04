import type { Vec2 } from "../types";
import { screenToWorld } from "./screen-to-world";

/**
 * 線描き入力のポインタイベントを canvas に接続する。
 * サンプリング判定（4px 間隔・最大 60 点）は呼び出し側が shouldAddWaypoint で行う。
 * タップ 1 回 = 1 点の道のり（タップ誘導が下位互換として機能する）
 */
export function attachPointerInput(
  canvas: HTMLCanvasElement,
  getCamera: () => { camX: number; camY: number },
  onStroke: (point: Vec2, isStart: boolean) => void,
): void {
  let drawing = false;
  const toWorld = (event: PointerEvent): Vec2 => {
    const { camX, camY } = getCamera();
    return screenToWorld(
      event.clientX,
      event.clientY,
      canvas.getBoundingClientRect(),
      camX,
      camY,
    );
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    event.preventDefault();
    // capture により canvas 外へドラッグしても move/up を canvas で受け続けられる
    canvas.setPointerCapture(event.pointerId);
    drawing = true;
    onStroke(toWorld(event), true);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!event.isPrimary) return;
    if (drawing) onStroke(toWorld(event), false);
  });
  canvas.addEventListener("pointerup", () => {
    drawing = false;
  });
  canvas.addEventListener("pointercancel", () => {
    drawing = false;
  });
}
