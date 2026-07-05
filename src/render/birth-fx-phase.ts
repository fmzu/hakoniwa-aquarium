import {
  BIRTH_FX_DARKEN_IN_END_MS,
  BIRTH_FX_DARKEN_MAX_ALPHA,
  BIRTH_FX_DARKEN_OUT_START_MS,
  BIRTH_FX_DYE_END_MS,
  BIRTH_FX_DYE_START_MS,
  BIRTH_FX_RING_END_MS,
  BIRTH_FX_RING_START_MS,
  BIRTH_FX_SILHOUETTE_AT_MS,
  BIRTH_FX_TOTAL_MS,
} from "../data/birth-fx-constants";
import { clamp } from "../engine/clamp";

/** 誕生演出の 1 フレームぶんの進行度。トラックは重なり合うためフェーズ enum ではなく並列の値で表す */
export type BirthFxFrame = {
  active: boolean;
  /** 暗転オーバーレイの実アルファ（0〜BIRTH_FX_DARKEN_MAX_ALPHA） */
  darkenAlpha: number;
  /** 泡の不透明度（0〜1）。リング期にフェードアウト */
  bubbleAlpha: number;
  /** 新入り（シルエット以降）を描くか */
  residentVisible: boolean;
  /** 染まり進行度（0〜1）。染まり開始前は null */
  dyeProgress: number | null;
  /** リング＋キャンディ粒の進行度（0〜1）。リング期以外は null */
  ringProgress: number | null;
};

const INACTIVE: BirthFxFrame = {
  active: false,
  darkenAlpha: 0,
  bubbleAlpha: 0,
  residentVisible: false,
  dyeProgress: null,
  ringProgress: null,
};

/** 誕生からの経過 ms を各トラックの進行度に変換する。決定的（乱数・時刻不使用） */
export function birthFxPhase(msSinceBirth: number): BirthFxFrame {
  if (msSinceBirth < 0 || msSinceBirth >= BIRTH_FX_TOTAL_MS) return INACTIVE;

  let darkenAlpha: number;
  if (msSinceBirth < BIRTH_FX_DARKEN_IN_END_MS) {
    darkenAlpha =
      (msSinceBirth / BIRTH_FX_DARKEN_IN_END_MS) * BIRTH_FX_DARKEN_MAX_ALPHA;
  } else if (msSinceBirth < BIRTH_FX_DARKEN_OUT_START_MS) {
    darkenAlpha = BIRTH_FX_DARKEN_MAX_ALPHA;
  } else {
    const outSpan = BIRTH_FX_TOTAL_MS - BIRTH_FX_DARKEN_OUT_START_MS;
    darkenAlpha =
      BIRTH_FX_DARKEN_MAX_ALPHA *
      (1 - (msSinceBirth - BIRTH_FX_DARKEN_OUT_START_MS) / outSpan);
  }

  const ringSpan = BIRTH_FX_RING_END_MS - BIRTH_FX_RING_START_MS;
  const bubbleAlpha =
    msSinceBirth < BIRTH_FX_RING_START_MS
      ? 1
      : clamp(1 - (msSinceBirth - BIRTH_FX_RING_START_MS) / ringSpan, 0, 1);

  const dyeProgress =
    msSinceBirth < BIRTH_FX_DYE_START_MS
      ? null
      : clamp(
          (msSinceBirth - BIRTH_FX_DYE_START_MS) /
            (BIRTH_FX_DYE_END_MS - BIRTH_FX_DYE_START_MS),
          0,
          1,
        );

  const ringProgress =
    msSinceBirth >= BIRTH_FX_RING_START_MS &&
    msSinceBirth < BIRTH_FX_RING_END_MS
      ? (msSinceBirth - BIRTH_FX_RING_START_MS) / ringSpan
      : null;

  return {
    active: true,
    darkenAlpha,
    bubbleAlpha,
    residentVisible: msSinceBirth >= BIRTH_FX_SILHOUETTE_AT_MS,
    dyeProgress,
    ringProgress,
  };
}
