import { expect, test } from "bun:test";
import { createFixedTimestep } from "./create-fixed-timestep";

test("蓄積した経過時間ぶんだけ tick する", () => {
  let ticks = 0;
  const advance = createFixedTimestep(16, 5, () => {
    ticks += 1;
  });
  advance(0); // 初回は基準時刻の記録のみ
  expect(ticks).toBe(0);
  advance(16); // 16ms 経過 → 1 tick
  expect(ticks).toBe(1);
  advance(48); // さらに 32ms 経過 → 2 tick
  expect(ticks).toBe(3);
});

test("端数は次フレームに持ち越す", () => {
  let ticks = 0;
  const advance = createFixedTimestep(16, 5, () => {
    ticks += 1;
  });
  advance(0);
  advance(24); // 1 tick 消化、8ms 持ち越し
  expect(ticks).toBe(1);
  advance(32); // 持ち越し 8 + 8 = 16ms → 1 tick
  expect(ticks).toBe(2);
});

test("1 フレームの tick 数は上限で頭打ちになり、残りは捨てる", () => {
  let ticks = 0;
  const advance = createFixedTimestep(16, 5, () => {
    ticks += 1;
  });
  advance(0);
  advance(10000); // タブ復帰などの巨大 dt
  expect(ticks).toBe(5);
  advance(10016); // 捨てた蓄積が残っていないこと
  expect(ticks).toBe(6);
});
