import type { SpeciesId } from "../types";
import { SPECIES_NAMES } from "./species-names";

/**
 * 全種 ID の一覧（ランタイム定数）。図鑑の表示順・セーブ検証に使う。
 * SPECIES_NAMES（Record<SpeciesId, string>）のキーから導出することで、
 * SpeciesId に種を追加したときに SPECIES_NAMES への追記を tsc が強制し、
 * この一覧の網羅性がコンパイラで保証される（手書きの重複リストを持たない）。
 * 順序は SPECIES_NAMES の定義順 = BIRTH_TABLE と揃える。
 */
export const SPECIES_IDS = Object.keys(SPECIES_NAMES) as readonly SpeciesId[];
