import { expect, test } from "bun:test";
import { torusDistance } from "./torus-distance";

test("近い方の経路が正の向きなら正の値", () => {
  expect(torusDistance(100, 60, 480)).toBe(40);
});

test("近い方の経路が負の向きなら負の値", () => {
  expect(torusDistance(60, 100, 480)).toBe(-40);
});

test("継ぎ目をまたぐ距離が最短になる（正方向）", () => {
  expect(torusDistance(10, 470, 480)).toBe(20);
});

test("継ぎ目をまたぐ距離が最短になる（負方向）", () => {
  expect(torusDistance(470, 10, 480)).toBe(-20);
});

test("ちょうど半周は正の値のまま", () => {
  expect(torusDistance(240, 0, 480)).toBe(240);
});
