/** 床除算の剰余。JS の % と違い負の値でも正の範囲に折り返す */
export function mod(value: number, n: number): number {
  return ((value % n) + n) % n;
}
