import { expect, test } from "bun:test";
import type { Resident } from "../types";
import { detectBornResident } from "./detect-born-resident";

const resident = (bornAtMs: number): Resident => ({
  species: "ramuneFish",
  x: 240,
  baseY: 71,
  y: 71,
  dir: 1,
  phase: 0,
  bornAtMs,
  arrivedAtMs: 0,
  departing: false,
});

test("この tick で誕生した住民（bornAtMs === elapsedMs）を返す", () => {
  const born = resident(1000);
  const residents = [resident(-10000), born];
  expect(detectBornResident(residents, 1000)).toBe(born);
});

test("誕生した住民がいなければ undefined を返す", () => {
  expect(detectBornResident([], 1000)).toBeUndefined();
});

test("過去に生まれた住民は返さない", () => {
  const residents = [resident(-10000), resident(500)];
  expect(detectBornResident(residents, 1000)).toBeUndefined();
});
