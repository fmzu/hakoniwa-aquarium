import {
  HEAD_OFFSET_X,
  HEAD_OFFSET_Y,
  WORLD_WIDTH,
} from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Hero, Vec2 } from "../types";

/** 主人公の頭（口先）のワールド座標。捕食は頭でのみ成立する（胴では食べられない） */
export function headPosition(hero: Pick<Hero, "x" | "y" | "facing">): Vec2 {
  return {
    x: mod(hero.x + hero.facing * HEAD_OFFSET_X, WORLD_WIDTH),
    y: hero.y + HEAD_OFFSET_Y,
  };
}
