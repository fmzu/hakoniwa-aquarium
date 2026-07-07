import type { Resident } from "../types";

/**
 * 退場予定（departing）を除いた実効の住民数。
 * 定員（RESIDENT_MAX）の判定はこの数で行う（退場予定は枠を空けたとみなす）
 */
export function countActiveResidents(residents: readonly Resident[]): number {
  return residents.filter((resident) => !resident.departing).length;
}
