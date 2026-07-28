import { SPECIES_IDS } from "../data/species-ids";
import type { Zukan } from "../types";
import { discoveredSpecies } from "./discovered-species";

/** 誕生に必要な餌数のベース（発見 0〜1 種のときの値）。旧 SATIETY_MAX 定数の後継 */
const SATIETY_BASE = 5;

/**
 * 誕生に必要な餌数。発見数が増えるほど漸増する（5 + floor(min(発見数, 全種数-1) / 2)）。
 * 全種発見後も値は増えない（発見数を SPECIES_IDS.length - 1 でキャップ）。
 * 純粋関数。「次の必要数」はセーブに持たず毎回ここで導出する（スキーマ不変）。
 * @param zukan - 図鑑。発見数は discoveredSpecies(zukan).length で導出する
 */
export function satietyMax(zukan: Zukan): number {
  const capped = Math.min(
    discoveredSpecies(zukan).length,
    SPECIES_IDS.length - 1,
  );
  return SATIETY_BASE + Math.floor(capped / 2);
}
