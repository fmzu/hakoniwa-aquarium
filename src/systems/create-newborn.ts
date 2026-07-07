import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { SPECIES_MOTION } from "../data/species-motion";
import {
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
} from "../data/world-constants";
import { clamp } from "../engine/clamp";
import type { Hero, Resident, SpeciesId } from "../types";

/**
 * 満腹 5 の誕生で新生児を 1 体つくる。誕生地点は主人公の位置
 * （baseY は住民の遊泳域にクランプ）で、誕生＝到着（bornAtMs = arrivedAtMs = elapsedMs）。
 * @param random - [0, 1) を返す乱数（Math.random 互換）。dir の決定に 1 回消費する
 */
export function createNewborn(
  species: SpeciesId,
  hero: Hero,
  elapsedMs: number,
  random: () => number,
): Resident {
  const baseY = clamp(hero.y, RESIDENT_MIN_BASE_Y, RESIDENT_MAX_BASE_Y);
  return {
    species,
    x: hero.x,
    baseY,
    y: baseY,
    dir: random() < 0.5 ? -1 : 1,
    // 演出明け（bornAtMs + BIRTH_FX_TOTAL_MS）に sin 項が 0 になる位相。
    // 演出中は y=baseY で静止するため、復帰時の y 飛びを防ぐ
    phase:
      -(elapsedMs + BIRTH_FX_TOTAL_MS) * SPECIES_MOTION[species].bobFrequency,
    bornAtMs: elapsedMs,
    arrivedAtMs: elapsedMs,
    departing: false,
  };
}
