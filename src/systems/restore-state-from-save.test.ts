import { expect, test } from "bun:test";
import type { SaveData } from "../types";
import { restoreStateFromSave } from "./restore-state-from-save";

const fixedRandom = () => 0.5;

test("満腹ゲージがセーブから復元される", () => {
  const save: SaveData = { version: 1, zukan: {}, satiety: 3 };
  expect(restoreStateFromSave(save, fixedRandom).satiety).toBe(3);
});

test("発見済みの種が residents として泳ぎ出す", () => {
  const save: SaveData = {
    version: 1,
    zukan: {
      taiyaki: {
        firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
        birthCount: 2,
      },
    },
    satiety: 0,
  };
  const state = restoreStateFromSave(save, fixedRandom);
  expect(state.residents.length).toBe(1);
  expect(state.residents[0].species).toBe("taiyaki");
});

test("餌・主人公・経過時間は初期状態と同じ", () => {
  const save: SaveData = { version: 1, zukan: {}, satiety: 0 };
  const state = restoreStateFromSave(save, fixedRandom);
  expect(state.baits.length).toBe(3);
  expect(state.hero).toEqual({ x: 80, y: 60, vx: 0, vy: 0, facing: -1 });
  expect(state.elapsedMs).toBe(0);
  expect(state.path).toEqual([]);
  expect(state.flashes).toEqual([]);
  expect(state.nextVisitCheckMs).toBe(300000); // 保存対象外。毎セッション初期値から
});
