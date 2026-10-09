import { expect, test } from "bun:test";
import { SPECIES_MOTION } from "./species-motion";

test("全種の depthMinY は depthMaxY より小さい", () => {
  for (const [species, motion] of Object.entries(SPECIES_MOTION)) {
    expect(motion.depthMinY, species).toBeLessThan(motion.depthMaxY);
  }
});
