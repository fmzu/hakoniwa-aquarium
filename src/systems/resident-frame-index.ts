import { RESIDENT_SPRITES } from "../data/resident-sprites";
import { SPECIES_MOTION } from "../data/species-motion";
import { mod } from "../engine/mod";
import type { Resident } from "../types";
import { isZigzagRising } from "./is-zigzag-rising";

/**
 * 住民のいまのコマ番号（0 or 1）を返す。
 * - "zigzag": 推進フェーズ=1、沈降フェーズ=0
 * - "inch": 個体ごとの位相でずらした 2 コマ交互（全員が同時にのびちぢみしないように）
 * - "swim": 全員共通の 2 コマ交互
 * frameIntervalMs === 0（1 フレームのスプライト）は mod(x, 0) = NaN になるため常に 0
 */
export function residentFrameIndex(
  resident: Pick<Resident, "species" | "phase">,
  elapsedMs: number,
): 0 | 1 {
  const motion = SPECIES_MOTION[resident.species];
  if (motion.motionType === "zigzag") {
    return isZigzagRising(motion.bobFrequency, resident.phase, elapsedMs)
      ? 1
      : 0;
  }
  const interval = RESIDENT_SPRITES[resident.species].frameIntervalMs;
  if (interval === 0) return 0;
  const offset =
    motion.motionType === "inch"
      ? (resident.phase / (2 * Math.PI)) * interval * 2
      : 0;
  return mod(elapsedMs + offset, interval * 2) < interval ? 0 : 1;
}
