import type { SpeciesId, Zukan } from "../types";

/**
 * 誕生 1 回ぶんを図鑑に反映する（純粋・非破壊）。
 * 初発見なら発見日時つきで登録、発見済みなら誕生数だけ +1 する。
 * discoveredAtIso は境界層（main.ts）が new Date().toISOString() で渡す
 */
export function updateZukan(
  zukan: Zukan,
  species: SpeciesId,
  discoveredAtIso: string,
): Zukan {
  const existing = zukan[species];
  if (existing) {
    return {
      ...zukan,
      [species]: { ...existing, birthCount: existing.birthCount + 1 },
    };
  }
  return {
    ...zukan,
    [species]: { firstDiscoveredAt: discoveredAtIso, birthCount: 1 },
  };
}
