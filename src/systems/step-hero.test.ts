import { expect, test } from "bun:test";
import {
  HERO_ARRIVE_MIN_RATIO,
  HERO_SPEED_EASE,
  HERO_SPEED_GLIDE,
  HERO_SPEED_STROKE,
} from "../data/world-constants";
import type { Hero, Vec2 } from "../types";
import { stepHero } from "./step-hero";

const still = (): Hero => ({ x: 80, y: 60, vx: 0, vy: 0, facing: -1 });

/** n tick 進めた結果 */
const run = (hero: Hero, path: Vec2[], ticks: number, stroke = false) => {
  let s = { hero, path };
  for (let i = 0; i < ticks; i++) s = stepHero(s.hero, s.path, stroke);
  return s;
};

test("線が空で止まっているなら動かない（水流で流されない）", () => {
  const { hero } = stepHero(still(), [], false);
  expect(hero.x).toBe(80);
  expect(hero.y).toBe(60);
});

test("止まった状態から目標の速さへ HERO_SPEED_EASE ずつ寄る", () => {
  const { hero } = stepHero(still(), [{ x: 0, y: 60 }], false);
  expect(hero.vx).toBeCloseTo(-HERO_SPEED_GLIDE * HERO_SPEED_EASE, 5);
  expect(hero.vy).toBeCloseTo(0, 5);
});

test("ひと掻き中は目標の速さが上がる", () => {
  const glide = stepHero(still(), [{ x: 0, y: 60 }], false).hero;
  const stroke = stepHero(still(), [{ x: 0, y: 60 }], true).hero;
  expect(Math.abs(stroke.vx)).toBeCloseTo(
    HERO_SPEED_STROKE * HERO_SPEED_EASE,
    5,
  );
  expect(Math.abs(stroke.vx)).toBeGreaterThan(Math.abs(glide.vx));
});

test("描いた線の上を進む（折れ線の角で膨らまない）", () => {
  // 左へ 30px → 下へ 30px の L 字。角を過ぎたら x は角の位置から動かない
  const path = [
    { x: 50, y: 60 },
    { x: 50, y: 90 },
  ];
  let s = { hero: still(), path };
  let maxOvershoot = 0;
  for (let i = 0; i < 200; i++) {
    s = stepHero(s.hero, s.path, i % 2 === 0);
    maxOvershoot = Math.max(maxOvershoot, 50 - s.hero.x);
  }
  expect(maxOvershoot).toBeLessThan(0.0001);
});

test("線の終点に着いて止まる", () => {
  const { hero, path } = run(still(), [{ x: 60, y: 70 }], 400);
  expect(path.length).toBe(0);
  expect(hero.x).toBeCloseTo(60, 0);
  expect(hero.y).toBeCloseTo(70, 0);
  expect(Math.hypot(hero.vx, hero.vy)).toBeLessThan(0.001);
});

test("終点の手前で減速する（下限は HERO_ARRIVE_MIN_RATIO）", () => {
  const fast = { ...still(), vx: -HERO_SPEED_GLIDE };
  const far = stepHero(fast, [{ x: 0, y: 60 }], false).hero;
  const near = stepHero(fast, [{ x: 78, y: 60 }], false).hero;
  expect(Math.abs(near.vx)).toBeLessThan(Math.abs(far.vx));
  const floor = HERO_SPEED_GLIDE * HERO_ARRIVE_MIN_RATIO;
  expect(Math.abs(near.vx)).toBeGreaterThan(floor);
});

test("線を使い切ったら終点で止まる（行き過ぎない）", () => {
  const { hero } = run({ ...still(), x: 479 }, [{ x: 5, y: 60 }], 200);
  expect(hero.x).toBeCloseTo(5, 5);
  expect(hero.vx).toBe(0);
});

test("向きは x の移動方向で反転する", () => {
  const right = run(still(), [{ x: 200, y: 60 }], 30).hero;
  expect(right.facing).toBe(1);
  const left = run({ ...still(), facing: 1 }, [{ x: 0, y: 60 }], 30).hero;
  expect(left.facing).toBe(-1);
});

test("真上・真下への移動では向きを保つ", () => {
  const { hero } = run({ ...still(), facing: 1 }, [{ x: 80, y: 20 }], 30);
  expect(hero.facing).toBe(1);
});

test("x は torus で折り返す", () => {
  const { hero } = run({ ...still(), x: 479 }, [{ x: 5, y: 60 }], 60);
  expect(hero.x).toBeLessThan(6);
});

test("y は世界の上下端でクランプされる", () => {
  const down = run({ ...still(), y: 130 }, [{ x: 80, y: 159 }], 200).hero;
  expect(down.y).toBe(140);
  const up = run({ ...still(), y: 20 }, [{ x: 80, y: 0 }], 200).hero;
  expect(up.y).toBe(10);
});

test("入力の path を破壊しない（純粋関数）", () => {
  const input = [{ x: 82, y: 62 }];
  stepHero(still(), input, false);
  expect(input.length).toBe(1);
});

test("画面の上端・下端に描いた線でも最後まで進める", () => {
  const { hero, path } = run(
    still(),
    [
      { x: 80, y: 10 },
      { x: 100, y: 40 },
      { x: 100, y: 140 },
      { x: 120, y: 60 },
    ],
    1000,
  );
  expect(path.length).toBe(0);
  expect(hero.x).toBeCloseTo(120, 5);
  expect(hero.y).toBeCloseTo(60, 5);
});
