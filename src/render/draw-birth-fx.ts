import {
  BIRTH_FX_BUBBLE_COUNT,
  BIRTH_FX_BUBBLE_RGB,
  BIRTH_FX_CANDY_COLOR,
  BIRTH_FX_CANDY_COUNT,
  BIRTH_FX_RING_BASE_RADIUS,
  BIRTH_FX_RING_MAX_RADIUS,
} from "../data/birth-fx-constants";
import { RESIDENT_SPRITES } from "../data/resident-sprites";
import type { Resident } from "../types";
import { birthBubblePoint } from "./birth-bubble-point";
import { birthCandyPoint } from "./birth-candy-point";
import { birthFxPhase } from "./birth-fx-phase";
import { drawBirthResident } from "./draw-birth-resident";
import { drawRingDots } from "./draw-ring-dots";
import { dyeBoundaryColumn } from "./dye-boundary-column";
import { isResidentFlipped } from "./is-resident-flipped";

/**
 * 誕生演出の合成描画。泡 → 新入り（シルエット/染まり） → リング＋キャンディ粒。
 * 暗転オーバーレイは呼び出し側（draw-scene）がこの関数の前に描く
 */
export function drawBirthFx(
  ctx: CanvasRenderingContext2D,
  resident: Resident,
  elapsedMs: number,
  screenX: number,
  screenY: number,
): void {
  const ms = elapsedMs - resident.bornAtMs;
  const fx = birthFxPhase(ms);
  if (!fx.active) return;
  const cx = Math.round(screenX);
  const cy = Math.round(screenY);
  const sprite = RESIDENT_SPRITES[resident.species];

  if (fx.bubbleAlpha > 0) {
    ctx.fillStyle = `rgba(${BIRTH_FX_BUBBLE_RGB}, ${fx.bubbleAlpha})`;
    for (let i = 0; i < BIRTH_FX_BUBBLE_COUNT; i++) {
      const p = birthBubblePoint(i, ms);
      if (!p) continue;
      ctx.fillRect(cx + p.dx, cy + p.dy, p.size, p.size);
    }
  }

  if (fx.residentVisible) {
    const boundary =
      fx.dyeProgress === null
        ? null
        : dyeBoundaryColumn(fx.dyeProgress, sprite.width);
    drawBirthResident(
      ctx,
      sprite.frames[0],
      sprite.palette,
      cx - 8,
      cy - 8,
      isResidentFlipped(resident),
      boundary,
    );
  }

  if (fx.ringProgress !== null) {
    const radius =
      BIRTH_FX_RING_BASE_RADIUS +
      fx.ringProgress * (BIRTH_FX_RING_MAX_RADIUS - BIRTH_FX_RING_BASE_RADIUS);
    drawRingDots(
      ctx,
      cx,
      cy,
      radius,
      `rgba(255,255,255,${1 - fx.ringProgress})`,
    );
    // キャンディ粒: その種のパレット色＋金平糖色を index で巡回（Object.values は挿入順で決定的）
    const candyColors = [
      ...Object.values(sprite.palette),
      BIRTH_FX_CANDY_COLOR,
    ];
    for (let i = 0; i < BIRTH_FX_CANDY_COUNT; i++) {
      const p = birthCandyPoint(i, fx.ringProgress);
      ctx.fillStyle = candyColors[i % candyColors.length];
      ctx.fillRect(cx + p.x, cy + p.y, 1, 1);
    }
  }
}
