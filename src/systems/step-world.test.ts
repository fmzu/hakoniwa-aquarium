import { expect, test } from "bun:test";
import { TICK_MS } from "../data/world-constants";
import type { Bait, GameState, Resident } from "../types";
import { createInitialState } from "./create-initial-state";
import { stepWorld } from "./step-world";

const fixedRandom = () => 0.5;

/**
 * 主人公（x=100, y=60, 左向き）の頭は約 (88, 54)。
 * その真横に餌を置き、1 tick 後に捕食が成立する状態を作る。
 * phase = −TICK_MS×0.002 にすると 1 tick 後の揺れ位相が 0 になり y = baseY のまま
 */
function stateWithBaitAtHead(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialState(fixedRandom);
  const baitAtHead: Bait = {
    x: 88,
    baseY: 54,
    y: 54,
    dir: 1,
    phase: -(TICK_MS * 0.002),
  };
  return {
    ...base,
    hero: { x: 100, y: 60, vx: 0, vy: 0, facing: -1 },
    baits: [baitAtHead],
    ...overrides,
  };
}

test("経過時間が TICK_MS だけ進む", () => {
  const next = stepWorld(createInitialState(fixedRandom), fixedRandom);
  expect(next.elapsedMs).toBeCloseTo(TICK_MS, 5);
});

test("頭の近くの餌を食べると満腹 +1 し、餌は反対側にリスポーンする", () => {
  const next = stepWorld(stateWithBaitAtHead(), fixedRandom);
  expect(next.satiety).toBe(1);
  expect(next.baits[0].x).toBeCloseTo(340.01152, 3); // mod(hero.x + 240, 480)
  expect(next.baits[0].baseY).toBe(74); // 28 + 0.5 * 92
  expect(next.flashes.length).toBe(1);
  expect(next.flashes[0].small).toBe(true);
});

test("満腹 5 で誕生し、1 体目はラムネ魚", () => {
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom);
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(1);
  expect(next.residents[0].species).toBe("ramuneFish");
  expect(next.residents[0].baseY).toBe(60); // clamp(hero.y, 24, 118)
  expect(next.flashes.some((f) => !f.small)).toBe(true);
});

test("誕生順は固定テーブルをループする（2 体目はストロベリークラゲ）", () => {
  const existing: Resident = {
    species: "ramuneFish",
    x: 300,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
  };
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: [existing] }),
    fixedRandom,
  );
  expect(next.residents.length).toBe(2);
  expect(next.residents[1].species).toBe("strawberryJelly");
});

test("住民 8 体で満員のときは満腹がリセットされるだけで誕生しない", () => {
  const full: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
  }));
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: full }),
    fixedRandom,
  );
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(8);
});

test("古いフラッシュは 600ms で消える", () => {
  const state: GameState = {
    ...createInitialState(fixedRandom),
    elapsedMs: 1000,
    flashes: [
      { x: 10, y: 10, bornAt: 300, small: true }, // 経過 700ms → 消える
      { x: 20, y: 20, bornAt: 900, small: true }, // 経過 100ms → 残る
    ],
  };
  const next = stepWorld(state, fixedRandom);
  expect(next.flashes.length).toBe(1);
  expect(next.flashes[0].x).toBe(20);
});
