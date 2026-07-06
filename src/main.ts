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
  // 誕生検知: 住民は増えるだけ（退出なし）なので length 増加 = 誕生。
  // 1 tick で複数誕生は構造的に不可能（step-world の繰り越しコメント参照）
  if (state.residents.length > prev.residents.length) {
    const born = state.residents[state.residents.length - 1];
    // 現実時刻の取得は境界層のここでだけ行う（純粋関数には ISO 文字列で渡す）
    zukan = updateZukan(zukan, born.species, new Date().toISOString());
    storeSave({ version: 1, zukan, satiety: state.satiety });
  } else if (state.satiety !== prev.satiety) {
    // 捕食（満腹変化）でも自動保存。変化のない tick では書き込まない
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
