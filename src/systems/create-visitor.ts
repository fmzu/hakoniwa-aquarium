import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { VISIT_SPAWN_MARGIN_PX } from "../data/roster-constants";
import {
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  VIEW_WIDTH,
  WORLD_WIDTH,
} from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Resident, SpeciesId } from "../types";

/**
 * 来訪者を 1 体つくる。発見済みの種からランダムに選び、視界の左右どちらか外側
 * （余白 VISIT_SPAWN_MARGIN_PX 付き）に湧かせて視界へ向かって泳がせる。
 * カメラは主人公追従なので camX は hero.x から導出する。
 * bornAtMs は -BIRTH_FX_TOTAL_MS（負値）固定にして、誕生演出（isBirthFxActive）も
 * 図鑑更新（detectBornResident の bornAtMs === elapsedMs 判定）も発火させない
 * @param discovered - 発見済みの種（1 種以上あることは呼び出し側が保証する）
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function createVisitor(
  discovered: readonly SpeciesId[],
  heroX: number,
  elapsedMs: number,
  random: () => number,
): Resident {
  const species = discovered[Math.floor(random() * discovered.length)];
  const fromLeft = random() < 0.5;
  const camX = mod(heroX - VIEW_WIDTH / 2, WORLD_WIDTH);
  const x = fromLeft
    ? mod(camX - VISIT_SPAWN_MARGIN_PX, WORLD_WIDTH)
    : mod(camX + VIEW_WIDTH + VISIT_SPAWN_MARGIN_PX, WORLD_WIDTH);
  const baseY =
    RESIDENT_MIN_BASE_Y +
    random() * (RESIDENT_MAX_BASE_Y - RESIDENT_MIN_BASE_Y);
  return {
    species,
    x,
    baseY,
    y: baseY,
    dir: fromLeft ? 1 : -1,
    phase: random() * 6,
    bornAtMs: -BIRTH_FX_TOTAL_MS,
    arrivedAtMs: elapsedMs,
    departing: false,
  };
}
