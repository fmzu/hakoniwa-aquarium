import { expect, test } from "bun:test";
import { cameraPosition } from "./camera-position";

test("主人公を画面中央に置く", () => {
  const { camX, camY } = cameraPosition(80, 60);
  expect(camX).toBe(16); // 80 - 128/2
  expect(camY).toBe(15); // 60 - 90/2
});

test("camX は torus で折り返す", () => {
  const { camX } = cameraPosition(10, 60);
  expect(camX).toBe(426); // mod(10 - 64, 480)
});

test("camY は上端でクランプ", () => {
  const { camY } = cameraPosition(80, 0);
  expect(camY).toBe(0);
});

test("camY は下端でクランプ", () => {
  const { camY } = cameraPosition(80, 160);
  expect(camY).toBe(70); // 160 - 90
});
