import type { Resident } from "../types";
import { isBirthFxActive } from "./is-birth-fx-active";

/**
 * 誕生セレモニー中か。いずれかの住民の誕生演出が再生中なら真。
 * セレモニー中は主人公が完全静止し（path は保持）、捕食判定もスキップされる
 */
export function isCeremonyActive(
  residents: readonly Resident[],
  elapsedMs: number,
): boolean {
  return residents.some((resident) =>
    isBirthFxActive(resident.bornAtMs, elapsedMs),
  );
}
