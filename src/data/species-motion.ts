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
  /** 遊泳域の上端（y座標。小さいほど上） */
  depthMinY: number;
  /** 遊泳域の下端（y座標。大きいほど下） */
  depthMaxY: number;
};

export const SPECIES_MOTION: Record<SpeciesId, Motion> = {
  ramuneFish: {
    speed: 0.25,
    bobAmplitude: 4,
    bobFrequency: 0.0015,
    motionType: "swim",
    mirrorsByDirection: true,
    depthMinY: 30,
    depthMaxY: 100,
  },
  strawberryJelly: {
    speed: 0.1,
    bobAmplitude: 5,
    bobFrequency: 0.001,
    motionType: "zigzag",
    mirrorsByDirection: false,
    depthMinY: 24,
    depthMaxY: 80,
  },
  taiyaki: {
    speed: 0.18,
    bobAmplitude: 3,
    bobFrequency: 0.0012,
    motionType: "swim",
    mirrorsByDirection: true,
    depthMinY: 40,
    depthMaxY: 118,
  },
  shrimp: {
    speed: 0.22,
    bobAmplitude: 2,
    bobFrequency: 0.0018,
    motionType: "swim",
    mirrorsByDirection: true,
    depthMinY: 80,
    depthMaxY: 118,
  },
  seahorse: {
    speed: 0.08,
    bobAmplitude: 3,
    bobFrequency: 0.0008,
    motionType: "swim",
    mirrorsByDirection: true,
    depthMinY: 50,
    depthMaxY: 110,
  },
  clione: {
    speed: 0.06,
    bobAmplitude: 4,
    bobFrequency: 0.0012,
    motionType: "swim",
    mirrorsByDirection: false,
    depthMinY: 24,
    depthMaxY: 60,
  },
  squid: {
    speed: 0.12,
    bobAmplitude: 6,
    bobFrequency: 0.0012,
    motionType: "zigzag",
    mirrorsByDirection: false,
    depthMinY: 30,
    depthMaxY: 90,
  },
};
