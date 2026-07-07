import { expect, test } from "bun:test";
import { VISIT_INTERVAL_MS } from "../data/roster-constants";
import { createInitialState } from "./create-initial-state";

test("主人公は (80, 60) で左向き・静止から始まる", () => {
  const state = createInitialState(() => 0.5);
  expect(state.hero).toEqual({ x: 80, y: 60, vx: 0, vy: 0, facing: -1 });
});

test("餌は 3 匹、y は 28〜120 の帯に湧く", () => {
  const state = createInitialState(() => 0.5);
  expect(state.baits.length).toBe(3);
  for (const bait of state.baits) {
    expect(bait.baseY).toBe(74); // 28 + 0.5 * 92
    expect(bait.y).toBe(74);
  }
});

test("満腹 0・住民 0・path 空・経過時間 0 から始まる", () => {
  const state = createInitialState(() => 0.5);
  expect(state.satiety).toBe(0);
  expect(state.residents).toEqual([]);
  expect(state.path).toEqual([]);
  expect(state.flashes).toEqual([]);
  expect(state.elapsedMs).toBe(0);
});

test("次回来訪チェックは VISIT_INTERVAL_MS（ゲーム内 5 分後）から始まる", () => {
  const state = createInitialState(() => 0.5);
  expect(state.nextVisitCheckMs).toBe(VISIT_INTERVAL_MS);
});
