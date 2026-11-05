import type { Sprite } from "../../types";

/**
 * たまご（お寿司）。おすしのはこにわの絵をそのまま使う（原画は右向きなので左右反転して左向きにしている）。
 * frames[0]=のびる / frames[1]=ちぢむ。motionType="inch" で、のびるコマの間だけ前に進む
 */
export const tamagoSprite: Sprite = {
  width: 16,
  height: 16,
  frames: [
    [
      "................",
      "................",
      "................",
      "...EEEEBBEEEE...",
      "..ESSLSBBLSHSE..",
      ".ELSSSLBBSLSHSE.",
      ".ESLSSSBBSSLSSE.",
      ".ESRRRRBBRRRRSE.",
      ".ESRRRRBBRRRRSE.",
      "..dDRRRBBRRRDd..",
      "..dDRRRBBDRRDd..",
      "..dDRRDBBRRRDd..",
      "...ddddBBdddd...",
      "................",
      "................",
      "................",
    ],
    [
      "................",
      "................",
      "...EEEBBEEE.....",
      "..ESSLBBLSHE....",
      ".ESLSSBBSLSHE...",
      ".ESSLSBBSSLSE...",
      ".ESLSSBBSLSSE...",
      ".ESRRRBBRRRSE...",
      ".ESRRRBBRRRSE...",
      "..dDRRBBRRDd....",
      "..dDRRBBDRDd....",
      "..dDRDBBRRDd....",
      "...dddBBddd.....",
      "................",
      "................",
      "................",
    ],
  ],
  palette: {
    R: "#FFFDF6",
    D: "#EFDFC8",
    d: "#E0CFB2",
    S: "#FFD24A",
    L: "#FFE285",
    H: "#FFF2BC",
    E: "#E8A23E",
    B: "#414F44",
  },
  frameIntervalMs: 304,
};
