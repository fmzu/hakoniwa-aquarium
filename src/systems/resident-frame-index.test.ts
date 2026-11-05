import { expect, test } from "bun:test";
import { RESIDENT_SPRITES } from "../data/resident-sprites";
import { residentFrameIndex } from "./resident-frame-index";

const interval = RESIDENT_SPRITES.salmon.frameIntervalMs;

test("swim の種は個体の位相に関係なく全員同じコマ", () => {
  const a = residentFrameIndex({ species: "ramuneFish", phase: 0 }, 0);
  const b = residentFrameIndex({ species: "ramuneFish", phase: Math.PI }, 0);
  expect(a).toBe(0);
  expect(b).toBe(0);
});

test("inch の種は frameIntervalMs ごとに 0 と 1 が入れ替わる", () => {
  const r = { species: "salmon" as const, phase: 0 };
  expect(residentFrameIndex(r, 0)).toBe(0);
  expect(residentFrameIndex(r, interval - 1)).toBe(0);
  expect(residentFrameIndex(r, interval)).toBe(1);
  expect(residentFrameIndex(r, interval * 2)).toBe(0);
});

test("inch の種は位相が半周ずれると逆のコマになる（全員同時にのびちぢみしない）", () => {
  expect(residentFrameIndex({ species: "salmon", phase: Math.PI }, 0)).toBe(1);
});

test("zigzag の種は推進フェーズで 1", () => {
  expect(residentFrameIndex({ species: "squid", phase: 0 }, 0)).toBe(1);
});
