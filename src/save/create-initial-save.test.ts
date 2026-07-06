import { expect, test } from "bun:test";
import { createInitialSave } from "./create-initial-save";

test("version 1・図鑑空・満腹 0 を返す", () => {
  expect(createInitialSave()).toEqual({ version: 1, zukan: {}, satiety: 0 });
});

test("呼ぶたびに独立したオブジェクトを返す（共有ミュータブル状態を作らない）", () => {
  const a = createInitialSave();
  const b = createInitialSave();
  expect(a).not.toBe(b);
  expect(a.zukan).not.toBe(b.zukan);
});
