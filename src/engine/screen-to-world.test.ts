import { expect, test } from "bun:test";
import { screenToWorld } from "./screen-to-world";

const rect = { left: 0, top: 0, width: 256, height: 180 }; // 2 倍表示

test("スクリーン座標をワールド座標に変換する", () => {
  const p = screenToWorld(128, 90, rect, 0, 0);
  expect(p.x).toBe(64);
  expect(p.y).toBe(45);
});

test("カメラ位置が加算され x は torus で折り返す", () => {
  const p = screenToWorld(40, 90, rect, 470, 0);
  expect(p.x).toBe(10); // mod(470 + 20, 480)
});

test("y は入力可能範囲にクランプされる", () => {
  expect(screenToWorld(0, 0, rect, 0, 0).y).toBe(6);
  expect(screenToWorld(0, 180, rect, 0, 100).y).toBe(152); // min(100+90, 160-8)
});
