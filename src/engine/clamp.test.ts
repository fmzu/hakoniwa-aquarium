import { expect, test } from "bun:test";
import { clamp } from "./clamp";

test("範囲内はそのまま", () => {
  expect(clamp(5, 0, 10)).toBe(5);
});

test("下限で切る", () => {
  expect(clamp(-3, 0, 10)).toBe(0);
});

test("上限で切る", () => {
  expect(clamp(15, 0, 10)).toBe(10);
});

test("下限ちょうどはそのまま", () => {
  expect(clamp(0, 0, 10)).toBe(0);
});

test("上限ちょうどはそのまま", () => {
  expect(clamp(10, 0, 10)).toBe(10);
});
