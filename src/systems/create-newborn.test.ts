import { expect, test } from "bun:test";
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { SPECIES_MOTION } from "../data/species-motion";
import type { Hero } from "../types";
import { createNewborn } from "./create-newborn";

function hero(y: number): Hero {
  return { x: 100, y, vx: 0, vy: 0, facing: 1 };
}

test("誕生地点は主人公の位置で、bornAtMs = arrivedAtMs = elapsedMs（誕生＝到着）", () => {
  const born = createNewborn("ramuneFish", hero(60), 5000, () => 0.5);
  expect(born.species).toBe("ramuneFish");
  expect(born.x).toBe(100);
  expect(born.baseY).toBe(60);
  expect(born.y).toBe(60);
  expect(born.bornAtMs).toBe(5000);
  expect(born.arrivedAtMs).toBe(5000);
  expect(born.departing).toBe(false);
});

test("baseY は住民の遊泳域にクランプされる（上端・下端）", () => {
  expect(createNewborn("ramuneFish", hero(0), 0, () => 0.5).baseY).toBe(24); // RESIDENT_MIN_BASE_Y
  expect(createNewborn("ramuneFish", hero(200), 0, () => 0.5).baseY).toBe(118); // RESIDENT_MAX_BASE_Y
});

test("演出明け（bornAtMs + BIRTH_FX_TOTAL_MS）に sin 項が 0 になる位相を持つ（y 飛び防止）", () => {
  for (const species of ["ramuneFish", "strawberryJelly", "taiyaki"] as const) {
    const born = createNewborn(species, hero(60), 5000, () => 0.5);
    const freq = SPECIES_MOTION[species].bobFrequency;
    expect(
      Math.sin((born.bornAtMs + BIRTH_FX_TOTAL_MS) * freq + born.phase),
    ).toBeCloseTo(0, 5);
  }
});

test("dir は乱数で決まる（0.5 未満で左向き、以上で右向き）", () => {
  expect(createNewborn("ramuneFish", hero(60), 0, () => 0.4).dir).toBe(-1);
  expect(createNewborn("ramuneFish", hero(60), 0, () => 0.5).dir).toBe(1);
});
