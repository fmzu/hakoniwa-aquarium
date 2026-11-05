import type { SpeciesId, Sprite } from "../types";
import { clioneSprite } from "./sprites/clione";
import { maguroSprite } from "./sprites/maguro";
import { ramuneFishSprite } from "./sprites/ramune-fish";
import { salmonSprite } from "./sprites/salmon";
import { seahorseSprite } from "./sprites/seahorse";
import { shrimpSprite } from "./sprites/shrimp";
import { squidSprite } from "./sprites/squid";
import { strawberryJellySprite } from "./sprites/strawberry-jelly";
import { taiyakiSprite } from "./sprites/taiyaki";
import { tamagoSprite } from "./sprites/tamago";

/** 住民スプライトの種別対応表。draw-scene と draw-birth-fx で共用する */
export const RESIDENT_SPRITES: Record<SpeciesId, Sprite> = {
  ramuneFish: ramuneFishSprite,
  strawberryJelly: strawberryJellySprite,
  taiyaki: taiyakiSprite,
  shrimp: shrimpSprite,
  seahorse: seahorseSprite,
  clione: clioneSprite,
  squid: squidSprite,
  salmon: salmonSprite,
  maguro: maguroSprite,
  tamago: tamagoSprite,
};
