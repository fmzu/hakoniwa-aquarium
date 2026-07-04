import type { SpeciesId } from "../types";

/** 誕生順の固定テーブル。ランダム禁止（図鑑コンプ体験を守る）。この順でループする */
export const BIRTH_TABLE: readonly SpeciesId[] = [
  "ramuneFish",
  "strawberryJelly",
];
