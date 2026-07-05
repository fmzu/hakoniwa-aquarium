import type { Resident } from "../types";

/** 鏡像反転するか。魚は進行方向で反転、クラゲは左右対称なので反転しない */
export function isResidentFlipped(
  resident: Pick<Resident, "species" | "dir">,
): boolean {
  return resident.species === "ramuneFish" && resident.dir > 0;
}
