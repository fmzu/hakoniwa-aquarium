import { WORLD_HEIGHT } from "../data/world-constants";
import { clamp } from "../engine/clamp";
import { lerpColor, type Rgb } from "../engine/lerp-color";

const SHALLOW: Rgb = [168, 221, 224]; // #A8DDE0
const MID: Rgb = [44, 93, 116]; // #2C5D74
const DEEP: Rgb = [27, 58, 75]; // #1B3A4B

/** 深度 y（ワールド座標）を背景色に変換する。3 色 2 段 lerp */
export function depthColor(y: number): string {
  const t = clamp(y / WORLD_HEIGHT, 0, 1);
  return t < 0.5
    ? lerpColor(SHALLOW, MID, t * 2)
    : lerpColor(MID, DEEP, (t - 0.5) * 2);
}
