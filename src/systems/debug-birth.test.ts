import { expect, test } from "bun:test";
import { RESIDENT_MAX } from "../data/world-constants";
import type { GameState, Resident } from "../types";
import { createInitialState } from "./create-initial-state";
import { debugBirth } from "./debug-birth";

const fixedRandom = () => 0.5;

function resident(x: number): Resident {
  return {
    species: "ramuneFish",
    x,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -100000,
    arrivedAtMs: -100000,
    departing: false,
  };
}

function baseState(): GameState {
  return {
    ...createInitialState(fixedRandom),
    hero: { x: 100, y: 60, vx: 1, vy: 1, facing: 1 },
    elapsedMs: 5000,
    satiety: 2,
  };
}

test("指定した種が主人公の位置に今すぐ生まれ、満腹は変わらない", () => {
  const next = debugBirth(baseState(), "tamago", fixedRandom);
  const born = next.residents.at(-1);
  expect(born?.species).toBe("tamago");
  expect(born?.x).toBe(100);
  expect(born?.bornAtMs).toBe(5000);
  expect(next.satiety).toBe(2);
});

test("ふつうの誕生と同じく主人公が静止する", () => {
  const next = debugBirth(baseState(), "salmon", fixedRandom);
  expect(next.hero.vx).toBe(0);
  expect(next.hero.vy).toBe(0);
});

test("満員なら 1 体が退場予定になる（押し出し）", () => {
  const full = Array.from({ length: RESIDENT_MAX }, (_, i) => resident(i * 10));
  const next = debugBirth(
    { ...baseState(), residents: full },
    "maguro",
    fixedRandom,
  );
  expect(next.residents.length).toBe(RESIDENT_MAX + 1);
  expect(next.residents.filter((r) => r.departing).length).toBe(1);
});
