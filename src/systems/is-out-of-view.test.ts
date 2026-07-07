import { expect, test } from "bun:test";
import { isOutOfView } from "./is-out-of-view";

// heroX=100 → camX = mod(100 - 64, 480) = 36。視界は世界 x 36〜164、
// 余白 DESPAWN_MARGIN_PX=12 込みの生存域は screenX ∈ [-12, 140]

test("視界内は偽", () => {
  expect(isOutOfView(100, 100)).toBe(false); // screenX = 64
});

test("右端: 余白の内側（screenX=140）は偽、外（141）は真", () => {
  expect(isOutOfView(176, 100)).toBe(false); // 176 - 36 = 140
  expect(isOutOfView(177, 100)).toBe(true); // 141
});

test("左端: 余白の内側（screenX=-12）は偽、外（-13）は真", () => {
  expect(isOutOfView(24, 100)).toBe(false); // 24 - 36 = -12
  expect(isOutOfView(23, 100)).toBe(true); // -13
});

test("torus 境界をまたぐカメラでも正しく判定する", () => {
  // heroX=10 → camX = mod(10 - 64, 480) = 426。視界は世界 x 426〜480〜74
  expect(isOutOfView(470, 10)).toBe(false); // torusDistance(470,426)=44 → 視界内
  expect(isOutOfView(86, 10)).toBe(false); // mod(86-426,480)=140 → 余白ちょうど
  expect(isOutOfView(90, 10)).toBe(true); // 144 → 右余白の外
  expect(isOutOfView(270, 10)).toBe(true); // torusDistance=-156 → 完全に反対側
});
