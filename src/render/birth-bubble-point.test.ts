import { expect, test } from "bun:test";
import {
  BIRTH_FX_BUBBLE_DELAY_MS,
  BIRTH_FX_RING_END_MS,
} from "../data/birth-fx-constants";
import { birthBubblePoint } from "./birth-bubble-point";

test("index 0 は遅延なしで出現。開始位置は中心の 8px 下", () => {
  // age=0: baseDx = ((0×29)%13)−6 = −6, sway = round(sin(0)×1.5) = 0
  // dy = 8 − round(0×0.02) = 8, size = 0%3===0 → 2
  expect(birthBubblePoint(0, 0)).toEqual({ dx: -6, dy: 8, size: 2 });
});

test("index 0 は 500ms で 10px 上昇している", () => {
  // age=500: sway = round(sin(500×0.006+0)×1.5) = round(sin(3)×1.5) = round(0.212) = 0
  // dy = 8 − round(500×0.02) = 8 − 10 = −2
  expect(birthBubblePoint(0, 500)).toEqual({ dx: -6, dy: -2, size: 2 });
});

test("index 1 は 90ms 遅延して出現し 1px サイズ", () => {
  // age = 500−90 = 410: baseDx = (29%13)−6 = −3
  // sway = round(sin(410×0.006+1)×1.5) = round(sin(3.46)×1.5) = round(−0.471) = 0
  // dy = 8 − round(410×0.02) = 8 − round(8.2) = 0, size = 1%3!==0 → 1
  expect(birthBubblePoint(1, 500)).toEqual({ dx: -3, dy: 0, size: 1 });
});

test("出現前（経過 < index×90ms）は null", () => {
  expect(birthBubblePoint(2, 100)).toBeNull();
});

test("index 3 の 900ms 時点（決定性の固定値検証）", () => {
  // age = 900−270 = 630: baseDx = (87%13)−6 = 3
  // sway = round(sin(630×0.006+3)×1.5) = round(sin(6.78)×1.5) = round(0.713) = 1
  // dy = 8 − round(630×0.02) = 8 − 13 = −5, size = 3%3===0 → 2
  expect(birthBubblePoint(3, 900)).toEqual({ dx: 4, dy: -5, size: 2 });
});

test("同じ入力は常に同じ出力（決定的）", () => {
  expect(birthBubblePoint(5, 777)).toEqual(birthBubblePoint(5, 777));
});

test("泡は時間とともに単調上昇する（late.dy < early.dy）", () => {
  for (let index = 0; index < 8; index++) {
    for (
      let ms = index * BIRTH_FX_BUBBLE_DELAY_MS;
      ms + 200 <= BIRTH_FX_RING_END_MS;
      ms += 200
    ) {
      const early = birthBubblePoint(index, ms);
      const late = birthBubblePoint(index, ms + 200);
      if (early === null || late === null) throw new Error("出現済みのはず");
      expect(late.dy).toBeLessThan(early.dy);
    }
  }
});
