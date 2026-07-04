/**
 * グリッド文字列（1 文字 = 1 ドット）を描く。"." とパレット未定義文字は透明。
 * flip = true で水平鏡像（レトロ文法: 向き反転は鏡像で表現）
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  palette: Record<string, string>,
  originX: number,
  originY: number,
  flip: boolean,
): void {
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const ch = flip ? row[row.length - 1 - c] : row[c];
      const color = palette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(originX + c, originY + r, 1, 1);
      }
    }
  }
}
