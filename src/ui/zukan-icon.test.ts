import { expect, test } from "bun:test";
import { zukanIcon } from "./zukan-icon";

test("zukanIcon: 全フレームが width×height と一致する", () => {
  for (const frame of zukanIcon.frames) {
    expect(frame.length).toBe(zukanIcon.height);
    for (const row of frame) {
      expect(row.length).toBe(zukanIcon.width);
    }
  }
});

test("zukanIcon: 使用文字がすべて自分のパレットに定義されている", () => {
  for (const frame of zukanIcon.frames) {
    for (const row of frame) {
      for (const ch of row) {
        if (ch !== ".") {
          expect(zukanIcon.palette[ch]).toBeDefined();
        }
      }
    }
  }
});

test("zukanIcon: UI アイコンなので 1 フレーム・アニメなし", () => {
  expect(zukanIcon.frames.length).toBe(1);
  expect(zukanIcon.frameIntervalMs).toBe(0);
});
