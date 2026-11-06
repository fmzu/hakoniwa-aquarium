import { SPECIES_IDS } from "../data/species-ids";
import { SPECIES_NAMES } from "../data/species-names";
import type { SpeciesId } from "../types";

/**
 * 動作確認用パネル（?debug のときだけ出す）。種ごとの「今すぐ誕生」ボタンと、
 * 図鑑と満腹を初期化してやり直すボタンを画面左下に置く
 */
export function attachDebugPanel(
  onBirth: (species: SpeciesId) => void,
  onReset: () => void,
): void {
  const panel = document.createElement("div");
  panel.id = "debug-panel";
  const title = document.createElement("p");
  title.textContent = "動作確認: 今すぐ誕生";
  panel.append(title);
  for (const species of SPECIES_IDS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = SPECIES_NAMES[species];
    button.addEventListener("click", () => onBirth(species));
    panel.append(button);
  }
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "debug-reset";
  reset.textContent = "図鑑をリセット";
  reset.addEventListener("click", onReset);
  panel.append(reset);
  document.body.append(panel);
}
