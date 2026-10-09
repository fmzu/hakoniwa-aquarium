import { SPECIES_MOTION } from "./data/species-motion";
import { clioneSprite } from "./data/sprites/clione";
import { nessieSprite } from "./data/sprites/nessie";
import { ramuneFishSprite } from "./data/sprites/ramune-fish";
import { seahorseSprite } from "./data/sprites/seahorse";
import { shadowFishSprite } from "./data/sprites/shadow-fish";
import { shrimpSprite } from "./data/sprites/shrimp";
import { squidSprite } from "./data/sprites/squid";
import { strawberryJellySprite } from "./data/sprites/strawberry-jelly";
import { taiyakiSprite } from "./data/sprites/taiyaki";
import { MAX_TICKS_PER_FRAME, TICK_MS } from "./data/world-constants";
import { createFixedTimestep } from "./engine/create-fixed-timestep";
import { mod } from "./engine/mod";
import { depthColor } from "./render/depth-color";
import { drawGrid } from "./render/draw-grid";
import type { Sprite } from "./types";

const CANVAS_WIDTH = 240;
const CANVAS_HEIGHT = 160;
const BOB_AMPLITUDE = 4;
const BOB_FREQUENCY = 0.0015;

type Swimmer = {
  sprite: Sprite;
  label: string;
  x: number;
  baseY: number;
  dir: -1 | 1;
  /** 右向きで鏡像反転するか。住民種は SPECIES_MOTION の値をそのまま使い、本番と向きを一致させる */
  mirrorsByDirection: boolean;
  speed: number;
  phase: number;
};

const swimmers: Swimmer[] = [
  {
    sprite: nessieSprite,
    label: "ネッシー",
    x: 20,
    baseY: 24,
    dir: 1,
    mirrorsByDirection: true,
    speed: 0.02,
    phase: 0,
  },
  {
    sprite: ramuneFishSprite,
    label: "ラムネ魚",
    x: 180,
    baseY: 56,
    dir: -1,
    mirrorsByDirection: SPECIES_MOTION.ramuneFish.mirrorsByDirection,
    speed: 0.03,
    phase: 1.1,
  },
  {
    sprite: strawberryJellySprite,
    label: "ストロベリークラゲ",
    x: 90,
    baseY: 60,
    dir: 1,
    mirrorsByDirection: SPECIES_MOTION.strawberryJelly.mirrorsByDirection,
    speed: 0.015,
    phase: 2.4,
  },
  {
    sprite: taiyakiSprite,
    label: "たい焼き",
    x: 140,
    baseY: 112,
    dir: -1,
    mirrorsByDirection: SPECIES_MOTION.taiyaki.mirrorsByDirection,
    speed: 0.025,
    phase: 3.6,
  },
  {
    sprite: shadowFishSprite,
    label: "影の魚",
    x: 60,
    baseY: 136,
    dir: 1,
    mirrorsByDirection: true,
    speed: 0.035,
    phase: 4.8,
  },
  {
    sprite: shrimpSprite,
    label: "エビ",
    x: 200,
    baseY: 100,
    dir: -1,
    mirrorsByDirection: SPECIES_MOTION.shrimp.mirrorsByDirection,
    speed: 0.03,
    phase: 0.7,
  },
  {
    sprite: seahorseSprite,
    label: "タツノオトシゴ",
    x: 30,
    baseY: 56,
    dir: 1,
    mirrorsByDirection: SPECIES_MOTION.seahorse.mirrorsByDirection,
    speed: 0.01,
    phase: 1.9,
  },
  {
    sprite: clioneSprite,
    label: "クリオネ",
    x: 120,
    baseY: 24,
    dir: 1,
    mirrorsByDirection: SPECIES_MOTION.clione.mirrorsByDirection,
    speed: 0.012,
    phase: 3.0,
  },
  {
    sprite: squidSprite,
    label: "イカ",
    x: 200,
    baseY: 60,
    dir: -1,
    mirrorsByDirection: SPECIES_MOTION.squid.mirrorsByDirection,
    speed: 0.02,
    phase: 5.5,
  },
];

const canvas = document.querySelector<HTMLCanvasElement>("#dev-canvas");
if (!canvas) throw new Error("canvas #dev-canvas が見つからない");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D コンテキストを取得できない");

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, depthColor(0));
  gradient.addColorStop(0.5, depthColor(CANVAS_HEIGHT / 2));
  gradient.addColorStop(1, depthColor(CANVAS_HEIGHT));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function stepSwimmer(swimmer: Swimmer): Swimmer {
  let x = swimmer.x + swimmer.dir * swimmer.speed * TICK_MS;
  const margin = swimmer.sprite.width;
  if (x > CANVAS_WIDTH + margin) x = -margin;
  if (x < -margin) x = CANVAS_WIDTH + margin;
  return { ...swimmer, x };
}

function drawSwimmer(
  ctx: CanvasRenderingContext2D,
  swimmer: Swimmer,
  elapsedMs: number,
): void {
  const { sprite } = swimmer;
  const y =
    swimmer.baseY +
    Math.sin(elapsedMs * BOB_FREQUENCY + swimmer.phase) * BOB_AMPLITUDE;
  const frameIndex =
    sprite.frameIntervalMs === 0 ||
    mod(elapsedMs, sprite.frameIntervalMs * 2) < sprite.frameIntervalMs
      ? 0
      : 1;
  const flip = swimmer.mirrorsByDirection && swimmer.dir > 0;
  drawGrid(
    ctx,
    sprite.frames[frameIndex],
    sprite.palette,
    swimmer.x - sprite.width / 2,
    y - sprite.height / 2,
    flip,
  );
  ctx.fillStyle = "#EAF8FF";
  ctx.font = "8px DotGothic16, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(swimmer.label, swimmer.x, y + sprite.height / 2 + 10);
}

let elapsedMs = 0;
const advance = createFixedTimestep(TICK_MS, MAX_TICKS_PER_FRAME, () => {
  elapsedMs += TICK_MS;
  for (let i = 0; i < swimmers.length; i++) {
    swimmers[i] = stepSwimmer(swimmers[i]);
  }
});

const frame = (now: number) => {
  advance(now);
  drawBackground(ctx);
  for (const swimmer of swimmers) {
    drawSwimmer(ctx, swimmer, elapsedMs);
  }
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
