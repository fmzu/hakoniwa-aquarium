import { expect, test } from "bun:test";
import { SPECIES_IDS } from "../data/species-ids";
import type { Zukan, ZukanEntry } from "../types";
import { nextBirthSpecies } from "./next-birth-species";

const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-27T00:00:00.000Z",
  birthCount: 1,
};

const allDiscovered: Zukan = Object.fromEntries(
  SPECIES_IDS.map((id) => [id, entry]),
);

test("未発見が残っているとき、選ばれるのは必ず未発見の種", () => {
  // ramuneFish のみ発見済み → 未発見はそれ以外の全種
  const zukan: Zukan = { ramuneFish: entry };
  for (const r of [0, 0.4, 0.6, 0.99]) {
    const picked = nextBirthSpecies(zukan, () => r);
    expect(picked).not.toBe("ramuneFish");
    expect(SPECIES_IDS).toContain(picked);
  }
});

test("全種発見済みのときは全種のいずれかが選ばれる", () => {
  expect(nextBirthSpecies(allDiscovered, () => 0)).toBe(SPECIES_IDS[0]);
  expect(nextBirthSpecies(allDiscovered, () => 0.99)).toBe(
    SPECIES_IDS[SPECIES_IDS.length - 1],
  );
});

test("同じ乱数値なら同じ種（決定性）", () => {
  const zukan: Zukan = {}; // 全種未発見 → プールは SPECIES_IDS 全体
  expect(nextBirthSpecies(zukan, () => 0)).toBe(SPECIES_IDS[0]);
  expect(nextBirthSpecies(zukan, () => 0.5)).toBe(
    SPECIES_IDS[Math.floor(0.5 * SPECIES_IDS.length)],
  );
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe(
    SPECIES_IDS[SPECIES_IDS.length - 1],
  );
});

test("未発見が1種だけならどんな乱数でもその種が確実に選ばれる", () => {
  // strawberryJelly 以外を全発見 → 未発見は strawberryJelly のみ
  const { strawberryJelly: _omit, ...zukan } = allDiscovered;
  expect(nextBirthSpecies(zukan, () => 0)).toBe("strawberryJelly");
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe("strawberryJelly");
});
