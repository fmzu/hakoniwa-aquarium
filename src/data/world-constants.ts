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
/** ウェイポイントに「到達した」とみなす距離 */
export const WAYPOINT_REACH = 5;
/** 入力の y クランプ（画面端ギリギリを描かせない） */
export const INPUT_MIN_Y = 6;
export const INPUT_MAX_Y = WORLD_HEIGHT - 8;

/** 推進・水流・抗力 */
export const BASE_THRUST = 0.013;
export const STROKE_THRUST = 0.045;
export const STROKE_CYCLE_MS = 900;
export const STROKE_ACTIVE_MS = 360;
export const DRAG = 0.96;
/**
 * 水流（+x 方向）。設計原則: 水流の終端速度 < 主人公の持続推進。
 * これを破ると左移動不能になりリング世界が壊れる
 */
export const CURRENT_VX = 0.008;
/** 向き反転のしきい値（|vx| がこれを超えたら向きを更新） */
export const FACING_FLIP_SPEED = 0.05;
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
export const SATIETY_MAX = 5;
export const RESIDENT_MAX = 8;
export const RESIDENT_MIN_BASE_Y = 24;
export const RESIDENT_MAX_BASE_Y = 118;

/** 演出 */
export const FLASH_DURATION_MS = 600;
/** 捕食リング（ドット）の開始半径と拡大量 */
export const FLASH_BASE_RADIUS = 3;
export const FLASH_GROW_RADIUS = 5;

/** 背景 */
export const SAND_TOP_Y = 150;

/** 起動時に図鑑（発見済みの種）から泳がせる住民の最大数 */
export const STARTING_RESIDENT_MAX = 3;
