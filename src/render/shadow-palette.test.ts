import { expect, test } from "bun:test";
import { BIRTH_FX_SILHOUETTE_COLOR } from "../data/birth-fx-constants";
import { shadowPalette } from "./shadow-palette";

test("全キーを保持したまま全色が影色になる", () => {
  const palette = { H: "#EAF8FF", L: "#C2E7F8", O: "#22333D" };
  const shadow = shadowPalette(palette);
  expect(Object.keys(shadow)).toEqual(["H", "L", "O"]);
  for (const color of Object.values(shadow)) {
    expect(color).toBe(BIRTH_FX_SILHOUETTE_COLOR); // #0F1E27
  }
});

test("元のパレットは破壊しない", () => {
  const palette = { H: "#EAF8FF" };
  shadowPalette(palette);
  expect(palette.H).toBe("#EAF8FF");
});

test("空パレットは空のまま", () => {
  expect(shadowPalette({})).toEqual({});
});
