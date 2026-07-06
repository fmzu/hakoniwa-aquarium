import type { SaveData } from "../types";

/** セーブデータを localStorage 保存用の JSON 文字列にする */
export function serializeSave(save: SaveData): string {
  return JSON.stringify(save);
}
