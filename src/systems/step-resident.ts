import { SPECIES_MOTION } from "../data/species-motion";
import { WORLD_WIDTH } from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Resident } from "../types";

/** 住民の 1 tick 更新。種ごとの速度で周回し、種ごとの振幅・周期で揺れる */
export function stepResident(resident: Resident, elapsedMs: number): Resident {
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
