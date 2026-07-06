import { expect, test } from "bun:test";
import { SPECIES_IDS } from "./species-ids";
import { SPECIES_NAMES } from "./species-names";

test("SPECIES_IDS は SPECIES_NAMES のキーと順序込みで一致する", () => {
  expect(Object.keys(SPECIES_NAMES)).toEqual([...SPECIES_IDS]);
});

test("SPECIES_IDS は既存 3 種を重複なく含む", () => {
  expect(SPECIES_IDS).toContain("ramuneFish");
  expect(SPECIES_IDS).toContain("strawberryJelly");
  expect(SPECIES_IDS).toContain("taiyaki");
  expect(new Set(SPECIES_IDS).size).toBe(SPECIES_IDS.length);
});
