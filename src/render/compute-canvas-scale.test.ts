import { expect, test } from "bun:test";
import { computeCanvasScale } from "./compute-canvas-scale";

test("収まる最大の整数倍率を返す", () => {
  expect(computeCanvasScale(640, 450)).toBe(5); // min(640/128, 450/90) = 5
});

test("幅と高さの小さい方に合わせる", () => {
  expect(computeCanvasScale(600, 450)).toBe(4); // floor(600/128) = 4
  expect(computeCanvasScale(640, 200)).toBe(2); // floor(200/90) = 2
});

test("画面が論理解像度より小さくても最低 1 倍", () => {
  expect(computeCanvasScale(100, 80)).toBe(1);
});
