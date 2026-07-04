import { mod } from "./mod";

/** torus 上の符号付き最短距離 a−b。戻り値は (-width/2, width/2] */
export function torusDistance(a: number, b: number, width: number): number {
  const d = mod(a - b, width);
  return d > width / 2 ? d - width : d;
}
