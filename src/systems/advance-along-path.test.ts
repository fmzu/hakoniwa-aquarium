import { expect, test } from "bun:test";
import { advanceAlongPath } from "./advance-along-path";

test("次の点の手前なら、その方向へ distance だけ進む", () => {
  const r = advanceAlongPath({ x: 0, y: 0 }, [{ x: 10, y: 0 }], 3);
  expect(r.dx).toBeCloseTo(3, 5);
  expect(r.dy).toBeCloseTo(0, 5);
  expect(r.path.length).toBe(1);
});

test("点を通り越す分は次の点へ折れて進む（行き過ぎない）", () => {
  const r = advanceAlongPath(
    { x: 0, y: 0 },
    [
      { x: 2, y: 0 },
      { x: 2, y: 10 },
    ],
    5,
  );
  expect(r.dx).toBeCloseTo(2, 5);
  expect(r.dy).toBeCloseTo(3, 5);
  expect(r.path).toEqual([{ x: 2, y: 10 }]);
});

test("線より長く進もうとしても終点で止まる", () => {
  const r = advanceAlongPath({ x: 0, y: 0 }, [{ x: 0, y: 4 }], 10);
  expect(r.dy).toBeCloseTo(4, 5);
  expect(r.path.length).toBe(0);
});

test("torus の境界をまたいで近い方へ進む", () => {
  const r = advanceAlongPath({ x: 478, y: 0 }, [{ x: 2, y: 0 }], 2);
  expect(r.dx).toBeCloseTo(2, 5);
});

test("入力の path を破壊しない（純粋関数）", () => {
  const input = [{ x: 1, y: 0 }];
  advanceAlongPath({ x: 0, y: 0 }, input, 5);
  expect(input.length).toBe(1);
});
