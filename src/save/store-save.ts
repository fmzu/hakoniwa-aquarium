import type { SaveData } from "../types";
import { SAVE_STORAGE_KEY } from "./save-storage-key";
import { serializeSave } from "./serialize-save";

/** localStorage へ保存する境界層。容量超過等で失敗してもゲームは止めない */
export function storeSave(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, serializeSave(save));
  } catch {
    // 保存失敗は無視する（次の保存機会で再試行される）。クラッシュさせない
  }
}
