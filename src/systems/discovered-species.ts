import { SPECIES_IDS } from "../data/species-ids";
import type { SpeciesId, Zukan } from "../types";

/**
 * 図鑑から発見済みの種 ID を SPECIES_IDS 順で返す。
 * 常に新しい配列を返す（呼び出し側の破壊操作から SPECIES_IDS を守る）
 */
export function discoveredSpecies(zukan: Zukan): SpeciesId[] {
  return SPECIES_IDS.filter((id) => zukan[id] !== undefined);
}
