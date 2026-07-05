import { expect, test } from "bun:test";
import { ringDotOffsets } from "./ring-dot-offsets";

test("半径 0 は中心 1 ドット", () => {
  expect(ringDotOffsets(0)).toEqual([{ x: 0, y: 0 }]);
});

test("半径 1 は中心を囲む 8 ドット", () => {
  // steps = max(8, ceil(2π)) = 8。45° 刻みの丸めで 8 方向すべて埋まる
  const dots = ringDotOffsets(1);
  expect(dots.length).toBe(8);
  expect(dots).toContainEqual({ x: 1, y: 0 });
  expect(dots).toContainEqual({ x: -1, y: 0 });
  expect(dots).toContainEqual({ x: 0, y: 1 });
  expect(dots).toContainEqual({ x: 0, y: -1 });
});

test("全ドットが円周 ±0.75px に乗る（半径 5）", () => {
  for (const d of ringDotOffsets(5)) {
    expect(Math.abs(Math.hypot(d.x, d.y) - 5)).toBeLessThanOrEqual(0.75);
  }
});

test("重複ドットがない（半径 4）", () => {
  const dots = ringDotOffsets(4);
  const keys = new Set(dots.map((d) => `${d.x},${d.y}`));
  expect(keys.size).toBe(dots.length);
});

test("小数半径は丸められ決定的（3.4 → 3 と同一）", () => {
  expect(ringDotOffsets(3.4)).toEqual(ringDotOffsets(3));
});
