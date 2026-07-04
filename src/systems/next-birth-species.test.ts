import { expect, test } from "bun:test";
import { nextBirthSpecies } from "./next-birth-species";

test("1 体目はラムネ魚", () => {
  expect(nextBirthSpecies(0)).toBe("ramuneFish");
});

test("2 体目はストロベリークラゲ", () => {
  expect(nextBirthSpecies(1)).toBe("strawberryJelly");
});

test("テーブルを一巡したらループする", () => {
  expect(nextBirthSpecies(2)).toBe("ramuneFish");
  expect(nextBirthSpecies(5)).toBe("strawberryJelly");
});
