import { SPECIES_IDS } from "../data/species-ids";
import type { SpeciesId, Zukan } from "../types";

/**
 * 次に生まれる種を引く。図鑑の未発見種から一様抽選する（重複なし体験を構造的に担保）。
 * 未発見が空（全種発見済み）なら全種から抽選する。状態を持たない純粋関数。
 * @param zukan - 図鑑。未発見の種はキーごと存在しない
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function nextBirthSpecies(
  zukan: Zukan,
  random: () => number,
): SpeciesId {
  const undiscovered = SPECIES_IDS.filter((id) => zukan[id] === undefined);
  const pool = undiscovered.length > 0 ? undiscovered : SPECIES_IDS;
  return pool[Math.floor(random() * pool.length)];
}
