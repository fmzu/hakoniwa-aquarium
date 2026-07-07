import { BIRTH_FX_RING_MAX_RADIUS } from "../data/birth-fx-constants";
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
import { isBirthFxActive } from "../systems/is-birth-fx-active";
import type { GameState, Resident } from "../types";
import { birthFxPhase } from "./birth-fx-phase";
import { drawBackground } from "./draw-background";
import { drawBirthFx } from "./draw-birth-fx";
import { drawDarkenOverlay } from "./draw-darken-overlay";
import { drawGrid } from "./draw-grid";
import { drawPath } from "./draw-path";
import { drawRingDots } from "./draw-ring-dots";
import { isResidentFlipped } from "./is-resident-flipped";

/**
 * 1 フレームぶんの描画。
 * 背景 → 道のり → 餌 → 住民（誕生中を除く） → 主人公 → 捕食リング → 暗転 → 新入り＋誕生演出 → 満腹ピップ
 */
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

  // 誕生演出中の住民は通常ループでは描かず、暗転オーバーレイの上に描く
  const birthing: { resident: Resident; screenX: number }[] = [];

  for (const resident of state.residents) {
    const x = torusDistance(resident.x, camX, WORLD_WIDTH);
    if (isBirthFxActive(resident.bornAtMs, state.elapsedMs)) {
      // 演出はリング＋キャンディ粒がスプライトより広がるため、
      // カリングマージンも演出の最大半径＋余白に合わせて左右対称に広く取る
      const margin = BIRTH_FX_RING_MAX_RADIUS + 4;
      if (x < -margin || x > VIEW_WIDTH + margin) continue;
      birthing.push({ resident, screenX: x });
      continue;
    }
    // 中央揃え（スプライト半幅 8）に対し右 +4 では 4px 早くポップアウトするため左右対称にする
    if (x < -8 || x > VIEW_WIDTH + 8) continue;
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

  // 誕生演出: 均一暗転 → その上に新入り＋演出（同時複数誕生時は最も濃い暗転を 1 回だけ描く）。
  // 暗転は画面全体に均一なので、カリングとは無関係に全住民から計算する。
  // 主人公が誕生地点から泳ぎ去って新入りが画面外になっても、
  // 演出時間中は暗転がフェードアウトまで滑らかに継続する
  let darkenAlpha = 0;
  for (const r of state.residents) {
    if (!isBirthFxActive(r.bornAtMs, state.elapsedMs)) continue;
    darkenAlpha = Math.max(
      darkenAlpha,
      birthFxPhase(state.elapsedMs - r.bornAtMs).darkenAlpha,
    );
  }
  drawDarkenOverlay(ctx, darkenAlpha);
  for (const b of birthing) {
    drawBirthFx(
      ctx,
      b.resident,
      state.elapsedMs,
      b.screenX,
      b.resident.y - camY,
    );
  }

  // HUD: 満腹ピップ（暗転の影響を受けないよう最後に描く）
  for (let i = 0; i < SATIETY_MAX; i++) {
    ctx.fillStyle = i < state.satiety ? "#FFB0C6" : "rgba(255,255,255,0.25)";
    ctx.fillRect(4 + i * 6, 4, 4, 4);
  }
}
