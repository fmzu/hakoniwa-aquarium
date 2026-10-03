import type { SpeciesId } from "../types";

type Motion = {
  /** 1 tick あたりの x 移動量 */
  speed: number;
  /** 上下の揺れの振幅（px） */
  bobAmplitude: number;
  /** 揺れの角速度（rad/ms） */
  bobFrequency: number;
  /** "swim": sin波の等速揺れ。"zigzag": 速い推進＋ゆっくり沈降のジグザグ軌道 */
  motionType: "swim" | "zigzag";
};

export const SPECIES_MOTION: Record<SpeciesId, Motion> = {
  ramuneFish: {
    speed: 0.25,
    bobAmplitude: 4,
    bobFrequency: 0.0015,
    motionType: "swim",
  },
  strawberryJelly: {
    speed: 0.1,
    bobAmplitude: 5,
    bobFrequency: 0.001,
    motionType: "zigzag",
  },
  taiyaki: {
    speed: 0.18,
    bobAmplitude: 3,
    bobFrequency: 0.0012,
    motionType: "swim",
  },
};
