import { expect, test } from "bun:test";
import { SPECIES_IDS } from "../data/species-ids";
import type { Zukan, ZukanEntry } from "../types";
import { satietyMax } from "./satiety-max";

const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-28T00:00:00.000Z",
  birthCount: 1,
};

/** 先頭 n 種を発見済みにした図鑑を作る（発見数がちょうど n になる） */
function discoverFirst(n: number): Zukan {
  const zukan: Zukan = {};
  for (const id of SPECIES_IDS.slice(0, n)) zukan[id] = entry;
  return zukan;
}

test("発見 0 種ならベース値 5", () => {
  expect(satietyMax({})).toBe(5);
  expect(satietyMax(discoverFirst(0))).toBe(5);
});

test("発見 1 種でも 5（floor(1/2)=0）", () => {
  expect(satietyMax(discoverFirst(1))).toBe(5);
});

test("発見 2 種で 6（floor(2/2)=1）", () => {
  expect(satietyMax(discoverFirst(2))).toBe(6);
});

test("発見 3 種でも 6（キャップにより min(3,全種数-1) の発見数で計算）", () => {
  expect(satietyMax(discoverFirst(3))).toBe(6);
});

test("発見数だけに依存し、どの種を発見したかには依存しない", () => {
  const a: Zukan = { ramuneFish: entry, taiyaki: entry };
  const b: Zukan = { strawberryJelly: entry, taiyaki: entry };
  expect(satietyMax(a)).toBe(satietyMax(b));
  expect(satietyMax(a)).toBe(6);
});

test("全種発見後も値は増えない（発見数を SPECIES_IDS.length-1 でキャップ）", () => {
  // 全発見と「全種-1 発見」で同じ値になることでキャップを検証する
  expect(satietyMax(discoverFirst(SPECIES_IDS.length))).toBe(
    satietyMax(discoverFirst(SPECIES_IDS.length - 1)),
  );
});
