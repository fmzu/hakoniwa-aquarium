import { MAX_TICKS_PER_FRAME, TICK_MS } from "./data/world-constants";
import { attachPointerInput } from "./engine/attach-pointer-input";
import { cameraPosition } from "./engine/camera-position";
import { createFixedTimestep } from "./engine/create-fixed-timestep";
import { shouldAddWaypoint } from "./engine/should-add-waypoint";
import { applyCanvasScale } from "./render/apply-canvas-scale";
import { drawScene } from "./render/draw-scene";
import { loadSave } from "./save/load-save";
import { storeSave } from "./save/store-save";
import { updateZukan } from "./save/update-zukan";
import { detectBornResident } from "./systems/detect-born-resident";
import { restoreStateFromSave } from "./systems/restore-state-from-save";
import { stepWorld } from "./systems/step-world";
import { attachZukanUi } from "./ui/attach-zukan-ui";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("canvas #game が見つからない");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D コンテキストを取得できない");

// セーブ読込 → 発見済みの種から抽選した海で開始（顔ぶれは保存しない確定仕様）
const save = loadSave();
let zukan = save.zukan;
let state = restoreStateFromSave(save, Math.random);

attachZukanUi(() => zukan);

const getCamera = () => cameraPosition(state.hero.x, state.hero.y);

attachPointerInput(canvas, getCamera, (point, isStart) => {
  if (isStart) {
    state = { ...state, path: [point] };
  } else if (shouldAddWaypoint(state.path, point)) {
    state = { ...state, path: [...state.path, point] };
  }
});

const advance = createFixedTimestep(TICK_MS, MAX_TICKS_PER_FRAME, () => {
  const prev = state;
  state = stepWorld(state, Math.random);
  // 誕生検知は bornAtMs === elapsedMs で行う（1 tick で複数誕生は
  // 構造的に不可能。step-world の繰り越しコメント参照）
  const born = detectBornResident(state.residents, state.elapsedMs);
  if (born) {
    // 現実時刻の取得は境界層のここでだけ行う（純粋関数には ISO 文字列で渡す）
    zukan = updateZukan(zukan, born.species, new Date().toISOString());
  }
  // 誕生・捕食（満腹変化）のあった tick だけ自動保存する。
  // 保存は tick 完了後の state のみ対象（中間状態は保存しない）
  if (born || state.satiety !== prev.satiety) {
    storeSave({ version: 1, zukan, satiety: state.satiety });
  }
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
