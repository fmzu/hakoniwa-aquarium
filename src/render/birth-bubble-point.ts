import {
  BIRTH_FX_BUBBLE_DELAY_MS,
  BIRTH_FX_BUBBLE_RISE_PER_MS,
  BIRTH_FX_BUBBLE_START_DY,
  BIRTH_FX_BUBBLE_SWAY_AMP,
  BIRTH_FX_BUBBLE_SWAY_FREQ,
} from "../data/birth-fx-constants";

export type BubblePoint = {
  /** 演出中心からの相対 x（整数 px） */
  dx: number;
  /** 演出中心からの相対 y（整数 px）。負が上 */
  dy: number;
  /** ドットの一辺（1 = 1px、2 = 2×2） */
  size: 1 | 2;
};

/**
 * 泡 index の msSinceBirth 時点の位置。出現前は null。
 * インデックスと時間だけから決定的に計算する（乱数不使用）。
 * 散らばり: (index×29)%13 の擬似分散 / 揺らぎ: sin / 座標は整数に丸める
 */
export function birthBubblePoint(
  index: number,
  msSinceBirth: number,
): BubblePoint | null {
  const age = msSinceBirth - index * BIRTH_FX_BUBBLE_DELAY_MS;
  if (age < 0) return null;
  const baseDx = ((index * 29) % 13) - 6;
  const sway = Math.round(
    Math.sin(age * BIRTH_FX_BUBBLE_SWAY_FREQ + index) *
      BIRTH_FX_BUBBLE_SWAY_AMP,
  );
  return {
    dx: baseDx + sway,
    dy:
      BIRTH_FX_BUBBLE_START_DY - Math.round(age * BIRTH_FX_BUBBLE_RISE_PER_MS),
    size: index % 3 === 0 ? 2 : 1,
  };
}
