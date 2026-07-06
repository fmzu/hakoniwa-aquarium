import { SPECIES_IDS } from "../data/species-ids";
import { SATIETY_MAX } from "../data/world-constants";
import type { SaveData, SpeciesId, Zukan } from "../types";
import { createInitialSave } from "./create-initial-save";

/**
 * セーブ文字列を検証つきで読み取る。壊れた JSON・欠損フィールド・不正値は
 * すべて初期セーブへフォールバックする（クラッシュさせない・部分修復はしない）
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

  const satiety = record.satiety;
  if (
    typeof satiety !== "number" ||
    !Number.isInteger(satiety) ||
    satiety < 0 ||
    satiety >= SATIETY_MAX
  ) {
    return createInitialSave();
  }

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
    if (typeof value !== "object" || value === null) {
      return createInitialSave();
    }
    const entry = value as Record<string, unknown>;
    if (typeof entry.firstDiscoveredAt !== "string") {
      return createInitialSave();
    }
    if (
      typeof entry.birthCount !== "number" ||
      !Number.isInteger(entry.birthCount) ||
      entry.birthCount < 1
    ) {
      return createInitialSave();
    }
    zukan[key as SpeciesId] = {
      firstDiscoveredAt: entry.firstDiscoveredAt,
      birthCount: entry.birthCount,
    };
  }
  return { version: 1, zukan, satiety };
}
