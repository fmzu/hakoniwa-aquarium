import { expect, test } from "bun:test";
import { lerpColor } from "./lerp-color";

test("t=0 で始点の色", () => {
  expect(lerpColor([168, 221, 224], [44, 93, 116], 0)).toBe("rgb(168,221,224)");
});

test("t=1 で終点の色", () => {
  expect(lerpColor([168, 221, 224], [44, 93, 116], 1)).toBe("rgb(44,93,116)");
});

test("中間は四捨五入した整数になる", () => {
  expect(lerpColor([0, 0, 0], [255, 255, 255], 0.5)).toBe("rgb(128,128,128)");
});
