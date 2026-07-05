import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";

/** 誕生演出中か。演出中は住民が静止し、描画は draw-birth-fx が担当する */
export function isBirthFxActive(bornAtMs: number, elapsedMs: number): boolean {
  return elapsedMs - bornAtMs < BIRTH_FX_TOTAL_MS;
}
