import type { SpeciesId, Sprite } from "../types";
import { clioneSprite } from "./sprites/clione";
import { ramuneFishSprite } from "./sprites/ramune-fish";
import { seahorseSprite } from "./sprites/seahorse";
import { shrimpSprite } from "./sprites/shrimp";
import { squidSprite } from "./sprites/squid";
import { strawberryJellySprite } from "./sprites/strawberry-jelly";
import { taiyakiSprite } from "./sprites/taiyaki";

/** 住民スプライトの種別対応表。draw-scene と draw-birth-fx で共用する */
export const RESIDENT_SPRITES: Record<SpeciesId, Sprite> = {
  ramuneFish: ramuneFishSprite,
  strawberryJelly: strawberryJellySprite,
  taiyaki: taiyakiSprite,
  shrimp: shrimpSprite,
  seahorse: seahorseSprite,
  clione: clioneSprite,
  squid: squidSprite,
};
