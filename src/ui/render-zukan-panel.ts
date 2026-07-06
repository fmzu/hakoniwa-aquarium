import { RESIDENT_SPRITES } from "../data/resident-sprites";
import { SPECIES_IDS } from "../data/species-ids";
import { SPECIES_NAMES } from "../data/species-names";
import { drawGrid } from "../render/draw-grid";
import { shadowPalette } from "../render/shadow-palette";
import type { Zukan } from "../types";

/**
 * 図鑑パネルの中身（カード一覧）を描き直す。開くたびに全カードを作り直す。
 * スプライトは既存グリッドデータを小 canvas に描く（画像ファイル不要・pixelated）。
 * 未発見は影パレット＋「？」で表示する
 */
export function renderZukanPanel(container: HTMLElement, zukan: Zukan): void {
  container.replaceChildren();
  for (const speciesId of SPECIES_IDS) {
    const entry = zukan[speciesId];
    const sprite = RESIDENT_SPRITES[speciesId];

    const canvas = document.createElement("canvas");
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    canvas.className = "zukan-sprite";
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const palette = entry ? sprite.palette : shadowPalette(sprite.palette);
      drawGrid(ctx, sprite.frames[0], palette, 0, 0, false);
    }

    const name = document.createElement("div");
    name.className = "zukan-name";
    name.textContent = entry ? SPECIES_NAMES[speciesId] : "？";

    const meta = document.createElement("div");
    meta.className = "zukan-meta";
    meta.textContent = entry
      ? `はじめて: ${new Date(entry.firstDiscoveredAt).toLocaleDateString("ja-JP")}\nうまれた数: ${entry.birthCount}`
      : "";

    const card = document.createElement("div");
    card.className = "zukan-card";
    card.append(canvas, name, meta);
    container.append(card);
  }
}
