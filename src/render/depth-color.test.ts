import { expect, test } from "bun:test";
import { depthColor } from "./depth-color";

test("y=0 は浅瀬色 #A8DDE0", () => {
  expect(depthColor(0)).toBe("rgb(168,221,224)");
});

test("y=80（中間深度）は中層色 #2C5D74", () => {
  expect(depthColor(80)).toBe("rgb(44,93,116)");
});

test("y=160（最深）は深海色 #1B3A4B", () => {
  expect(depthColor(160)).toBe("rgb(27,58,75)");
});

test("範囲外の y はクランプされる", () => {
  expect(depthColor(-10)).toBe("rgb(168,221,224)");
  expect(depthColor(999)).toBe("rgb(27,58,75)");
});
