import {
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../data/world-constants";
import { clamp } from "./clamp";
import { mod } from "./mod";

/** 主人公を中央に追従するカメラの左上座標。x は torus、y は世界の上下端でクランプ */
export function cameraPosition(
  heroX: number,
  heroY: number,
): { camX: number; camY: number } {
  return {
    camX: mod(heroX - VIEW_WIDTH / 2, WORLD_WIDTH),
    camY: clamp(heroY - VIEW_HEIGHT / 2, 0, WORLD_HEIGHT - VIEW_HEIGHT),
  };
}
