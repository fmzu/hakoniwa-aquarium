import { expect, test } from "bun:test";
import { headPosition } from "./head-position";

test("左向きのとき頭は x−12, y−6", () => {
  const head = headPosition({ x: 100, y: 60, facing: -1 });
  expect(head.x).toBe(88);
  expect(head.y).toBe(54);
});

test("右向きのとき頭は x+12, y−6", () => {
  const head = headPosition({ x: 100, y: 60, facing: 1 });
  expect(head.x).toBe(112);
  expect(head.y).toBe(54);
});

test("頭の x は torus で折り返す", () => {
  const head = headPosition({ x: 5, y: 60, facing: -1 });
  expect(head.x).toBe(473);
});
