import { SPECIES_SIZE } from "../data/species-size";
import type { Resident, SizeClass } from "../types";

/**
 * 満員時の誕生で退場予定にする住民の添字を選ぶ（押し出し）。
 * 新生児と同じサイズ階級の住民（退場予定でないもの）からランダムに 1 体、
 * 同階級が不在なら退場予定でない全住民からランダム（フォールバック。
 * 現 3 種は全て "S" なので当面未発動だが、将来の L 級以上に備える）。
 * 新生児は residents に加える前にこの関数を呼ぶことで対象から除外する。
 * 前提: 退場予定でない住民が 1 体以上いること（満員時のみ呼ばれるため保証される）
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function pickDepartingIndex(
  residents: readonly Resident[],
  newbornSize: SizeClass,
  random: () => number,
): number {
  const active = residents
    .map((resident, index) => ({ resident, index }))
    .filter(({ resident }) => !resident.departing);
  const sameSize = active.filter(
    ({ resident }) => SPECIES_SIZE[resident.species] === newbornSize,
  );
  const pool = sameSize.length > 0 ? sameSize : active;
  return pool[Math.floor(random() * pool.length)].index;
}
