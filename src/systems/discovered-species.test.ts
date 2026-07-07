import { expect, test } from "bun:test";
import type { ZukanEntry } from "../types";
import { discoveredSpecies } from "./discovered-species";

const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
  birthCount: 1,
};

test("発見済みの種だけを SPECIES_IDS 順で返す", () => {
  expect(discoveredSpecies({ taiyaki: entry, ramuneFish: entry })).toEqual([
    "ramuneFish",
    "taiyaki",
  ]);
});

test("空の図鑑なら空配列", () => {
  expect(discoveredSpecies({})).toEqual([]);
});

test("毎回新しい配列を返す（呼び出し側で splice しても安全）", () => {
  const zukan = { ramuneFish: entry };
  discoveredSpecies(zukan).splice(0, 1);
  expect(discoveredSpecies(zukan)).toEqual(["ramuneFish"]);
});
