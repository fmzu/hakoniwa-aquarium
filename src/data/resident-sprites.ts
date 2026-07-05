import type { SpeciesId, Sprite } from "../types";
import { ramuneFishSprite } from "./sprites/ramune-fish";
import { strawberryJellySprite } from "./sprites/strawberry-jelly";

/** 住民スプライトの種別対応表。draw-scene と draw-birth-fx で共用する */
export const RESIDENT_SPRITES: Record<SpeciesId, Sprite> = {
  ramuneFish: ramuneFishSprite,
  strawberryJelly: strawberryJellySprite,
};
