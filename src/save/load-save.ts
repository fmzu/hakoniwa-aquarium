import type { SaveData } from "../types";
import { parseSave } from "./parse-save";
import { SAVE_STORAGE_KEY } from "./save-storage-key";

/** localStorage からセーブを読む境界層。検証・フォールバックは parseSave が担う */
export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(SAVE_STORAGE_KEY));
  } catch {
    // localStorage 自体が使えない環境（プライベートモード等）でも起動は続ける
    return parseSave(null);
  }
}
