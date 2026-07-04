import { expect, test } from "bun:test";
import type { Hero } from "../types";
import { stepHero } from "./step-hero";

const still = (): Hero => ({ x: 80, y: 60, vx: 0, vy: 0, facing: -1 });

test("path が空でも水流で +x に流される", () => {
  const { hero } = stepHero(still(), [], false);
  expect(hero.vx).toBeCloseTo(0.01152, 5); // (0 + 0.012) * 0.96
  expect(hero.x).toBeCloseTo(80.01152, 5);
});

test("ウェイポイントに向かって推進する（滑空時 0.02）", () => {
  const { hero, path } = stepHero(still(), [{ x: 120, y: 60 }], false);
  expect(hero.vx).toBeCloseTo(0.03072, 5); // (0.02 + 0.012) * 0.96
  expect(hero.vy).toBeCloseTo(0, 5);
  expect(path.length).toBe(1); // まだ到達していない
});

test("掻きフレームは +0.07 のバーストが乗る", () => {
  const { hero } = stepHero(still(), [{ x: 120, y: 60 }], true);
  expect(hero.vx).toBeCloseTo(0.09792, 5); // (0.02 + 0.07 + 0.012) * 0.96
});

test("ウェイポイントから 5px 未満に来たら消費する", () => {
  const { path } = stepHero(still(), [{ x: 82, y: 62 }], false); // 距離 ≈ 2.83
  expect(path.length).toBe(0);
});

test("向きは vx の符号で反転する", () => {
  const right = stepHero({ ...still(), vx: 0.1 }, [], false);
  expect(right.hero.facing).toBe(1);
  const left = stepHero({ ...still(), vx: -0.1, facing: 1 }, [], false);
  expect(left.hero.facing).toBe(-1);
});

test("|vx| が小さいときは向きを保つ", () => {
  const { hero } = stepHero({ ...still(), facing: 1 }, [], false);
  expect(hero.facing).toBe(1); // vx = 0.01152 < 0.05
});

test("x は torus で折り返す", () => {
  const { hero } = stepHero({ ...still(), x: 479.9, vx: 0.5 }, [], false);
  expect(hero.x).toBeLessThan(1);
});

test("y は世界の上下端でクランプされる", () => {
  const { hero } = stepHero({ ...still(), y: 139, vy: 5 }, [], false);
  expect(hero.y).toBe(140);
});

test("y は世界の下端（HERO_MIN_Y）でもクランプされる", () => {
  const { hero } = stepHero({ ...still(), y: 11, vy: -5 }, [], false);
  expect(hero.y).toBe(10); // 11 + (-5 * 0.96) = 6.2 → clamp
});

test("入力の path を破壊しない（純粋関数）", () => {
  const input = [{ x: 82, y: 62 }];
  stepHero(still(), input, false);
  expect(input.length).toBe(1);
});
