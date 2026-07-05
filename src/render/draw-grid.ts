/**
 * グリッド文字列（1 文字 = 1 ドット）を描く。"." とパレット未定義文字は透明。
 * flip = true で水平鏡像（レトロ文法: 向き反転は鏡像で表現）。
 * 原点は整数に丸めてサブピクセルのにじみを防ぐ（スプライト内の相対位置は
 * 整数なので、原点だけ丸めれば全ドットが整数座標になる）
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  palette: Record<string, string>,
  originX: number,
  originY: number,
  flip: boolean,
): void {
  const ox = Math.round(originX);
  const oy = Math.round(originY);
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const ch = flip ? row[row.length - 1 - c] : row[c];
      const color = palette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(ox + c, oy + r, 1, 1);
      }
    }
  }
}
