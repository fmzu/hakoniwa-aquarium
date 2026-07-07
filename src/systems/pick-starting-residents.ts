import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { ROSTER_MAX, ROSTER_MIN } from "../data/roster-constants";
import {
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  WORLD_WIDTH,
} from "../data/world-constants";
import type { Resident, Zukan } from "../types";
import { discoveredSpecies } from "./discovered-species";

/**
 * セッション開始時の顔ぶれ抽選。発見済みの種から ROSTER_MIN〜ROSTER_MAX 体
 * （種の重複なし。発見数が少なければ発見数まで）を生成する。乱数は注入（テスト決定性）。
 * 抽選数は最初の乱数 1 回で決める。bornAtMs は十分過去の値にして誕生演出を再生しない
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function pickStartingResidents(
  zukan: Zukan,
  random: () => number,
): Resident[] {
  const pool = discoveredSpecies(zukan);
  const count = Math.min(
    ROSTER_MIN + Math.floor(random() * (ROSTER_MAX - ROSTER_MIN + 1)),
    pool.length,
  );
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
      // セッション開始メンバーの到着はセッション開始時刻（elapsedMs=0）
      arrivedAtMs: 0,
      departing: false,
    });
  }
  return residents;
}
