import { expect, test } from "bun:test";
import type { SaveData } from "../types";
import { serializeSave } from "./serialize-save";

test("JSON.parse で元のデータに戻る文字列を返す", () => {
  const save: SaveData = {
    version: 1,
    zukan: {
      ramuneFish: {
        firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
        birthCount: 3,
      },
    },
    satiety: 2,
  };
  expect(JSON.parse(serializeSave(save))).toEqual(save);
});
