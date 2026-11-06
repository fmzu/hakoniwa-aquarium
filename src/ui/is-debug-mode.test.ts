import { expect, test } from "bun:test";
import { isDebugMode } from "./is-debug-mode";

test("?debug があれば true", () => {
  expect(isDebugMode("?debug")).toBe(true);
  expect(isDebugMode("?foo=1&debug")).toBe(true);
});

test("なければ false", () => {
  expect(isDebugMode("")).toBe(false);
  expect(isDebugMode("?debugger")).toBe(false);
});
