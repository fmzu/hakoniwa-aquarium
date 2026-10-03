import { mod } from "../engine/mod";
import { ZIGZAG_RISE_PHASE_RATIO } from "./is-zigzag-rising";

/**
 * ゲッソー風ジグザグ軌道の y 座標を計算する。
 * 1 サイクルの前半（推進フェーズ）で素早く baseY - amplitude まで上昇し、
 * 後半（沈降フェーズ）でゆっくり baseY まで下降する。
 */
export function zigzagY(
  baseY: number,
  amplitude: number,
  frequency: number,
  phase: number,
  elapsedMs: number,
): number {
  const t = mod(elapsedMs * frequency + phase, 2 * Math.PI) / (2 * Math.PI);
  if (t < ZIGZAG_RISE_PHASE_RATIO) {
    return baseY - amplitude * (t / ZIGZAG_RISE_PHASE_RATIO);
  }
  return (
    baseY -
    amplitude *
      (1 - (t - ZIGZAG_RISE_PHASE_RATIO) / (1 - ZIGZAG_RISE_PHASE_RATIO))
  );
}
