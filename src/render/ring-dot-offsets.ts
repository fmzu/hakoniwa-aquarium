import type { Vec2 } from "../types";

/**
 * 半径 radius の円周を 1px ドットで近似した相対座標列を返す。決定的（乱数不使用）。
 * 論理キャンバスへのベクター描画（arc）を使わないためのドット規律の基盤
 */
export function ringDotOffsets(radius: number): Vec2[] {
  const r = Math.max(0, Math.round(radius));
  if (r === 0) return [{ x: 0, y: 0 }];
  const steps = Math.max(8, Math.ceil(Math.PI * 2 * r));
  const seen = new Set<string>();
  const dots: Vec2[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    // Math.round は -0 を返しうるため +0 を足して 0 に正規化する
    const x = Math.round(Math.cos(angle) * r) + 0;
    const y = Math.round(Math.sin(angle) * r) + 0;
    const key = `${x},${y}`;
    if (!seen.has(key)) {
      seen.add(key);
      dots.push({ x, y });
    }
  }
  return dots;
}
