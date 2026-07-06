import type { SaveData } from "../types";

/** 初期セーブ（未発見・満腹 0）。セーブがない／壊れているときの出発点 */
export function createInitialSave(): SaveData {
  return { version: 1, zukan: {}, satiety: 0 };
}
