import { expect, test } from "bun:test";
import { pathLengthAhead } from "./path-length-ahead";

test("現在地から各点を順にたどった道のりを返す", () => {
  const len = pathLengthAhead(
    { x: 0, y: 0 },
    [
      { x: 3, y: 4 },
      { x: 3, y: 10 },
    ],
    100,
  );
  expect(len).toBeCloseTo(11, 5);
});

test("limit を超えたら打ち切る（limit 以上を返す）", () => {
  const len = pathLengthAhead(
    { x: 0, y: 0 },
    [
      { x: 20, y: 0 },
      { x: 20, y: 100 },
    ],
    12,
  );
  expect(len).toBeGreaterThanOrEqual(12);
  expect(len).toBeLessThan(100);
});

test("torus の境界をまたぐ道のりは近い方で測る", () => {
  expect(pathLengthAhead({ x: 478, y: 0 }, [{ x: 2, y: 0 }], 100)).toBeCloseTo(
    4,
    5,
  );
});

test("線が空なら 0", () => {
  expect(pathLengthAhead({ x: 0, y: 0 }, [], 12)).toBe(0);
});
