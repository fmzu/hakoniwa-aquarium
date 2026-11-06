import { SPECIES_SIZE } from "../data/species-size";
import { RESIDENT_MAX } from "../data/world-constants";
import type { Hero, Resident, SpeciesId } from "../types";
import { countActiveResidents } from "./count-active-residents";
import { createNewborn } from "./create-newborn";
import { pickDepartingIndex } from "./pick-departing-index";

/**
 * 主人公の位置に新生児を 1 体加えた住民一覧を返す。
 * 満員（退場予定を除く実効数が上限）でも誕生する（押し出し方式。docs/spec.md 決定ログ 3 参照）。
 * 新生児と同サイズ階級から 1 体を退場予定にする。
 * 新生児を配列に加える前に選ぶことで新生児自身を対象から除外する。
 * 乱数は 押し出し抽選（満員時のみ）→ 新生児の向き の順に消費する
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function addNewborn(
  residents: readonly Resident[],
  species: SpeciesId,
  hero: Hero,
  elapsedMs: number,
  random: () => number,
): Resident[] {
  let next = [...residents];
  if (countActiveResidents(next) >= RESIDENT_MAX) {
    const departingIndex = pickDepartingIndex(
      next,
      SPECIES_SIZE[species],
      elapsedMs,
      random,
    );
    next = next.map((resident, index) =>
      index === departingIndex ? { ...resident, departing: true } : resident,
    );
  }
  return [...next, createNewborn(species, hero, elapsedMs, random)];
}
