import type { Sprite } from "../types";

/**
 * UI用アイコン（世界内スプライトではなく chrome 側）。
 * とじた本＋しおり。図鑑ボタンに描く。アニメなしの 1 フレーム
 */
export const zukanIcon: Sprite = {
  width: 12,
  height: 11,
  frames: [
    [
      ".EEEEEEEEEE.",
      ".ESCCCBCCCE.",
      ".ESCCCBCCCE.",
      ".ESCCCBCCCE.",
      ".ESCCCBBCCE.",
      ".ESCCCCCCCE.",
      ".ESCCCCCCCE.",
      ".ESCCCCCCCE.",
      ".ESCCCCCCCE.",
      ".EPPPPPPPPE.",
      ".EEEEEEEEEE.",
    ],
  ],
  palette: {
    E: "#4A2E1C",
    S: "#8A4028",
    C: "#B8563A",
    B: "#FFE39A",
    P: "#F3E4C2",
  },
  frameIntervalMs: 0,
};
