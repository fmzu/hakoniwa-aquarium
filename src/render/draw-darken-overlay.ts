import { BIRTH_FX_DARKEN_RGB } from "../data/birth-fx-constants";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../data/world-constants";

/**
 * 画面全体を均一に暗くするオーバーレイ。円形マスクは使わない
 * （円の縁がベクター描画になりドット規律違反のため）。均一処理なので解像度の混在は起きない
 */
export function drawDarkenOverlay(
  ctx: CanvasRenderingContext2D,
  alpha: number,
): void {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(${BIRTH_FX_DARKEN_RGB}, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}
