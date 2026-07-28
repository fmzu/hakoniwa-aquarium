import { SPECIES_IDS } from "../data/species-ids";
import { satietyMax } from "../systems/satiety-max";
import type { SaveData, SpeciesId, Zukan } from "../types";
import { createInitialSave } from "./create-initial-save";

/**
 * セーブ文字列を検証つきで読み取る。壊れた JSON・欠損フィールド・不正値は
 * すべて初期セーブへフォールバックする（クラッシュさせない・部分修復はしない）。
 * 満腹の上限は発見数に依存する（satietyMax(zukan)）ため、図鑑を先に検証する。
 */
export function parseSave(raw: string | null): SaveData {
  if (raw === null) return createInitialSave();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return createInitialSave();
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return createInitialSave();
  }
  const record = data as Record<string, unknown>;
  if (record.version !== 1) return createInitialSave();

  // 図鑑を先に検証・構築する（満腹の上限が発見数に依存するため順序が重要）
  const zukanRaw = record.zukan;
  if (
    typeof zukanRaw !== "object" ||
    zukanRaw === null ||
    Array.isArray(zukanRaw)
  ) {
    return createInitialSave();
  }
  const zukan: Zukan = {};
  for (const [key, value] of Object.entries(zukanRaw)) {
    if (!(SPECIES_IDS as readonly string[]).includes(key)) {
      return createInitialSave();
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return createInitialSave();
    }
    const entry = value as Record<string, unknown>;
    if (
      typeof entry.firstDiscoveredAt !== "string" ||
      Number.isNaN(Date.parse(entry.firstDiscoveredAt))
    ) {
      return createInitialSave();
    }
    if (
      typeof entry.birthCount !== "number" ||
      !Number.isInteger(entry.birthCount) ||
      entry.birthCount < 1 ||
      entry.birthCount > Number.MAX_SAFE_INTEGER
    ) {
      return createInitialSave();
    }
    zukan[key as SpeciesId] = {
      firstDiscoveredAt: entry.firstDiscoveredAt,
      birthCount: entry.birthCount,
    };
  }

  // 満腹は 0〜satietyMax(zukan)-1 の整数（stepWorld は誕生時に必ず減算するため
  // 保存値は上限未満に収まる）
  const satiety = record.satiety;
  if (
    typeof satiety !== "number" ||
    !Number.isInteger(satiety) ||
    satiety < 0 ||
    satiety >= satietyMax(zukan)
  ) {
    return createInitialSave();
  }

  return { version: 1, zukan, satiety };
}
