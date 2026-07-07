import { expect, test } from "bun:test";
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { SPECIES_MOTION } from "../data/species-motion";
import { BAIT_SPEED, TICK_MS } from "../data/world-constants";
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
  expect(next.baits[0].x).toBeCloseTo(340.00768, 3); // mod(hero.x + 240, 480)
  expect(next.baits[0].baseY).toBe(74); // 28 + 0.5 * 92
  expect(next.flashes.length).toBe(1);
});

test("満腹 5 で誕生し、1 体目はラムネ魚", () => {
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom);
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(1);
  expect(next.residents[0].species).toBe("ramuneFish");
  expect(next.residents[0].baseY).toBe(60); // clamp(hero.y, 24, 118)
  // 大フラッシュは廃止。捕食リング 1 個だけが残る
  expect(next.flashes.length).toBe(1);
});

test("誕生した住民は bornAtMs を持ち、演出明けに y=baseY となる位相を持つ", () => {
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom);
  const born = next.residents[0];
  expect(born.bornAtMs).toBeCloseTo(TICK_MS, 5);
  // phase = -(bornAtMs + BIRTH_FX_TOTAL_MS) * bobFrequency なので sin 項は厳密に 0
  const freq = SPECIES_MOTION[born.species].bobFrequency;
  expect(
    Math.sin((born.bornAtMs + BIRTH_FX_TOTAL_MS) * freq + born.phase),
  ).toBeCloseTo(0, 5);
  expect(born.arrivedAtMs).toBe(born.bornAtMs); // 誕生＝到着
  expect(born.departing).toBe(false);
});

test("誕生順は固定テーブルをループする（2 体目はストロベリークラゲ）", () => {
  const existing: Resident = {
    species: "ramuneFish",
    x: 300,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  };
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: [existing] }),
    fixedRandom,
  );
  expect(next.residents.length).toBe(2);
  expect(next.residents[1].species).toBe("strawberryJelly");
});

test("満腹 4 で同 tick に 2 匹捕食すると 1 体誕生し、超過分 1 が繰り越される", () => {
  // 頭の真横に同一条件の餌を 2 つ置き、同 tick に両方捕食させる（4+2=6）
  const secondBait: Bait = {
    x: 88,
    baseY: 54,
    y: 54,
    dir: 1,
    phase: -(TICK_MS * 0.002),
  };
  const base = stateWithBaitAtHead({ satiety: 4 });
  const next = stepWorld(
    { ...base, baits: [...base.baits, secondBait] },
    fixedRandom,
  );
  expect(next.residents.length).toBe(1);
  expect(next.satiety).toBe(1); // 6 - SATIETY_MAX。切り捨てず繰り越す
});

test("満員で満腹 4 + 同 tick 2 匹捕食でも誕生し、超過分 1 は繰り越される", () => {
  const full: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  }));
  const secondBait: Bait = {
    x: 88,
    baseY: 54,
    y: 54,
    dir: 1,
    phase: -(TICK_MS * 0.002),
  };
  const base = stateWithBaitAtHead({ satiety: 4, residents: full });
  const next = stepWorld(
    { ...base, baits: [...base.baits, secondBait] },
    fixedRandom,
  );
  expect(next.residents.length).toBe(9); // 押し出し誕生
  expect(next.satiety).toBe(1); // 6 - SATIETY_MAX。繰り越しは満員でも同じ
});

test("満員でも誕生し、同サイズ階級からランダムに 1 体が退場予定になる（押し出し）", () => {
  const full: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  }));
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: full }),
    fixedRandom,
  );
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(9); // 一時的に 9 体を許容
  // 新生児: nextBirthSpecies(8) = BIRTH_TABLE[8 % 3 = 2] = taiyaki（末尾に追加）
  const born = next.residents[8];
  expect(born.species).toBe("taiyaki");
  expect(born.bornAtMs).toBeCloseTo(TICK_MS, 5);
  expect(born.departing).toBe(false);
  // 押し出し: 全員 "S" = 新生児と同階級。乱数消費は 餌リスポーン baseY →
  // 押し出し選定 → 新生児 dir の順なので floor(0.5 * 8) = 4 が退場予定になる
  expect(next.residents.filter((r) => r.departing).length).toBe(1);
  expect(next.residents[4].departing).toBe(true);
  // 押し出された住民は消えず泳ぎ続ける（消えるのは視界外に出た瞬間）
  expect(next.residents[4].x).toBeCloseTo(280.25, 5); // 200 + 4*20 + speed 0.25
});

test("退場予定は定員に数えない（8 体中 1 体退場予定なら押し出しなしで誕生する）", () => {
  // 退場予定の 1 体は視界内（x=60）に置き、この tick で消えないようにする
  const residents: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: i === 0 ? 60 : 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: i === 0,
  }));
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents }),
    fixedRandom,
  );
  // 実効 7 体 < RESIDENT_MAX なので通常誕生（押し出しなし）
  expect(next.residents.length).toBe(9);
  expect(next.residents.filter((r) => r.departing).length).toBe(1); // 元の 1 体のまま
  expect(next.residents[8].bornAtMs).toBeCloseTo(TICK_MS, 5);
});

