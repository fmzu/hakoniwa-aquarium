import { expect, test } from "bun:test";
import { SPECIES_IDS } from "./species-ids";
import { SPECIES_SIZE } from "./species-size";

test("全種にサイズ階級が定義されている（キーが SPECIES_IDS と一致）", () => {
  expect(Object.keys(SPECIES_SIZE).sort()).toEqual([...SPECIES_IDS].sort());
});

test("現在の 3 種はすべて S（新種追加時はこのピンを更新する）", () => {
  for (const id of SPECIES_IDS) {
    expect(SPECIES_SIZE[id]).toBe("S");
  }
});
