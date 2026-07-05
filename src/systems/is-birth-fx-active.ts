import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";

/**
 * 誕生演出中か。演出中は住民が静止し、描画は draw-birth-fx が担当する。
 * 有効窓は 0 <= 経過 < BIRTH_FX_TOTAL_MS（birthFxPhase の INACTIVE と同じ窓）
 */
export function isBirthFxActive(bornAtMs: number, elapsedMs: number): boolean {
  const age = elapsedMs - bornAtMs;
  return age >= 0 && age < BIRTH_FX_TOTAL_MS;
}
