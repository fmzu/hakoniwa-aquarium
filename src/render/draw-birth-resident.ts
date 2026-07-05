import {
  BIRTH_FX_DYE_BOUNDARY_COLOR,
  BIRTH_FX_SILHOUETTE_COLOR,
} from "../data/birth-fx-constants";

/**
 * 誕生中の住民を描く。drawGrid と同じグリッド文法だが、列ごとに
 * フレーバー色（boundaryColumn 未満）／白境界（=== boundaryColumn）／シルエット（それ以降）を塗り分ける。
 * boundaryColumn === null は全シルエット。境界はスプライト座標（列 0 = 頭側）で判定するので
 * 鏡像反転時も見た目は頭から染まる
 */
export function drawBirthResident(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  palette: Record<string, string>,
  originX: number,
  originY: number,
  flip: boolean,
  boundaryColumn: number | null,
): void {
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const spriteColumn = flip ? row.length - 1 - c : c;
      const color = palette[row[spriteColumn]];
      if (!color) continue;
      let fill = BIRTH_FX_SILHOUETTE_COLOR;
      if (boundaryColumn !== null) {
        if (spriteColumn < boundaryColumn) fill = color;
        else if (spriteColumn === boundaryColumn)
          fill = BIRTH_FX_DYE_BOUNDARY_COLOR;
      }
      ctx.fillStyle = fill;
      ctx.fillRect(originX + c, originY + r, 1, 1);
    }
  }
}
