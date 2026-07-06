import type { Zukan } from "../types";
import { renderZukanPanel } from "./render-zukan-panel";

/**
 * 「ずかん」ボタンとパネルの開閉を配線する。開いてもゲームは止めない。
 * 図鑑は開くたびに getZukan() で最新を取り直して描く
 */
export function attachZukanUi(getZukan: () => Zukan): void {
  const button = document.querySelector<HTMLButtonElement>("#zukan-button");
  const panel = document.querySelector<HTMLElement>("#zukan-panel");
  const cards = document.querySelector<HTMLElement>("#zukan-cards");
  const close = document.querySelector<HTMLButtonElement>("#zukan-close");
  if (!button || !panel || !cards || !close) {
    throw new Error("図鑑 UI の要素が見つからない");
  }
  button.addEventListener("click", () => {
    renderZukanPanel(cards, getZukan());
    panel.hidden = false;
  });
  close.addEventListener("click", () => {
    panel.hidden = true;
  });
  panel.addEventListener("click", (event) => {
    // 背景（パネル自身）のクリックでも閉じる。カード上のクリックは閉じない
    if (event.target === panel) panel.hidden = true;
  });
}
