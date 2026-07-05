import { BIRTH_FX_CANDY_MAX_DIST } from "../data/birth-fx-constants";
import type { Vec2 } from "../types";

/** 黄金角（rad）。インデックスごとに方向が均等に散らばる */
const GOLDEN_ANGLE = 2.399963229728653;
/** 飛散の開始距離（px） */
const START_DIST = 2;

/**
 * キャンディ粒 index の飛散位置（演出中心からの相対・整数 px）。
 * 進行度 0〜1 で距離 START_DIST → BIRTH_FX_CANDY_MAX_DIST に広がる。決定的（乱数不使用）
 */
export function birthCandyPoint(index: number, progress: number): Vec2 {
  const angle = index * GOLDEN_ANGLE;
  const dist = START_DIST + progress * (BIRTH_FX_CANDY_MAX_DIST - START_DIST);
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
  };
}
