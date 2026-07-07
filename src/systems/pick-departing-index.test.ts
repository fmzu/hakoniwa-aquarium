import { expect, test } from "bun:test";
import type { Resident, SpeciesId } from "../types";
import { pickDepartingIndex } from "./pick-departing-index";

function resident(species: SpeciesId, departing = false): Resident {
  return {
    species,
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing,
  };
}

test("新生児と同じサイズ階級からランダムに選ぶ（全員 S・random=0.5 なら 8 体中 index 4）", () => {
  const residents = Array.from({ length: 8 }, () => resident("ramuneFish"));
  expect(pickDepartingIndex(residents, "S", () => 0.5)).toBe(4);
});

test("random=0 なら先頭、random=0.99 なら末尾を選ぶ", () => {
  const residents = Array.from({ length: 8 }, () => resident("ramuneFish"));
  expect(pickDepartingIndex(residents, "S", () => 0)).toBe(0);
  expect(pickDepartingIndex(residents, "S", () => 0.99)).toBe(7); // floor(0.99*8)
});

test("すでに退場予定の住民は候補から外す（元配列の添字を返す）", () => {
  // 候補は index 1, 2 の 2 体 → floor(0.5 * 2) = 1 → 元配列の index 2
  const residents = [
    resident("ramuneFish", true),
    resident("ramuneFish"),
    resident("ramuneFish"),
  ];
  expect(pickDepartingIndex(residents, "S", () => 0.5)).toBe(2);
});

test("同サイズ階級が不在なら退場予定でない全住民からランダム（フォールバック）", () => {
  // 現 3 種は全て "S" なので、新生児サイズ "L" を渡すと同階級ゼロ → 全体 3 体から floor(0.5*3)=1
  const residents = [
    resident("ramuneFish"),
    resident("strawberryJelly"),
    resident("taiyaki"),
  ];
  expect(pickDepartingIndex(residents, "L", () => 0.5)).toBe(1);
});
