import { clamp } from "../engine/clamp";

/**
 * 染まり進行度（0〜1）→ 染まり境界列（スプライト座標）。
 * 列 < 戻り値: フレーバー色 / 列 === 戻り値（width 未満のとき）: 白境界 / それ以降: シルエット。
 * 原画は列 0 が頭側なので「頭から尾へ」染まる。progress×(width+1) で 0〜width を等分する
 */
export function dyeBoundaryColumn(progress: number, width: number): number {
  return clamp(Math.floor(progress * (width + 1)), 0, width);
}
