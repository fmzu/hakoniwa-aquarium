import { SPECIES_MOTION } from "../data/species-motion";
import type { Resident } from "../types";

/**
 * 鏡像反転するか。SPECIES_MOTION の mirrorsByDirection が true の種（魚形など）は右向きで反転。
 * 左右対称の種（クラゲ・クリオネ・イカ）は反転するとハイライトの左右が入れ替わるため反転しない
 */
export function isResidentFlipped(
  resident: Pick<Resident, "species" | "dir">,
): boolean {
  return (
    SPECIES_MOTION[resident.species].mirrorsByDirection && resident.dir > 0
  );
}
