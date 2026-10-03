import { expect, test } from "bun:test";
import { isZigzagRising } from "./is-zigzag-rising";

const frequency = 0.001;
const period = (2 * Math.PI) / frequency;

test("t=0（サイクル開始）は推進フェーズ", () => {
  expect(isZigzagRising(frequency, 0, 0)).toBe(true);
});

test("t=0.34（riseEnd 直前）は推進フェーズ", () => {
  expect(isZigzagRising(frequency, 0, period * 0.34)).toBe(true);
});

test("t=0.35（riseEnd）は沈降フェーズ", () => {
  expect(isZigzagRising(frequency, 0, period * 0.35)).toBe(false);
});

test("t=0.9（沈降フェーズ中）は沈降フェーズ", () => {
  expect(isZigzagRising(frequency, 0, period * 0.9)).toBe(false);
});

test("phase によって位相がずれても判定は一貫する", () => {
  expect(isZigzagRising(frequency, Math.PI, 0)).toBe(
    isZigzagRising(frequency, 0, period * 0.5),
  );
});
