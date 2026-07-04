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
import { nextBirthSpecies } from "./next-birth-species";
import { respawnBait } from "./respawn-bait";
import { stepBait } from "./step-bait";
import { stepHero } from "./step-hero";
import { stepResident } from "./step-resident";

/** 1 tick の全状態更新。主人公 → 餌移動 → 捕食 → 満腹/誕生 → 住民 → フラッシュ寿命 */
export function stepWorld(state: GameState, random: () => number): GameState {
  const elapsedMs = state.elapsedMs + TICK_MS;
  const stroke = isStrokePhase(elapsedMs);
  const { hero, path } = stepHero(state.hero, state.path, stroke);
  const head = headPosition(hero);

  let satiety = state.satiety;
  let flashes: Flash[] = state.flashes.filter(
    (f) => elapsedMs - f.bornAt < FLASH_DURATION_MS,
  );

  const baits = state.baits.map((bait) => {
    const moved = stepBait(bait, elapsedMs);
    if (!isBaitCaught(moved, head)) return moved;
    satiety += 1;
    flashes = [
      ...flashes,
      { x: moved.x, y: moved.y, bornAt: elapsedMs, small: true },
    ];
    const newBaseY =
      BAIT_MIN_BASE_Y + random() * (BAIT_MAX_BASE_Y - BAIT_MIN_BASE_Y);
    return respawnBait(moved, hero.x, newBaseY);
  });

  let residents = state.residents.map((resident) =>
    stepResident(resident, elapsedMs),
  );
  if (satiety >= SATIETY_MAX) {
    satiety = 0;
    if (residents.length < RESIDENT_MAX) {
      const baseY = clamp(hero.y, RESIDENT_MIN_BASE_Y, RESIDENT_MAX_BASE_Y);
      const born: Resident = {
        species: nextBirthSpecies(residents.length),
        x: hero.x,
        baseY,
        y: baseY,
        dir: random() < 0.5 ? -1 : 1,
        phase: random() * 6,
      };
      residents = [...residents, born];
      flashes = [
        ...flashes,
        { x: hero.x, y: hero.y, bornAt: elapsedMs, small: false },
      ];
    }
  }

  return { hero, path, baits, residents, flashes, satiety, elapsedMs };
}
