import type { GameState, SaveData } from "../types";
import { createInitialState } from "./create-initial-state";
import { pickStartingResidents } from "./pick-starting-residents";

/**
 * セーブから起動時のゲーム状態を作る。顔ぶれ・位置は保存せず
 * 図鑑（発見済みの種）から抽選し、満腹ゲージだけ復元する（確定仕様）
 */
export function restoreStateFromSave(
  save: SaveData,
  random: () => number,
): GameState {
  const base = createInitialState(random);
  return {
    ...base,
    residents: pickStartingResidents(save.zukan, random),
    satiety: save.satiety,
  };
}
