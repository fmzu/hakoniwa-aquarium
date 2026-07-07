import type { SizeClass, SpeciesId } from "../types";

/**
 * 種ごとのサイズ階級。満員誕生の押し出し対象の選定に使う。
 * Record<SpeciesId, SizeClass> の網羅により、SpeciesId へ新種を追加すると
 * ここへの追記を tsc が強制する（定義漏れをコンパイラで防ぐ）
 */
export const SPECIES_SIZE: Record<SpeciesId, SizeClass> = {
  ramuneFish: "S",
  strawberryJelly: "S",
  taiyaki: "S",
};
