import { expect, test } from "bun:test";
import { isBirthFxActive } from "./is-birth-fx-active";

test("誕生直後は演出中", () => {
  expect(isBirthFxActive(0, 0)).toBe(true);
});

test("2499ms 経過はまだ演出中", () => {
  expect(isBirthFxActive(0, 2499)).toBe(true);
});

test("2500ms 経過で演出終了", () => {
  expect(isBirthFxActive(0, 2500)).toBe(false);
});

test("bornAtMs が十分過去（初期配置相当）なら演出しない", () => {
  expect(isBirthFxActive(-10000, 0)).toBe(false);
});

test("途中誕生でも bornAtMs 基準で判定される", () => {
  expect(isBirthFxActive(1000, 2000)).toBe(true);
  expect(isBirthFxActive(1000, 3500)).toBe(false);
});

test("未来生まれ（bornAtMs > elapsedMs）は false", () => {
  expect(isBirthFxActive(1000, 500)).toBe(false);
});
