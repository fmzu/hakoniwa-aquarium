import { expect, test } from "bun:test";
import { isStrokePhase } from "./is-stroke-phase";

test("周期の先頭 360ms は掻きフレーム", () => {
  expect(isStrokePhase(0)).toBe(true);
  expect(isStrokePhase(359)).toBe(true);
});

test("360ms 以降は滑空フレーム", () => {
  expect(isStrokePhase(360)).toBe(false);
  expect(isStrokePhase(899)).toBe(false);
});

test("900ms 周期で繰り返す", () => {
  expect(isStrokePhase(900)).toBe(true);
  expect(isStrokePhase(1260)).toBe(false);
});
