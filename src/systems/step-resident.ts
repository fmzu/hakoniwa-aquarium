import { SPECIES_MOTION } from "../data/species-motion";
import { WORLD_WIDTH } from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Resident } from "../types";
import { isBirthFxActive } from "./is-birth-fx-active";

/**
 * 住民の 1 tick 更新。種ごとの速度で周回し、種ごとの振幅・周期で揺れる。
 * 誕生演出中は静止する（演出明けの位相は stepWorld が y=baseY に合わせて設定済み）
 */
export function stepResident(resident: Resident, elapsedMs: number): Resident {
  if (isBirthFxActive(resident.bornAtMs, elapsedMs)) return resident;
  const motion = SPECIES_MOTION[resident.species];
  return {
    ...resident,
    x: mod(resident.x + resident.dir * motion.speed, WORLD_WIDTH),
    y:
      resident.baseY +
      Math.sin(elapsedMs * motion.bobFrequency + resident.phase) *
        motion.bobAmplitude,
  };
}
