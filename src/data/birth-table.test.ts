import { expect, test } from "bun:test";
import type { SpeciesId } from "../types";
import { BIRTH_TABLE } from "./birth-table";
import { SPECIES_MOTION } from "./species-motion";

test("全種が BIRTH_TABLE に含まれる（モーション定義との網羅一致）", () => {
  const allSpecies = Object.keys(SPECIES_MOTION) as SpeciesId[];
  for (const species of allSpecies) {
    expect(BIRTH_TABLE).toContain(species);
  }
});

test("BIRTH_TABLE に重複がない", () => {
  expect(new Set(BIRTH_TABLE).size).toBe(BIRTH_TABLE.length);
});
