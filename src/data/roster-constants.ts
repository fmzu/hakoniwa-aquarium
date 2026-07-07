/** セッション開始時の顔ぶれ抽選数の範囲。発見数が少なければ発見数まで */
export const ROSTER_MIN = 2;
export const ROSTER_MAX = 4;

/**
 * 来訪チェックの間隔（ゲーム内 ms）。約 5 分に 1 回抽選する。
 * 来訪を止めたいときは VISIT_CHANCE を 0 にする
 * （これを 0 にするとチェックが毎 tick 発火するので触らない）
 */
export const VISIT_INTERVAL_MS = 300000;
/** 来訪チェック当選確率 [0, 1]。0 で来訪なし */
export const VISIT_CHANCE = 0.5;

/**
 * 来訪者のスポーン位置: 視界端から外側への余白（px）。
 * スプライト幅 16 が完全に隠れる値にする（登場が「画面外から泳いでくる」に見える）
 */
export const VISIT_SPAWN_MARGIN_PX = 16;

/**
 * 退場予定住民の消滅判定: 視界端から外側への余白（px）。
 * スプライト半幅 8 + 数 px。退場演出はないため、完全に見えなくなってから静かに消す
 */
export const DESPAWN_MARGIN_PX = 12;
