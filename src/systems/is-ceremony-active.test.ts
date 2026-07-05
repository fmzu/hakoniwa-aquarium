import { expect, test } from "bun:test";
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import type { Resident } from "../types";
import { isCeremonyActive } from "./is-ceremony-active";

function residentBornAt(bornAtMs: number): Resident {
  return {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs,
  };
}

test("演出中の住民が 1 体でもいれば真", () => {
  const residents = [residentBornAt(-10000), residentBornAt(1000)];
  expect(isCeremonyActive(residents, 1500)).toBe(true);
});

test("全住民が演出明けなら偽", () => {
  expect(isCeremonyActive([residentBornAt(0)], BIRTH_FX_TOTAL_MS)).toBe(false);
});

test("演出窓の開始（誕生の瞬間）は真", () => {
  expect(isCeremonyActive([residentBornAt(1000)], 1000)).toBe(true);
});

test("住民がいなければ偽", () => {
  expect(isCeremonyActive([], 1000)).toBe(false);
});
