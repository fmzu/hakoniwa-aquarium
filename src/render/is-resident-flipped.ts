import type { Resident } from "../types";

/** 鏡像反転するか。魚形（ラムネ魚・たい焼き）は進行方向で反転、クラゲは左右対称なので反転しない */
export function isResidentFlipped(
  resident: Pick<Resident, "species" | "dir">,
): boolean {
  return resident.species !== "strawberryJelly" && resident.dir > 0;
}
