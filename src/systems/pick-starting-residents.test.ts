import { expect, test } from "bun:test";
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import type { ZukanEntry } from "../types";
import { pickStartingResidents } from "./pick-starting-residents";

const fixedRandom = () => 0.5;
const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
  birthCount: 1,
};

test("図鑑が空なら誰も泳がない", () => {
  expect(pickStartingResidents({}, fixedRandom)).toEqual([]);
});

test("1 種だけ発見済みなら 1 体だけ泳ぐ", () => {
  const residents = pickStartingResidents({ taiyaki: entry }, fixedRandom);
  expect(residents.length).toBe(1);
  expect(residents[0].species).toBe("taiyaki");
});

test("3 種発見済み・random=0.5 なら 3 体・種の重複なし", () => {
  // 抽選数 roll: 2 + floor(0.5 * 3) = 3
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  const residents = pickStartingResidents(zukan, fixedRandom);
  expect(residents.length).toBe(3);
  expect(new Set(residents.map((r) => r.species)).size).toBe(3);
});

test("random=0.5 の抽選順は [strawberryJelly, taiyaki, ramuneFish]", () => {
  // 実装の乱数消費順のリグレッションピン。抽選方式を変えたら期待値を更新する
  // 1 回目: 抽選数 = 2 + floor(0.5 * 3) = 3（min(3, 発見 3 種) = 3）
  // pool [ramuneFish, strawberryJelly, taiyaki] から floor(0.5*3)=1 → strawberryJelly
  // pool [ramuneFish, taiyaki] から floor(0.5*2)=1 → taiyaki
  // pool [ramuneFish] から floor(0.5*1)=0 → ramuneFish
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  const species = pickStartingResidents(zukan, fixedRandom).map(
    (r) => r.species,
  );
  expect(species).toEqual(["strawberryJelly", "taiyaki", "ramuneFish"]);
});

test("生成された住民は帯内の位置・誕生演出なしの bornAtMs を持つ", () => {
  const resident = pickStartingResidents({ ramuneFish: entry }, fixedRandom)[0];
  expect(resident.baseY).toBe(71); // 24 + 0.5 * (118 - 24)
  expect(resident.y).toBe(71);
  expect(resident.x).toBe(240); // 0.5 * 480
  expect(resident.dir).toBe(1); // 0.5 < 0.5 は false
  expect(resident.phase).toBe(3); // 0.5 * 6
  expect(resident.bornAtMs).toBe(-BIRTH_FX_TOTAL_MS);
  expect(resident.arrivedAtMs).toBe(0); // セッション開始メンバーの到着は 0
  expect(resident.departing).toBe(false);
});

/** 指定した値を順に返し、尽きたら 0.5 を返す乱数（テスト決定性） */
function sequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++] ?? 0.5;
}

test("抽選数はゆらぐ: 最初の乱数 0 なら ROSTER_MIN の 2 体", () => {
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  expect(pickStartingResidents(zukan, sequenceRandom([0])).length).toBe(2);
});

test("抽選数が発見数を超えるときは発見数まで（roll=4 でも 3 種なら 3 体）", () => {
  // 2 + floor(0.99 * 3) = 4 → min(4, 発見 3 種) = 3。ROSTER_MAX=4 は 4 種目の発見後に効く
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  expect(pickStartingResidents(zukan, sequenceRandom([0.99])).length).toBe(3);
});
