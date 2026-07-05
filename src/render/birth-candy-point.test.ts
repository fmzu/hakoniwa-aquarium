import { expect, test } from "bun:test";
import { birthCandyPoint } from "./birth-candy-point";

test("index 0 進行 0: 角度 0・距離 2 → (2, 0)", () => {
  expect(birthCandyPoint(0, 0)).toEqual({ x: 2, y: 0 });
});

test("index 0 進行 1: 距離 12（BIRTH_FX_CANDY_MAX_DIST）→ (12, 0)", () => {
  expect(birthCandyPoint(0, 1)).toEqual({ x: 12, y: 0 });
});

test("index 1 進行 0.5: 距離 7・角度 2.39996rad", () => {
  // x = round(cos(2.39996)×7) = round(−5.162) = −5
  // y = round(sin(2.39996)×7) = round(4.728) = 5
  expect(birthCandyPoint(1, 0.5)).toEqual({ x: -5, y: 5 });
});

test("index 3 進行 1: 決定性の固定値検証", () => {
  // 角度 = 3×2.39996 = 7.19989rad（≒ 0.9167rad）
  // x = round(cos×12) = round(7.303) = 7, y = round(sin×12) = round(9.522) = 10
  expect(birthCandyPoint(3, 1)).toEqual({ x: 7, y: 10 });
});

test("同じ入力は常に同じ出力（決定的）", () => {
  expect(birthCandyPoint(7, 0.3)).toEqual(birthCandyPoint(7, 0.3));
});

test("進行度が増えると中心からの距離が増える", () => {
  for (let index = 0; index < 10; index++) {
    const near = birthCandyPoint(index, 0);
    const mid = birthCandyPoint(index, 0.5);
    const far = birthCandyPoint(index, 1);
    expect(Math.hypot(mid.x, mid.y)).toBeGreaterThan(
      Math.hypot(near.x, near.y),
    );
    expect(Math.hypot(far.x, far.y)).toBeGreaterThan(Math.hypot(mid.x, mid.y));
  }
});
