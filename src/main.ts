import { MAX_TICKS_PER_FRAME, TICK_MS } from "./data/world-constants";
import { attachPointerInput } from "./engine/attach-pointer-input";
import { cameraPosition } from "./engine/camera-position";
import { createFixedTimestep } from "./engine/create-fixed-timestep";
import { shouldAddWaypoint } from "./engine/should-add-waypoint";
import { applyCanvasScale } from "./render/apply-canvas-scale";
import { drawScene } from "./render/draw-scene";
import { createInitialState } from "./systems/create-initial-state";
import { stepWorld } from "./systems/step-world";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("canvas #game が見つからない");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D コンテキストを取得できない");

let state = createInitialState(Math.random);

const getCamera = () => cameraPosition(state.hero.x, state.hero.y);

attachPointerInput(canvas, getCamera, (point, isStart) => {
  if (isStart) {
    state = { ...state, path: [point] };
  } else if (shouldAddWaypoint(state.path, point)) {
    state = { ...state, path: [...state.path, point] };
  }
});

const advance = createFixedTimestep(TICK_MS, MAX_TICKS_PER_FRAME, () => {
  state = stepWorld(state, Math.random);
});

const resize = () =>
  applyCanvasScale(canvas, window.innerWidth, window.innerHeight);
window.addEventListener("resize", resize);
resize();

const frame = (now: number) => {
  advance(now);
  const { camX, camY } = getCamera();
  drawScene(ctx, state, camX, camY);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
