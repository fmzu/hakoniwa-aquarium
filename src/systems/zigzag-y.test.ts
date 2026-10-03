import { expect, test } from "bun:test";
import { zigzagY } from "./zigzag-y";

const frequency = 0.001;
const period = (2 * Math.PI) / frequency;

test("サイクル開始（t=0）は baseY", () => {
  expect(zigzagY(100, 5, frequency, 0, 0)).toBeCloseTo(100, 5);
});

test("推進フェーズ終わり（t=riseEnd）は最高点 baseY - amplitude", () => {
  const riseEnd = 0.35;
  expect(zigzagY(100, 5, frequency, 0, period * riseEnd)).toBeCloseTo(
    100 - 5,
    5,
  );
});

test("サイクル終わり（t=1）は baseY に戻る", () => {
  expect(zigzagY(100, 5, frequency, 0, period)).toBeCloseTo(100, 5);
});

test("推進フェーズ中は単調に上昇する（y が単調減少）", () => {
  const riseEnd = 0.35;
  const samples = [0, 0.1, 0.2, 0.3, riseEnd].map((t) =>
    zigzagY(100, 5, frequency, 0, period * t),
  );
  for (let i = 1; i < samples.length; i++) {
    expect(samples[i]).toBeLessThanOrEqual(samples[i - 1]);
  }
});

test("沈降フェーズ中は単調に下降する（y が単調増加）", () => {
  const samples = [0.35, 0.5, 0.7, 0.9, 1.0].map((t) =>
    zigzagY(100, 5, frequency, 0, period * t),
  );
  for (let i = 1; i < samples.length; i++) {
    expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
  }
});

test("phase によって位相がずれる", () => {
  const withPhase = zigzagY(100, 5, frequency, Math.PI, 0);
  const withoutPhase = zigzagY(100, 5, frequency, 0, period * 0.5);
  expect(withPhase).toBeCloseTo(withoutPhase, 5);
});
