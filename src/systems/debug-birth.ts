import type { GameState, SpeciesId } from "../types";
import { addNewborn } from "./add-newborn";

/**
 * 動作確認用: 餌を食べずに、指定した種を主人公の位置へ今すぐ誕生させる。
 * 誕生演出・満員時の押し出し・主人公の静止はふつうの誕生と同じ。満腹は変えない
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function debugBirth(
  state: GameState,
  species: SpeciesId,
  random: () => number,
): GameState {
  return {
    ...state,
    residents: addNewborn(
      state.residents,
      species,
      state.hero,
      state.elapsedMs,
      random,
    ),
    hero: { ...state.hero, vx: 0, vy: 0 },
  };
}
