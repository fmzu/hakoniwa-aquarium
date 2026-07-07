import { expect, test } from "bun:test";
import type { Resident, SpeciesId } from "../types";
import { pickDepartingIndex } from "./pick-departing-index";

function resident(
  species: SpeciesId,
  departing = false,
  arrivedAtMs = 0,
): Resident {
  return {
    species,
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs,
    departing,
  };
}

// elapsedMs=100000: 全員 arrivedAtMs=0 なので到着保護（ARRIVAL_PROTECT_MS=10000）は切れている

test("新生児と同じサイズ階級からランダムに選ぶ（全員 S・random=0.5 なら 8 体中 index 4）", () => {
  const residents = Array.from({ length: 8 }, () => resident("ramuneFish"));
  expect(pickDepartingIndex(residents, "S", 100000, () => 0.5)).toBe(4);
});

test("random=0 なら先頭、random=0.99 なら末尾を選ぶ", () => {
  const residents = Array.from({ length: 8 }, () => resident("ramuneFish"));
  expect(pickDepartingIndex(residents, "S", 100000, () => 0)).toBe(0);
  expect(pickDepartingIndex(residents, "S", 100000, () => 0.99)).toBe(7); // floor(0.99*8)
});

test("すでに退場予定の住民は候補から外す（元配列の添字を返す）", () => {
  // 候補は index 1, 2 の 2 体 → floor(0.5 * 2) = 1 → 元配列の index 2
  const residents = [
    resident("ramuneFish", true),
    resident("ramuneFish"),
    resident("ramuneFish"),
  ];
  expect(pickDepartingIndex(residents, "S", 100000, () => 0.5)).toBe(2);
});

test("退場予定でない住民が 0 体なら throw（満員ゲートの契約違反）", () => {
  const residents = [resident("ramuneFish", true), resident("taiyaki", true)];
  expect(() => pickDepartingIndex(residents, "S", 100000, () => 0.5)).toThrow(
    "退場予定でない住民が0体",
  );
  expect(() => pickDepartingIndex([], "S", 100000, () => 0.5)).toThrow();
});

test("同サイズ階級が不在なら退場予定でない全住民からランダム（フォールバック）", () => {
  // 現 3 種は全て "S" なので、新生児サイズ "L" を渡すと同階級ゼロ → 全体 3 体から floor(0.5*3)=1
  const residents = [
    resident("ramuneFish"),
    resident("strawberryJelly"),
    resident("taiyaki"),
  ];
  expect(pickDepartingIndex(residents, "L", 100000, () => 0.5)).toBe(1);
});

test("到着保護中（elapsedMs - arrivedAtMs < ARRIVAL_PROTECT_MS）の住民は選ばれない", () => {
  // index 0 は保護中（経過 9000ms < 10000）、index 1 は保護切れ（経過ちょうど 10000 は境界＝保護なし）
  // random=0 なら候補の先頭を選ぶので、保護が効いていなければ index 0 が返ってしまう
  const residents = [
    resident("ramuneFish", false, 1000),
    resident("ramuneFish", false, 0),
  ];
  expect(pickDepartingIndex(residents, "S", 10000, () => 0)).toBe(1);
});

test("全員が到着保護中なら保護なしの非 departing 全体にフォールバックして選ぶ", () => {
  // 満員時に必ず 1 体選べることを保護より優先する（departing は除いたまま）
  const residents = [
    resident("ramuneFish", true, 5000),
    resident("ramuneFish", false, 5000),
    resident("ramuneFish", false, 5000),
  ];
  expect(pickDepartingIndex(residents, "S", 10000, () => 0.5)).toBe(2); // floor(0.5*2) → 元配列 index 2
});
