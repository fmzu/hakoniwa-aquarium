import { expect, test } from "bun:test";
import { mod } from "./mod";

test("正の値はそのまま剰余", () => {
  expect(mod(5, 480)).toBe(5);
});

test("負の値は正の範囲に折り返す（床除算）", () => {
  expect(mod(-5, 480)).toBe(475);
});

test("幅を超えた値は折り返す", () => {
  expect(mod(485, 480)).toBe(5);
});

test("0 はそのまま", () => {
  expect(mod(0, 480)).toBe(0);
});
