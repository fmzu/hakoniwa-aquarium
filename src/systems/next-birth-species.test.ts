import { expect, test } from "bun:test";
import { nextBirthSpecies } from "./next-birth-species";

test("1 体目はラムネ魚", () => {
  expect(nextBirthSpecies(0)).toBe("ramuneFish");
});

test("2 体目はストロベリークラゲ", () => {
  expect(nextBirthSpecies(1)).toBe("strawberryJelly");
});

test("3 体目はたい焼き", () => {
  expect(nextBirthSpecies(2)).toBe("taiyaki");
});

test("テーブルを一巡したらループする", () => {
  expect(nextBirthSpecies(3)).toBe("ramuneFish");
  expect(nextBirthSpecies(4)).toBe("strawberryJelly");
  expect(nextBirthSpecies(5)).toBe("taiyaki");
});
