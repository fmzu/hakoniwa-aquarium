import { drawGrid } from "../render/draw-grid";
import { zukanIcon } from "./zukan-icon";

/** 図鑑ボタン内の canvas にアイコンを描く。アニメなしなので起動時に 1 回だけ呼ぶ */
export function renderZukanIcon(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#zukan-icon");
  if (!canvas) throw new Error("canvas #zukan-icon が見つからない");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("図鑑アイコンの 2D コンテキストを取得できない");
  drawGrid(ctx, zukanIcon.frames[0], zukanIcon.palette, 0, 0, false);
}
