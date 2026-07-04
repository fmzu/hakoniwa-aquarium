import { STROKE_ACTIVE_MS, STROKE_CYCLE_MS } from "../data/world-constants";
import { mod } from "./mod";

/** ゲーム内経過時間から「ひと掻き中か」を返す。900ms 周期のうち先頭 360ms が掻き */
export function isStrokePhase(elapsedMs: number): boolean {
  return mod(elapsedMs, STROKE_CYCLE_MS) < STROKE_ACTIVE_MS;
}
