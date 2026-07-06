import { expect, test } from "bun:test";
import type { SaveData } from "../types";
import { createInitialSave } from "./create-initial-save";
import { parseSave } from "./parse-save";
import { serializeSave } from "./serialize-save";

const validSave: SaveData = {
  version: 1,
  zukan: {
    ramuneFish: {
      firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
      birthCount: 3,
    },
    taiyaki: {
      firstDiscoveredAt: "2026-07-06T11:30:00.000Z",
      birthCount: 1,
    },
  },
  satiety: 2,
};

test("シリアライズ⇔デシリアライズの往復で元に戻る", () => {
  expect(parseSave(serializeSave(validSave))).toEqual(validSave);
});

test("null（セーブなし）は初期セーブになる", () => {
  expect(parseSave(null)).toEqual(createInitialSave());
});

test("壊れた JSON は初期セーブになる", () => {
  expect(parseSave("{oops")).toEqual(createInitialSave());
});

test("オブジェクトでない JSON（配列・数値）は初期セーブになる", () => {
  expect(parseSave("[]")).toEqual(createInitialSave());
  expect(parseSave("42")).toEqual(createInitialSave());
});

test("version が 1 でなければ初期セーブになる", () => {
  expect(parseSave(JSON.stringify({ ...validSave, version: 2 }))).toEqual(
    createInitialSave(),
  );
});

test("version 欠損は初期セーブになる", () => {
  expect(parseSave(JSON.stringify({ zukan: {}, satiety: 0 }))).toEqual(
    createInitialSave(),
  );
});

test("satiety が不正（範囲外・非整数・型違い）なら初期セーブになる", () => {
  // SATIETY_MAX(5) 以上は不正（stepWorld は誕生時に必ず減算するため保存値は 0〜4）
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 5 }))).toEqual(
    createInitialSave(),
  );
  expect(parseSave(JSON.stringify({ ...validSave, satiety: -1 }))).toEqual(
    createInitialSave(),
  );
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 1.5 }))).toEqual(
    createInitialSave(),
  );
  expect(parseSave(JSON.stringify({ ...validSave, satiety: "2" }))).toEqual(
    createInitialSave(),
  );
});

test("satiety の境界値 0 と 4（SATIETY_MAX - 1）は受理される", () => {
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 0 }))).toEqual({
    ...validSave,
    satiety: 0,
  });
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 4 }))).toEqual({
    ...validSave,
    satiety: 4,
  });
});

test("firstDiscoveredAt が日付として解釈できない文字列なら初期セーブになる", () => {
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: {
          ramuneFish: { firstDiscoveredAt: "not-a-date", birthCount: 1 },
        },
      }),
    ),
  ).toEqual(createInitialSave());
});

test("birthCount の境界値 1 は受理される", () => {
  const save: SaveData = {
    version: 1,
    zukan: {
      ramuneFish: {
        firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
        birthCount: 1,
      },
    },
    satiety: 0,
  };
  expect(parseSave(serializeSave(save))).toEqual(save);
});

test("birthCount が Number.MAX_SAFE_INTEGER を超えると初期セーブになる", () => {
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: {
          ramuneFish: {
            firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
            birthCount: 2 ** 53,
          },
        },
      }),
    ),
  ).toEqual(createInitialSave());
});

test("zukan エントリが配列なら初期セーブになる", () => {
  expect(
    parseSave(
      JSON.stringify({ version: 1, satiety: 0, zukan: { ramuneFish: [] } }),
    ),
  ).toEqual(createInitialSave());
});

test("zukan の __proto__ キーは初期セーブになる（プロトタイプ汚染を防ぐ）", () => {
  expect(
    parseSave(
      '{"version":1,"satiety":0,"zukan":{"__proto__":{"firstDiscoveredAt":"2026-07-06T10:00:00.000Z","birthCount":1}}}',
    ),
  ).toEqual(createInitialSave());
});

test("未知の余剰フィールドは出力に持ち込まれない", () => {
  // トップレベルの余剰フィールドは捨てられる
  expect(parseSave(JSON.stringify({ ...validSave, extra: "x" }))).toEqual(
    validSave,
  );
  // zukan エントリ内の余剰フィールドも捨てられる
  const expected: SaveData = {
    version: 1,
    zukan: {
      ramuneFish: {
        firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
        birthCount: 1,
      },
    },
    satiety: 0,
  };
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: {
          ramuneFish: {
            firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
            birthCount: 1,
            extra: "x",
          },
        },
      }),
    ),
  ).toEqual(expected);
});

test("zukan 欠損・未知の種キー・不正エントリは初期セーブになる", () => {
  expect(parseSave(JSON.stringify({ version: 1, satiety: 0 }))).toEqual(
    createInitialSave(),
  );
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: {
          unknownFish: { firstDiscoveredAt: "2026-07-06", birthCount: 1 },
        },
      }),
    ),
  ).toEqual(createInitialSave());
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: { ramuneFish: { birthCount: 1 } },
      }),
    ),
  ).toEqual(createInitialSave());
  // 図鑑に載っている＝1 回以上生まれているので birthCount 0 は不正
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: {
          ramuneFish: {
            firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
            birthCount: 0,
          },
        },
      }),
    ),
  ).toEqual(createInitialSave());
});
