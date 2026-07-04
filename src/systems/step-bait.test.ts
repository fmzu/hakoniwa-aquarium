import { expect, test } from "bun:test";
import type { Bait } from "../types";
import { stepBait } from "./step-bait";

test("dir 方向に 0.5/tick で進む", () => {
  const bait: Bait = { x: 100, baseY: 50, y: 50, dir: 1, phase: 0 };
  expect(stepBait(bait, 0).x).toBe(100.5);
  const back: Bait = { x: 100, baseY: 50, y: 50, dir: -1, phase: 0 };
  expect(stepBait(back, 0).x).toBe(99.5);
});

test("x は torus で折り返す", () => {
  const bait: Bait = { x: 479.8, baseY: 50, y: 50, dir: 1, phase: 0 };
  expect(stepBait(bait, 0).x).toBeCloseTo(0.3, 5);
});

test("baseY を中心に振幅 3 で上下に揺れる", () => {
  const bait: Bait = { x: 100, baseY: 50, y: 50, dir: 1, phase: Math.PI / 2 };
  expect(stepBait(bait, 0).y).toBeCloseTo(53, 5); // sin(π/2) = 1
});
