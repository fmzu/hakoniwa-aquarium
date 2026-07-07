import { VIEW_HEIGHT, WORLD_HEIGHT } from "../data/world-constants";
import { cameraX } from "./camera-x";
import { clamp } from "./clamp";

/** 主人公を中央に追従するカメラの左上座標。x は torus、y は世界の上下端でクランプ */
export function cameraPosition(
  heroX: number,
  heroY: number,
): { camX: number; camY: number } {
  return {
    camX: cameraX(heroX),
    camY: clamp(heroY - VIEW_HEIGHT / 2, 0, WORLD_HEIGHT - VIEW_HEIGHT),
  };
}
