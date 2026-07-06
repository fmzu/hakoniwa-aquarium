import { expect, test } from "bun:test";
import { SPECIES_IDS } from "./species-ids";

test("SPECIES_IDS は全 3 種を誕生テーブルと同じ順で重複なく含む", () => {
  expect(SPECIES_IDS).toEqual(["ramuneFish", "strawberryJelly", "taiyaki"]);
  expect(new Set(SPECIES_IDS).size).toBe(SPECIES_IDS.length);
});
