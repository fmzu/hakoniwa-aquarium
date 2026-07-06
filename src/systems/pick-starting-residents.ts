import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { SPECIES_IDS } from "../data/species-ids";
import {
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  STARTING_RESIDENT_MAX,
  WORLD_WIDTH,
} from "../data/world-constants";
import type { Resident, Zukan } from "../types";

/**
 * 起動時の海の抽選。発見済みの種からランダムに最大 STARTING_RESIDENT_MAX 体
 * （種の重複なし）を生成する。乱数は注入（テスト決定性）。
 * bornAtMs は十分過去の値にして誕生演出を再生しない。
 * 将来の滞在スケジューラはこの関数の置き換えで実現する
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function pickStartingResidents(
  zukan: Zukan,
  random: () => number,
): Resident[] {
  const pool = SPECIES_IDS.filter((id) => zukan[id] !== undefined);
  const count = Math.min(STARTING_RESIDENT_MAX, pool.length);
  const residents: Resident[] = [];
  for (let i = 0; i < count; i++) {
    const species = pool.splice(Math.floor(random() * pool.length), 1)[0];
    const baseY =
      RESIDENT_MIN_BASE_Y +
      random() * (RESIDENT_MAX_BASE_Y - RESIDENT_MIN_BASE_Y);
    residents.push({
      species,
      x: random() * WORLD_WIDTH,
      baseY,
      y: baseY,
      dir: random() < 0.5 ? -1 : 1,
      phase: random() * 6,
      // 演出窓の外に置く（定数変更に追従）
      bornAtMs: -BIRTH_FX_TOTAL_MS,
    });
  }
  return residents;
}
