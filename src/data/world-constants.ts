/** ワールド幅。x 座標はすべて torus（mod(x, WORLD_WIDTH)）。端の分岐コードを書かない */
export const WORLD_WIDTH = 480;
export const WORLD_HEIGHT = 160;
/** ビューポート（論理解像度）。CSS で整数倍拡大する */
export const VIEW_WIDTH = 128;
export const VIEW_HEIGHT = 90;

/** 固定タイムステップ。物理定数はすべて「1 tick あたり」の値 */
export const TICK_MS = 1000 / 60;
/** 1 フレームで消化する tick 数の上限（タブ復帰時の暴走防止） */
export const MAX_TICKS_PER_FRAME = 5;

/** 線描き入力 */
export const WAYPOINT_SPACING = 4;
export const MAX_WAYPOINTS = 60;

/**
 * 主人公の移動。描いた線の上をそのまま進む（押し流されない・行き過ぎない）。
 * 速さは「ひと掻き」の周期で伸び縮みする（スプライトの掻きフレームと同期）
 */
/** ひと掻き以外のときの速さ（px/tick） */
export const HERO_SPEED_GLIDE = 0.75;
/** ひと掻き中の速さ（px/tick） */
export const HERO_SPEED_STROKE = 1.15;
export const STROKE_CYCLE_MS = 900;
export const STROKE_ACTIVE_MS = 360;
/** 1 tick ごとに速さが目標の速さへ寄る割合。出だしと止まり際のなめらかさ */
export const HERO_SPEED_EASE = 0.15;
/** 線の残りがこれ（px）未満になったら減速を始める */
export const HERO_ARRIVE_DISTANCE = 12;
/** 減速の下限（目標の速さに掛ける比率）。0 にすると線の終点に着かない */
export const HERO_ARRIVE_MIN_RATIO = 0.35;
/** 向き反転のしきい値（1 tick の x 移動量 |vx| がこれを超えたら向きを更新） */
export const FACING_FLIP_SPEED = 0.05;
/**
 * 主人公が泳げる y の範囲。線の入力もこの範囲にクランプする
 * （届かない点が線に残ると、線をなぞる移動がそこで止まってしまうため）
 */
export const HERO_MIN_Y = 10;
export const HERO_MAX_Y = 140;

/** 捕食。頭の位置（向きに応じ ±12, y−6）と餌の距離 < 8。胴では食べられない */
export const HEAD_OFFSET_X = 12;
export const HEAD_OFFSET_Y = -6;
export const EAT_DISTANCE = 8;

/** 餌（影の魚） */
export const BAIT_COUNT = 3;
export const BAIT_SPEED = 0.5;
export const BAIT_MIN_BASE_Y = 28;
export const BAIT_MAX_BASE_Y = 120;
export const BAIT_BOB_AMPLITUDE = 3;
export const BAIT_BOB_FREQUENCY = 0.002;

/** 満腹・誕生 */
export const RESIDENT_MAX = 8;

/** 演出 */
export const FLASH_DURATION_MS = 600;
/** 捕食リング（ドット）の開始半径と拡大量 */
export const FLASH_BASE_RADIUS = 3;
export const FLASH_GROW_RADIUS = 5;

/** 背景 */
export const SAND_TOP_Y = 150;
