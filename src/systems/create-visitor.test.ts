import { expect, test } from "bun:test";
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { createVisitor } from "./create-visitor";
import { detectBornResident } from "./detect-born-resident";
import { isBirthFxActive } from "./is-birth-fx-active";

/** 指定した値を順に返し、尽きたら 0.5 を返す乱数（テスト決定性） */
function sequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++] ?? 0.5;
}

// heroX=100 → camX = mod(100 - 64, 480) = 36。
// 乱数の消費順: 種 → 左右 → baseY → phase

test("右外湧き: 視界の右外（camX + VIEW_WIDTH + 16）に湧き、左向きに泳ぐ", () => {
  const visitor = createVisitor(
    ["ramuneFish", "taiyaki"],
    100,
    300000,
    sequenceRandom([0.5, 0.6, 0.5, 0.5]),
  );
  expect(visitor.species).toBe("taiyaki"); // floor(0.5 * 2) = 1
  expect(visitor.x).toBe(180); // mod(36 + 128 + 16, 480)
  expect(visitor.dir).toBe(-1); // 視界へ向かう
  expect(visitor.baseY).toBe(71); // 24 + 0.5 * 94
  expect(visitor.y).toBe(71);
  expect(visitor.phase).toBe(3); // 0.5 * 6
  expect(visitor.arrivedAtMs).toBe(300000);
  expect(visitor.departing).toBe(false);
});

test("左外湧き: 視界の左外（camX - 16）に湧き、右向きに泳ぐ", () => {
  const visitor = createVisitor(
    ["ramuneFish"],
    100,
    300000,
    sequenceRandom([0, 0]),
  );
  expect(visitor.species).toBe("ramuneFish");
  expect(visitor.x).toBe(20); // mod(36 - 16, 480)
  expect(visitor.dir).toBe(1);
});

test("torus 境界をまたぐ湧き位置は折り返す", () => {
  // heroX=70 → camX = 6 → 左外 = mod(6 - 16, 480) = 470
  const visitor = createVisitor(
    ["ramuneFish"],
    70,
    300000,
    sequenceRandom([0, 0]),
  );
  expect(visitor.x).toBe(470);
});

test("来訪者は誕生演出も図鑑更新も発火させない（bornAtMs が負値）", () => {
  const visitor = createVisitor(
    ["ramuneFish"],
    100,
    300000,
    sequenceRandom([0, 0]),
  );
  expect(visitor.bornAtMs).toBe(-BIRTH_FX_TOTAL_MS);
  // 誕生演出: 演出窓は 0 <= age < BIRTH_FX_TOTAL_MS。age = elapsedMs + 2500 は
  // elapsedMs=0 でもちょうど窓の外（境界含む）
  expect(isBirthFxActive(visitor.bornAtMs, 300000)).toBe(false);
  expect(isBirthFxActive(visitor.bornAtMs, 0)).toBe(false);
  // 図鑑更新: bornAtMs === elapsedMs は elapsedMs >= 0 で成立しない
  expect(detectBornResident([visitor], 300000)).toBeUndefined();
});
