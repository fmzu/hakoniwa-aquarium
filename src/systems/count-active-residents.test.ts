import { expect, test } from "bun:test";
import type { Resident } from "../types";
import { countActiveResidents } from "./count-active-residents";

function resident(departing: boolean): Resident {
  return {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing,
  };
}

test("退場予定を除いた数を返す", () => {
  const residents = [resident(true), resident(false), resident(false)];
  expect(countActiveResidents(residents)).toBe(2);
});

test("空配列なら 0", () => {
  expect(countActiveResidents([])).toBe(0);
});
