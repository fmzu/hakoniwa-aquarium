import { BIRTH_FX_SILHOUETTE_COLOR } from "../data/birth-fx-constants";

/**
 * 図鑑の未発見表示用に、パレットの全色を影色に置き換える（非破壊）。
 * 誕生演出のシルエット（#0F1E27）と同じ色を使い世界観を揃える。
 * "."（透明）はもともとパレットにないので影にならない＝輪郭だけ残る
 */
export function shadowPalette(
  palette: Record<string, string>,
): Record<string, string> {
  const shadow: Record<string, string> = {};
  for (const key of Object.keys(palette)) {
    shadow[key] = BIRTH_FX_SILHOUETTE_COLOR;
  }
  return shadow;
}
