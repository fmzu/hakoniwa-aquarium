import { ARRIVAL_PROTECT_MS } from "../data/roster-constants";
import { SPECIES_SIZE } from "../data/species-size";
import type { Resident, SizeClass } from "../types";

/**
 * 満員時の誕生で退場予定にする住民の添字を選ぶ（押し出し）。
 * 候補は「退場予定でなく、到着から ARRIVAL_PROTECT_MS 以上経過した」住民
 * （来訪者が視界に入る前に押し出されて誰にも見られず消えるのを防ぐ）。
 * 保護で候補ゼロになる場合は保護なしの非 departing 全体へフォールバックし、
 * 満員時に必ず 1 体選べることを維持する。
 * 候補のうち新生児と同じサイズ階級からランダムに 1 体、同階級が不在なら
 * 候補全体からランダム（現 3 種は全て "S" なので当面未発動だが、将来の L 級以上に備える）。
 * 新生児は residents に加える前にこの関数を呼ぶことで対象から除外する。
 * 前提: 退場予定でない住民が 1 体以上いること（満員時のみ呼ばれるため保証される。違反は throw）
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function pickDepartingIndex(
  residents: readonly Resident[],
  newbornSize: SizeClass,
  elapsedMs: number,
  random: () => number,
): number {
  const active = residents
    .map((resident, index) => ({ resident, index }))
    .filter(({ resident }) => !resident.departing);
  if (active.length === 0) {
    throw new Error(
      "pickDepartingIndex: 退場予定でない住民が0体（満員ゲートの契約違反）",
    );
  }
  const unprotected = active.filter(
    ({ resident }) => elapsedMs - resident.arrivedAtMs >= ARRIVAL_PROTECT_MS,
  );
  const candidates = unprotected.length > 0 ? unprotected : active;
  const sameSize = candidates.filter(
    ({ resident }) => SPECIES_SIZE[resident.species] === newbornSize,
  );
  const pool = sameSize.length > 0 ? sameSize : candidates;
  return pool[Math.floor(random() * pool.length)].index;
}
