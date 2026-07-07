import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { SPECIES_MOTION } from "../data/species-motion";
import {
  BAIT_MAX_BASE_Y,
  BAIT_MIN_BASE_Y,
  FLASH_DURATION_MS,
  RESIDENT_MAX,
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  SATIETY_MAX,
  TICK_MS,
} from "../data/world-constants";
import { clamp } from "../engine/clamp";
import { isStrokePhase } from "../engine/is-stroke-phase";
import type { Flash, GameState, Resident } from "../types";
import { headPosition } from "./head-position";
import { isBaitCaught } from "./is-bait-caught";
import { isCeremonyActive } from "./is-ceremony-active";
import { nextBirthSpecies } from "./next-birth-species";
import { respawnBait } from "./respawn-bait";
import { stepBait } from "./step-bait";
import { stepHero } from "./step-hero";
import { stepResident } from "./step-resident";

/**
 * 1 tick の全状態更新。主人公 → 餌移動 → 捕食 → 満腹/誕生 → 住民 → フラッシュ寿命。
 * 誕生セレモニー中は主人公を完全静止させ（path は消費せず保持）、捕食判定もスキップする。
 * カメラは主人公追従なので、これで誕生地点が画面内に留まる
 */
export function stepWorld(state: GameState, random: () => number): GameState {
  const elapsedMs = state.elapsedMs + TICK_MS;
  const ceremony = isCeremonyActive(state.residents, elapsedMs);
  const stroke = isStrokePhase(elapsedMs);
  let { hero, path } = ceremony
    ? { hero: state.hero, path: state.path }
    : stepHero(state.hero, state.path, stroke);
  const head = headPosition(hero);

  let satiety = state.satiety;
  let flashes: Flash[] = state.flashes.filter(
    (f) => elapsedMs - f.bornAt < FLASH_DURATION_MS,
  );

  const baits = state.baits.map((bait) => {
    const moved = stepBait(bait, elapsedMs);
    // セレモニー中は捕食判定を無効にする（意図的な仕様。docs/spec.md 決定ログ参照）
    if (ceremony || !isBaitCaught(moved, head)) return moved;
    satiety += 1;
    flashes = [...flashes, { x: moved.x, y: moved.y, bornAt: elapsedMs }];
    const newBaseY =
      BAIT_MIN_BASE_Y + random() * (BAIT_MAX_BASE_Y - BAIT_MIN_BASE_Y);
    return respawnBait(moved, hero.x, newBaseY);
  });

  let residents = state.residents.map((resident) =>
    stepResident(resident, elapsedMs),
  );
  if (satiety >= SATIETY_MAX) {
    // 同tick複数捕食の超過分は次の誕生へ繰り越す（docs/spec.md 決定ログ参照）
    // 満員で誕生しない場合も同様に繰り越す（docs/spec.md 決定ログ参照）
    // 安全性: BAIT_COUNT=3 より 1 tick の最大加算は 3 → 繰り越しは最大 2 で
    // SATIETY_MAX(5) に届かず、二重誕生は構造的に不可能。
    // セレモニー中は捕食無効なので誕生の連鎖も起きない
    satiety -= SATIETY_MAX;
    if (residents.length < RESIDENT_MAX) {
      const baseY = clamp(hero.y, RESIDENT_MIN_BASE_Y, RESIDENT_MAX_BASE_Y);
      const species = nextBirthSpecies(residents.length);
      const born: Resident = {
        species,
        x: hero.x,
        baseY,
        y: baseY,
        dir: random() < 0.5 ? -1 : 1,
        // 演出明け（bornAtMs + BIRTH_FX_TOTAL_MS）に sin 項が 0 になる位相。
        // 演出中は y=baseY で静止するため、復帰時の y 飛びを防ぐ
        phase:
          -(elapsedMs + BIRTH_FX_TOTAL_MS) *
          SPECIES_MOTION[species].bobFrequency,
        bornAtMs: elapsedMs,
        arrivedAtMs: elapsedMs,
        departing: false,
      };
      residents = [...residents, born];
      // セレモニー中はカメラ（主人公追従）を止め誕生地点にフォーカスするため即座に静止
      hero = { ...hero, vx: 0, vy: 0 };
    }
  }

  return { hero, path, baits, residents, flashes, satiety, elapsedMs };
}
