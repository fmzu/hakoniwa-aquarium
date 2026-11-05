import { expect, test } from "bun:test";
import { RESIDENT_MAX } from "../data/world-constants";
import type { Hero, Resident } from "../types";
import { addNewborn } from "./add-newborn";

const hero: Hero = { x: 100, y: 60, vx: 0, vy: 0, facing: 1 };

function resident(departing = false): Resident {
  return {
    species: "ramuneFish",
    x: 0,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -100000,
    arrivedAtMs: -100000,
    departing,
  };
}

test("定員未満なら誰も退場予定にせず新生児を末尾に加える", () => {
  const next = addNewborn([resident()], "taiyaki", hero, 1000, () => 0.5);
  expect(next.length).toBe(2);
  expect(next[1].species).toBe("taiyaki");
  expect(next.some((r) => r.departing)).toBe(false);
});

test("満員なら 1 体を退場予定にして新生児を加える", () => {
  const full = Array.from({ length: RESIDENT_MAX }, () => resident());
  const next = addNewborn(full, "taiyaki", hero, 1000, () => 0.5);
  expect(next.length).toBe(RESIDENT_MAX + 1);
  expect(next.filter((r) => r.departing).length).toBe(1);
  expect(next.at(-1)?.departing).toBe(false);
});

test("元の配列は書き換えない", () => {
  const full = Array.from({ length: RESIDENT_MAX }, () => resident());
  addNewborn(full, "taiyaki", hero, 1000, () => 0.5);
  expect(full.some((r) => r.departing)).toBe(false);
});