test("退場予定の住民は視界外に出た瞬間に消え、視界内なら泳ぎ続ける", () => {
  // hero は水流で x=100.00768 に進む → camX = 36.00768。
  // 生存域は screenX ∈ [-12, 140]（DESPAWN_MARGIN_PX=12）
  const base = {
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
  };
  const goneDeparting: Resident = {
    ...base,
    species: "ramuneFish",
    x: 300, // screenX ≈ -215.8（完全に視界外）→ 消える
    departing: true,
  };
  const farNonDeparting: Resident = {
    ...base,
    species: "strawberryJelly",
    x: 300, // 同じ位置でも退場予定でなければ消えない
    departing: false,
  };
  const nearDeparting: Resident = {
    ...base,
    species: "taiyaki",
    x: 60, // screenX ≈ 24.2（視界内）→ 退場予定でもまだ消えない
    departing: true,
  };
  const next = stepWorld(
    stateWithBaitAtHead({
      residents: [goneDeparting, farNonDeparting, nearDeparting],
      baits: [], // 捕食・誕生を絡めない
    }),
    fixedRandom,
  );
  expect(next.residents.map((r) => r.species)).toEqual([
    "strawberryJelly",
    "taiyaki",
  ]);
  expect(next.residents[1].departing).toBe(true); // 視界内の退場予定は維持
});

/**
 * セレモニー中の状態。bornAtMs=0 の新入りがいて elapsedMs=0 なので、
 * 次の tick（elapsedMs=TICK_MS）は誕生演出の窓内。
 * 主人公には速度と path を持たせ、静止の検証に使う。餌は頭の真横
 */
function stateDuringCeremony(): GameState {
  const newborn: Resident = {
    species: "ramuneFish",
    x: 300,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: 0,
    arrivedAtMs: 0,
    departing: false,
  };
  const elder: Resident = {
    species: "strawberryJelly",
    x: 400,
    baseY: 80,
    y: 80,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  };
  // path は左向き（facing 反転を起こさず、通常コードなら餌を食べてしまう配置）
  return stateWithBaitAtHead({
    residents: [newborn, elder],
    path: [{ x: 20, y: 60 }],
    hero: { x: 100, y: 60, vx: 0, vy: 0, facing: -1 },
  });
}

test("誕生した tick で主人公の速度が 0 になる", () => {
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom);
  expect(next.residents.length).toBe(1);
  expect(next.hero.vx).toBe(0);
  expect(next.hero.vy).toBe(0);
});

test("セレモニー中は主人公が完全静止し path も保持される", () => {
  const state = stateDuringCeremony();
  const next = stepWorld(state, fixedRandom);
  expect(next.hero).toEqual(state.hero);
  expect(next.path).toEqual(state.path);
});

test("セレモニー中は餌に頭が触れても食べられない", () => {
  const next = stepWorld(stateDuringCeremony(), fixedRandom);
  expect(next.satiety).toBe(0);
  expect(next.flashes.length).toBe(0);
  // リスポーンせず泳ぎ続ける（x が BAIT_SPEED ぶん進むだけ）
  expect(next.baits[0].x).toBeCloseTo(88 + BAIT_SPEED, 5);
});

test("セレモニー中も世界は生きている（餌・他住民・経過時間・フラッシュ減衰は進む）", () => {
  const state: GameState = {
    ...stateDuringCeremony(),
    flashes: [{ x: 10, y: 10, bornAt: -1000 }], // 経過 1000ms 超 → 消える
  };
  const next = stepWorld(state, fixedRandom);
  expect(next.elapsedMs).toBeCloseTo(TICK_MS, 5);
  expect(next.baits[0].x).not.toBe(state.baits[0].x);
  // 演出対象外の他住民は泳ぐ
  expect(next.residents[1].x).not.toBe(state.residents[1].x);
  // 新入り本人は演出中につき静止
  expect(next.residents[0].x).toBe(state.residents[0].x);
  // フラッシュ減衰は通常通り
  expect(next.flashes.length).toBe(0);
});

test("演出明けの tick で主人公が再び動き出す", () => {
  const newborn: Resident = {
    species: "ramuneFish",
    x: 300,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: 0,
    arrivedAtMs: 0,
    departing: false,
  };
  const state = stateWithBaitAtHead({
    residents: [newborn],
    elapsedMs: BIRTH_FX_TOTAL_MS, // 次の tick で演出窓を抜ける
    path: [{ x: 200, y: 80 }],
    hero: { x: 100, y: 60, vx: 0, vy: 0, facing: -1 },
    baits: [], // 捕食を絡めない
  });
  const next = stepWorld(state, fixedRandom);
  expect(next.hero.x).not.toBe(state.hero.x);
  expect(next.hero.vx).not.toBe(0);
});

test("古いフラッシュは 600ms で消える", () => {
  const state: GameState = {
    ...createInitialState(fixedRandom),
    elapsedMs: 1000,
    flashes: [
      { x: 10, y: 10, bornAt: 300 }, // 経過 700ms → 消える
      { x: 20, y: 20, bornAt: 900 }, // 経過 100ms → 残る
    ],
  };
  const next = stepWorld(state, fixedRandom);
  expect(next.flashes.length).toBe(1);
  expect(next.flashes[0].x).toBe(20);
});
