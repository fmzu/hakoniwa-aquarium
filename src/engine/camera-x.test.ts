import { expect, test } from "bun:test";
import { cameraX } from "./camera-x";

test("主人公を画面中央に置く（heroX - VIEW_WIDTH/2）", () => {
  expect(cameraX(80)).toBe(16); // 80 - 128/2
});

test("torus で折り返す（負になる場合）", () => {
  expect(cameraX(10)).toBe(426); // mod(10 - 64, 480)
});

test("世界幅ちょうどで 0 に戻る", () => {
  expect(cameraX(544)).toBe(0); // mod(544 - 64, 480)
});
