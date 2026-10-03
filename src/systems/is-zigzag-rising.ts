import { mod } from "../engine/mod";

/** 推進フェーズ（速い上昇）の占める割合。残りが沈降フェーズ（ゆっくり下降） */
export const ZIGZAG_RISE_PHASE_RATIO = 0.35;

/** elapsedMs 時点でジグザグ軌道が推進フェーズ（上昇中）かどうかを判定する */
export function isZigzagRising(
  frequency: number,
  phase: number,
  elapsedMs: number,
): boolean {
  const t = mod(elapsedMs * frequency + phase, 2 * Math.PI) / (2 * Math.PI);
  return t < ZIGZAG_RISE_PHASE_RATIO;
}
