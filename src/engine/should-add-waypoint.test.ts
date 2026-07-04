import { expect, test } from "bun:test";
import type { Vec2 } from "../types";
import { shouldAddWaypoint } from "./should-add-waypoint";

test("空の path には常に追加できる", () => {
  expect(shouldAddWaypoint([], { x: 10, y: 10 })).toBe(true);
});

test("直前の点から 4px 以下は追加しない（サンプリング間隔）", () => {
  const path: Vec2[] = [{ x: 100, y: 50 }];
  expect(shouldAddWaypoint(path, { x: 103, y: 50 })).toBe(false);
  expect(shouldAddWaypoint(path, { x: 104, y: 50 })).toBe(false);
});

test("直前の点から 4px を超えたら追加する", () => {
  const path: Vec2[] = [{ x: 100, y: 50 }];
  expect(shouldAddWaypoint(path, { x: 105, y: 50 })).toBe(true);
  expect(shouldAddWaypoint(path, { x: 103, y: 54 })).toBe(true); // hypot(3,4)=5
});

test("距離は torus で測る（継ぎ目をまたいでも近い）", () => {
  const path: Vec2[] = [{ x: 479, y: 50 }];
  expect(shouldAddWaypoint(path, { x: 3, y: 50 })).toBe(false); // 距離 4
  expect(shouldAddWaypoint(path, { x: 4, y: 50 })).toBe(true); // 距離 5
});

test("60 点で打ち止め", () => {
  const path: Vec2[] = Array.from({ length: 60 }, (_, i) => ({
    x: i * 5,
    y: 50,
  }));
  expect(shouldAddWaypoint(path, { x: 400, y: 80 })).toBe(false);
});
