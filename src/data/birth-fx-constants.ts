/** 誕生演出の合計時間（ms）。この間は新入りが静止する */
export const BIRTH_FX_TOTAL_MS = 2500;

/** 暗転: 0〜300ms でフェードイン、2300〜2500ms でフェードアウト */
export const BIRTH_FX_DARKEN_IN_END_MS = 300;
export const BIRTH_FX_DARKEN_OUT_START_MS = 2300;
/** 暗転の最大アルファ。強さは実機で微調整する */
export const BIRTH_FX_DARKEN_MAX_ALPHA = 0.55;
/** 暗転色（水色系の暗色）。rgba() の R,G,B 部分 */
export const BIRTH_FX_DARKEN_RGB = "9, 22, 33";

/** 泡: 0〜900ms で順に立ち上り、リング期にフェードアウト */
export const BIRTH_FX_BUBBLE_COUNT = 8;
/** 泡 1 個ごとの出現遅延（ms）。index × この値だけ遅れて出る */
export const BIRTH_FX_BUBBLE_DELAY_MS = 90;
/** 泡の上昇速度（px/ms） */
export const BIRTH_FX_BUBBLE_RISE_PER_MS = 0.02;
/** 泡の出現位置: 演出中心から何 px 下で生まれるか */
export const BIRTH_FX_BUBBLE_START_DY = 8;
/** 泡の左右揺らぎの角速度（rad/ms）。sin の位相の進み */
export const BIRTH_FX_BUBBLE_SWAY_FREQ = 0.006;
/** 泡の左右揺らぎの振幅（px）。丸め前の sin の係数 */
export const BIRTH_FX_BUBBLE_SWAY_AMP = 1.5;
/** 泡の色。rgba() の R,G,B 部分 */
export const BIRTH_FX_BUBBLE_RGB = "234, 248, 255";

/** シルエット出現（700ms）→ 染まり（900〜1700ms） */
export const BIRTH_FX_SILHOUETTE_AT_MS = 700;
export const BIRTH_FX_SILHOUETTE_COLOR = "#0F1E27";
export const BIRTH_FX_DYE_START_MS = 900;
export const BIRTH_FX_DYE_END_MS = 1700;
/** 染まり境界の 1 列の色 */
export const BIRTH_FX_DYE_BOUNDARY_COLOR = "#FFFFFF";

/** リング拡大＋キャンディ粒飛散（1700〜2300ms） */
export const BIRTH_FX_RING_START_MS = 1700;
export const BIRTH_FX_RING_END_MS = 2300;
export const BIRTH_FX_RING_BASE_RADIUS = 3;
export const BIRTH_FX_RING_MAX_RADIUS = 14;
export const BIRTH_FX_CANDY_COUNT = 10;
/** 金平糖色。種のパレット色と混ぜて使う */
export const BIRTH_FX_CANDY_COLOR = "#FFE39A";
/** キャンディ粒の最大飛散距離（px） */
export const BIRTH_FX_CANDY_MAX_DIST = 12;
