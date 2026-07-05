import { RESIDENT_SPRITES } from "../data/resident-sprites";
import { nessieSprite } from "../data/sprites/nessie";
import { shadowFishSprite } from "../data/sprites/shadow-fish";
import {
  FLASH_BASE_RADIUS,
  FLASH_DURATION_MS,
  FLASH_GROW_RADIUS,
  SATIETY_MAX,
  VIEW_WIDTH,
  WORLD_WIDTH,
} from "../data/world-constants";
import { isStrokePhase } from "../engine/is-stroke-phase";
import { mod } from "../engine/mod";
import { torusDistance } from "../engine/torus-distance";
import type { GameState } from "../types";
import { drawBackground } from "./draw-background";
import { drawGrid } from "./draw-grid";
import { drawPath } from "./draw-path";
import { drawRingDots } from "./draw-ring-dots";
import { isResidentFlipped } from "./is-resident-flipped";

/** 1 フレームぶんの描画。背景 → 道のり → 餌 → 住民 → 主人公 → 捕食リング → 満腹ピップ */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number,
): void {
  drawBackground(ctx, camY);
  drawPath(ctx, state.path, camX, camY);

  for (const bait of state.baits) {
    const x = torusDistance(bait.x, camX, WORLD_WIDTH);
    // 中央揃え（幅 16 → x±8）なのでカリングも左右対称にする
    if (x < -8 || x > VIEW_WIDTH + 8) continue;
    drawGrid(
      ctx,
      shadowFishSprite.frames[0],
      shadowFishSprite.palette,
      x - 8,
      bait.y - camY - 2,
      bait.dir > 0,
    );
  }

  for (const resident of state.residents) {
    const x = torusDistance(resident.x, camX, WORLD_WIDTH);
    if (x < -18 || x > VIEW_WIDTH + 4) continue;
    const sprite = RESIDENT_SPRITES[resident.species];
    // frameIntervalMs === 0（1 フレームのスプライト）は mod(x, 0) = NaN になるためガードする
    const frameIndex =
      sprite.frameIntervalMs === 0 ||
      mod(state.elapsedMs, sprite.frameIntervalMs * 2) < sprite.frameIntervalMs
        ? 0
        : 1;
    drawGrid(
      ctx,
      sprite.frames[frameIndex],
      sprite.palette,
      x - 8,
      resident.y - camY - 8,
      isResidentFlipped(resident),
    );
  }

  // 主人公: 掻きフレーム（frame2）を推進バーストと同期させる
  const heroFrame = isStrokePhase(state.elapsedMs) ? 1 : 0;
  const heroX = torusDistance(state.hero.x, camX, WORLD_WIDTH);
  drawGrid(
    ctx,
    nessieSprite.frames[heroFrame],
    nessieSprite.palette,
    heroX - 12,
    state.hero.y - camY - 8,
    state.hero.facing === 1,
  );

  // 捕食フラッシュ（白ドットリング。ベクター描画禁止のドット規律に従う）
  for (const flash of state.flashes) {
    const age = (state.elapsedMs - flash.bornAt) / FLASH_DURATION_MS;
    const x = torusDistance(flash.x, camX, WORLD_WIDTH);
    drawRingDots(
      ctx,
      x,
      flash.y - camY,
      FLASH_BASE_RADIUS + age * FLASH_GROW_RADIUS,
      `rgba(255,255,255,${1 - age})`,
    );
  }

  // HUD: 満腹ピップ
  for (let i = 0; i < SATIETY_MAX; i++) {
    ctx.fillStyle = i < state.satiety ? "#FFB0C6" : "rgba(255,255,255,0.25)";
    ctx.fillRect(4 + i * 6, 4, 4, 4);
  }
}
