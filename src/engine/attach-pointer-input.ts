import type { Vec2 } from "../types";
import { screenToWorld } from "./screen-to-world";

/**
 * 線描き入力のポインタイベントを canvas に接続する。
 * サンプリング判定（4px 間隔・最大 60 点）は呼び出し側が shouldAddWaypoint で行う。
 * タップ 1 回 = 1 点の道のり（タップ誘導が下位互換として機能する）
 *
 * 入力デバイス別の挙動:
 * - マウス: 押している間、カーソル位置を常に唯一のウェイポイントとして追従させる。
 *   pointermove のたびに isStart=true を送ることで呼び出し側が path=[point] に置き換え、
 *   生き物がカーソル現在地へ向かい続ける。pointerup 後も path はクリアしないため
 *   最後の位置まで泳いで漂う（タップと同じ自然な挙動）。
 * - タッチ / ペン: 従来の線描き。pointermove で isStart=false を送り、
 *   shouldAddWaypoint が間引きながら複数ウェイポイントを蓄積する。
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
    if (!drawing) return;
    // マウスはカーソル追従: isStart=true で path=[point] に置き換え続ける
    // タッチ/ペンは線描き: isStart=false で shouldAddWaypoint がウェイポイントを蓄積
    const isMouse = event.pointerType === "mouse";
    onStroke(toWorld(event), isMouse);
  });
  canvas.addEventListener("pointerup", () => {
    drawing = false;
  });
  canvas.addEventListener("pointercancel", () => {
    drawing = false;
  });
}
