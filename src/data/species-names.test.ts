import { expect, test } from "bun:test";
import { SPECIES_IDS } from "./species-ids";
import { SPECIES_NAMES } from "./species-names";

test("全種に空でない表示名がある", () => {
  for (const id of SPECIES_IDS) {
    expect(SPECIES_NAMES[id].length).toBeGreaterThan(0);
  }
});
