import { expect, test } from "bun:test";
import { isBaitCaught } from "./is-bait-caught";

test("頭から 8px 未満なら捕食できる", () => {
  expect(isBaitCaught({ x: 105, y: 55 }, { x: 100, y: 50 })).toBe(true); // 距離 ≈ 7.07
});

test("ちょうど 8px は捕食できない（strict less than）", () => {
  expect(isBaitCaught({ x: 108, y: 50 }, { x: 100, y: 50 })).toBe(false);
});

test("距離は torus で測る", () => {
  expect(isBaitCaught({ x: 477, y: 52 }, { x: 2, y: 50 })).toBe(true); // dx=−5, dy=2
});
