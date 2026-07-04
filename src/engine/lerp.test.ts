import { expect, test } from "bun:test";
import { lerp } from "./lerp";

test("t=0 で始点", () => {
  expect(lerp(10, 20, 0)).toBe(10);
});

test("t=1 で終点", () => {
  expect(lerp(10, 20, 1)).toBe(20);
});

test("t=0.5 で中点", () => {
  expect(lerp(10, 20, 0.5)).toBe(15);
});
