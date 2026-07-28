import { SPECIES_IDS } from "../data/species-ids";
import type { Zukan } from "../types";
import { discoveredSpecies } from "./discovered-species";

/** 誕生に必要な餌数のベース（発見 0〜1 種のときの値）。旧 SATIETY_MAX 定数の後継 */
const SATIETY_BASE = 5;

/**
 * 誕生に必要な餌数。発見数が増えるほど漸増する（5 + floor(min(発見数, 全種数-1) / 2)）。
 * 発見数を SPECIES_IDS.length - 1 でキャップする理由: 最後の1種を発見した瞬間にコストが
 * 跳ね上がるのを防ぎ、全種コンプリート後は必要数を固定するオーナー決定（2026-07-28）。
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
