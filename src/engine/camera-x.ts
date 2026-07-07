import { VIEW_WIDTH, WORLD_WIDTH } from "../data/world-constants";
import { mod } from "./mod";

/**
 * 主人公を中央に追従するカメラの左端 x 座標（torus で折り返す）。
 * カメラを状態として持たず hero.x から毎回導出する式の唯一の定義。
 * camera-position（描画）・is-out-of-view（消滅判定）・create-visitor（湧き位置）が共有する
 */
export function cameraX(heroX: number): number {
  return mod(heroX - VIEW_WIDTH / 2, WORLD_WIDTH);
}
