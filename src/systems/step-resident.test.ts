import { expect, test } from "bun:test";
import type { Resident } from "../types";
import { stepResident } from "./step-resident";

test("ラムネ魚は 0.25/tick で進み、振幅 4 で揺れる", () => {
  const fish: Resident = {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: Math.PI / 2,
    bornAtMs: -10000,
  };
  const next = stepResident(fish, 0);
  expect(next.x).toBe(100.25);
  expect(next.y).toBeCloseTo(64, 5);
});

test("ストロベリークラゲは 0.1/tick で漂い、振幅 5 で揺れる", () => {
  const jelly: Resident = {
    species: "strawberryJelly",
    x: 100,
    baseY: 60,
    y: 60,
    dir: -1,
    phase: Math.PI / 2,
    bornAtMs: -10000,
  };
  const next = stepResident(jelly, 0);
  expect(next.x).toBeCloseTo(99.9, 5);
  expect(next.y).toBeCloseTo(65, 5);
});

test("x は torus で折り返す", () => {
  const fish: Resident = {
    species: "ramuneFish",
    x: 479.9,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
  };
  expect(stepResident(fish, 0).x).toBeCloseTo(0.15, 5);
});

test("誕生演出中は移動も揺れもしない", () => {
  const newborn: Resident = {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: 0,
  };
  const next = stepResident(newborn, 1000);
  expect(next.x).toBe(100);
  expect(next.y).toBe(60);
});

test("演出時間（2500ms）経過後は通常挙動に戻る", () => {
  const newborn: Resident = {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: 0,
  };
  const next = stepResident(newborn, 2500);
  expect(next.x).toBe(100.25);
});
