import { expect, test } from "bun:test";
import type { Zukan, ZukanEntry } from "../types";
import { nextBirthSpecies } from "./next-birth-species";

const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-27T00:00:00.000Z",
  birthCount: 1,
};

test("未発見が残っているとき、選ばれるのは必ず未発見の種", () => {
  // ramuneFish のみ発見済み → 未発見は strawberryJelly, taiyaki
  const zukan: Zukan = { ramuneFish: entry };
  for (const r of [0, 0.4, 0.6, 0.99]) {
    const picked = nextBirthSpecies(zukan, () => r);
    expect(picked).not.toBe("ramuneFish");
    expect(["strawberryJelly", "taiyaki"]).toContain(picked);
  }
});

test("全種発見済みのときは全種のいずれかが選ばれる", () => {
  const zukan: Zukan = {
    ramuneFish: entry,
    strawberryJelly: entry,
    taiyaki: entry,
  };
  expect(nextBirthSpecies(zukan, () => 0)).toBe("ramuneFish");
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe("taiyaki");
});

test("同じ乱数値なら同じ種（決定性）", () => {
  const zukan: Zukan = {}; // 全種未発見 → プールは [ramuneFish, strawberryJelly, taiyaki]
  expect(nextBirthSpecies(zukan, () => 0)).toBe("ramuneFish");
  expect(nextBirthSpecies(zukan, () => 0.5)).toBe("strawberryJelly");
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe("taiyaki");
});

test("未発見が1種だけならどんな乱数でもその種が確実に選ばれる", () => {
  // ramuneFish と taiyaki が発見済み → 未発見は strawberryJelly のみ
  const zukan: Zukan = { ramuneFish: entry, taiyaki: entry };
  expect(nextBirthSpecies(zukan, () => 0)).toBe("strawberryJelly");
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe("strawberryJelly");
});
