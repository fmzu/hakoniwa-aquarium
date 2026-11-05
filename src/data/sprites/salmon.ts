import type { Sprite } from "../../types";

/**
 * サーモン（お寿司）。おすしのはこにわの絵をそのまま使う（原画は右向きなので左右反転して左向きにしている）。
 * frames[0]=のびる / frames[1]=ちぢむ。motionType="inch" で、のびるコマの間だけ前に進む
 */
export const salmonSprite: Sprite = {
  width: 16,
  height: 16,
  frames: [
    [
      "................",
      "................",
      "................",
      "...EEEEEEEEEE...",
      "..ESSLSSSLSHSE..",
      ".ELSSSLSSSLSHSE.",
      ".ESLSSSLSSSLSSE.",
      ".ESRRRRRDRRRRSE.",
      ".ESRRRRRRRRRRSE.",
      "..dDRRRRRRRRDd..",
      "..dDRRRRRDRRDd..",
      "..dDRRDRRRRRDd..",
      "...dddddddddd...",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      "................",
      "...EEEEEEEE.....",
      "..ESSLSSLSHE....",
      ".ESLSSLSSLSHE...",
      ".ESSLSSLSSLSE...",
      ".ESLSSLSSLSSE...",
      ".ESRRRRDRRRSE...",
      ".ESRRRRRRRRSE...",
      "..dDRRRRRRDd....",
      "..dDRRRRDRDd....",
      "..dDRDRRRRDd....",
      "...dddddddd.....",
      "................",
      "................",
      "................",
    ],
  ],
  palette: {
    R: "#FFFDF6",
    D: "#EFDFC8",
    d: "#E0CFB2",
    S: "#FF8C5F",
    L: "#FFC9A1",
    H: "#FFE6D2",
    E: "#E06A3C",
  },
  frameIntervalMs: 384,
};
