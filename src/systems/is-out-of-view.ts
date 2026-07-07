import { DESPAWN_MARGIN_PX } from "../data/roster-constants";
import { VIEW_WIDTH, WORLD_WIDTH } from "../data/world-constants";
import { cameraX } from "../engine/camera-x";
import { torusDistance } from "../engine/torus-distance";

/**
 * 世界座標 x が視界（余白込み）の外か。退場予定住民の消滅判定に使う。
 * カメラは主人公追従なので camX を hero.x から導出する
 * （cameraX と同じ式。stepWorld にカメラを入力させない）。
 * 余白 DESPAWN_MARGIN_PX はスプライト半幅 + 数 px（完全に見えなくなってから消す）
 */
export function isOutOfView(x: number, heroX: number): boolean {
  const camX = cameraX(heroX);
  const screenX = torusDistance(x, camX, WORLD_WIDTH);
  return (
    screenX < -DESPAWN_MARGIN_PX || screenX > VIEW_WIDTH + DESPAWN_MARGIN_PX
  );
}
