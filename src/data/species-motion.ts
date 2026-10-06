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
  /** true: 進行方向で左右鏡像反転して描く。左右対称（反転するとハイライトが入れ替わる）なら false */
  mirrorsByDirection: boolean;
};

export const SPECIES_MOTION: Record<SpeciesId, Motion> = {
  ramuneFish: {
    speed: 0.25,
    bobAmplitude: 4,
    bobFrequency: 0.0015,
    motionType: "swim",
    mirrorsByDirection: true,
  },
  strawberryJelly: {
    speed: 0.1,
    bobAmplitude: 5,
    bobFrequency: 0.001,
    motionType: "zigzag",
    mirrorsByDirection: false,
  },
  taiyaki: {
    speed: 0.18,
    bobAmplitude: 3,
    bobFrequency: 0.0012,
    motionType: "swim",
    mirrorsByDirection: true,
  },
  shrimp: {
    speed: 0.22,
    bobAmplitude: 2,
    bobFrequency: 0.0018,
    motionType: "swim",
    mirrorsByDirection: true,
  },
  seahorse: {
    speed: 0.08,
    bobAmplitude: 3,
    bobFrequency: 0.0008,
    motionType: "swim",
    mirrorsByDirection: true,
  },
  clione: {
    speed: 0.06,
    bobAmplitude: 4,
    bobFrequency: 0.0012,
    motionType: "swim",
    mirrorsByDirection: false,
  },
  squid: {
    speed: 0.12,
    bobAmplitude: 6,
    bobFrequency: 0.0012,
    motionType: "zigzag",
    mirrorsByDirection: false,
  },
};
