import type { Resident } from "../types";

/**
 * この tick で誕生した住民を返す（いなければ undefined）。
 * stepWorld は誕生時に bornAtMs へ現在の elapsedMs を刻むので、
 * bornAtMs === elapsedMs が「いま生まれた」の同値条件になる。
 * 配列の増減や末尾位置に依存しないため、「住民は減らない」
 * 「末尾＝新生児」という暗黙前提を置かず、将来の退場実装にも耐える
 */
export function detectBornResident(
  residents: readonly Resident[],
  elapsedMs: number,
): Resident | undefined {
  return residents.find((resident) => resident.bornAtMs === elapsedMs);
}
