import { BIRTH_TABLE } from "../data/birth-table";
import type { SpeciesId } from "../types";

/** 現在の住民数から次に生まれる種を引く。固定テーブルをループ */
export function nextBirthSpecies(residentCount: number): SpeciesId {
  return BIRTH_TABLE[residentCount % BIRTH_TABLE.length];
}
