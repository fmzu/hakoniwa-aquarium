import { expect, test } from "bun:test";
import { birthFxPhase } from "./birth-fx-phase";

test("開始時: 暗転 0・泡あり・新入り非表示", () => {
  const fx = birthFxPhase(0);
  expect(fx.active).toBe(true);
  expect(fx.darkenAlpha).toBe(0);
  expect(fx.bubbleAlpha).toBe(1);
  expect(fx.residentVisible).toBe(false);
  expect(fx.dyeProgress).toBeNull();
  expect(fx.ringProgress).toBeNull();
});

test("150ms: 暗転フェードイン半分（0.5 × 0.55 = 0.275）", () => {
  expect(birthFxPhase(150).darkenAlpha).toBeCloseTo(0.275, 5);
});

test("700ms: 新入り（シルエット）が出現、染まりはまだ", () => {
  const fx = birthFxPhase(700);
  expect(fx.residentVisible).toBe(true);
  expect(fx.dyeProgress).toBeNull();
  expect(fx.darkenAlpha).toBeCloseTo(0.55, 5);
});

test("1000ms: 染まり進行 (1000-900)/800 = 0.125", () => {
  expect(birthFxPhase(1000).dyeProgress).toBeCloseTo(0.125, 5);
});

test("2000ms: リング 0.5・泡フェードアウト 0.5・染まり完了", () => {
  const fx = birthFxPhase(2000);
  expect(fx.ringProgress).toBeCloseTo(0.5, 5);
  expect(fx.bubbleAlpha).toBeCloseTo(0.5, 5);
  expect(fx.dyeProgress).toBe(1);
});

test("2400ms: 暗転フェードアウト半分・リング終了・泡消滅", () => {
  const fx = birthFxPhase(2400);
  expect(fx.darkenAlpha).toBeCloseTo(0.275, 5);
  expect(fx.ringProgress).toBeNull();
  expect(fx.bubbleAlpha).toBe(0);
  expect(fx.dyeProgress).toBe(1);
});

test("2500ms 以降と負の時間は非アクティブ", () => {
  expect(birthFxPhase(2500).active).toBe(false);
  expect(birthFxPhase(-1).active).toBe(false);
});
