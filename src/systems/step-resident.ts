import { SPECIES_MOTION } from "../data/species-motion";
import { WORLD_WIDTH } from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Resident } from "../types";
import { isBirthFxActive } from "./is-birth-fx-active";
import { isZigzagRising } from "./is-zigzag-rising";
import { zigzagY } from "./zigzag-y";

/** 沈降フェーズ中の横速度の減衰率（推進フェーズの何倍か） */
const ZIGZAG_SINK_SPEED_RATIO = 0.25;

/**
 * 住民の 1 tick 更新。種ごとの速度で周回し、種ごとの振幅・周期で揺れる。
 * motionType="zigzag" の種は速い推進＋ゆっくり沈降のジグザグ軌道になる。
 * 沈降フェーズでは横移動をほぼ停止し、垂直に近い下降になる。
 * 誕生演出中は静止する（演出明けの位相は stepWorld が y=baseY に合わせて設定済み）
 */
export function stepResident(resident: Resident, elapsedMs: number): Resident {
  if (isBirthFxActive(resident.bornAtMs, elapsedMs)) return resident;
  const motion = SPECIES_MOTION[resident.species];
  const isZigzag = motion.motionType === "zigzag";
  const y = isZigzag
    ? zigzagY(
        resident.baseY,
        motion.bobAmplitude,
        motion.bobFrequency,
        resident.phase,
        elapsedMs,
      )
    : resident.baseY +
      Math.sin(elapsedMs * motion.bobFrequency + resident.phase) *
        motion.bobAmplitude;
  const speed =
    isZigzag && !isZigzagRising(motion.bobFrequency, resident.phase, elapsedMs)
      ? motion.speed * ZIGZAG_SINK_SPEED_RATIO
      : motion.speed;
  return {
    ...resident,
    x: mod(resident.x + resident.dir * speed, WORLD_WIDTH),
    y,
  };
}
