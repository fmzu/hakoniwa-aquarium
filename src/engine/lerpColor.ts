import { lerp } from "./lerp";

export type Rgb = [number, number, number];

export function lerpColor(from: Rgb, to: Rgb, t: number): string {
  const r = Math.round(lerp(from[0], to[0], t));
  const g = Math.round(lerp(from[1], to[1], t));
  const b = Math.round(lerp(from[2], to[2], t));
  return `rgb(${r},${g},${b})`;
}
