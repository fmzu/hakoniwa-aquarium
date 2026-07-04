import type { SpeciesId } from "../types";

type Motion = {
  /** 1 tick あたりの x 移動量 */
  speed: number;
  /** 上下の揺れの振幅（px） */
  bobAmplitude: number;
  /** 揺れの角速度（rad/ms） */
  bobFrequency: number;
};

export const SPECIES_MOTION: Record<SpeciesId, Motion> = {
  ramuneFish: { speed: 0.25, bobAmplitude: 4, bobFrequency: 0.0015 },
  strawberryJelly: { speed: 0.1, bobAmplitude: 5, bobFrequency: 0.001 },
};
