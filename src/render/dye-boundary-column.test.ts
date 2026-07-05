import { expect, test } from "bun:test";
import { dyeBoundaryColumn } from "./dye-boundary-column";

test("進行 0 は境界が先頭列（何も染まっていない）", () => {
  expect(dyeBoundaryColumn(0, 16)).toBe(0);
});

test("進行 0.125 は floor(0.125 × 17) = 2", () => {
  expect(dyeBoundaryColumn(0.125, 16)).toBe(2);
});

test("進行 0.5 は floor(0.5 × 17) = 8", () => {
  expect(dyeBoundaryColumn(0.5, 16)).toBe(8);
});

test("進行 1 で全列（16）が染まり白境界は消える", () => {
  expect(dyeBoundaryColumn(1, 16)).toBe(16);
});

test("範囲外の進行度はクランプされる", () => {
  expect(dyeBoundaryColumn(1.2, 16)).toBe(16);
  expect(dyeBoundaryColumn(-0.1, 16)).toBe(0);
});
