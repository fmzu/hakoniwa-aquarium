import { expect, test } from "bun:test";
import { isResidentFlipped } from "./is-resident-flipped";

test("右向きのラムネ魚は鏡像反転する", () => {
  expect(isResidentFlipped({ species: "ramuneFish", dir: 1 })).toBe(true);
});

test("左向きのラムネ魚は反転しない（原画の向き）", () => {
  expect(isResidentFlipped({ species: "ramuneFish", dir: -1 })).toBe(false);
});

test("クラゲは左右対称なので向きに関わらず反転しない", () => {
  expect(isResidentFlipped({ species: "strawberryJelly", dir: 1 })).toBe(false);
  expect(isResidentFlipped({ species: "strawberryJelly", dir: -1 })).toBe(
    false,
  );
});
