import type { SpeciesId } from "../types";

/**
 * 全種 ID の一覧（ランタイム定数）。図鑑の表示順・セーブ検証に使う。
 * SpeciesId に種を追加したら必ずここにも足す（順序は BIRTH_TABLE と揃える）
 */
export const SPECIES_IDS: readonly SpeciesId[] = [
  "ramuneFish",
  "strawberryJelly",
  "taiyaki",
];
