export type Vec2 = { x: number; y: number };

export type Hero = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** -1 = 左向き（スプライト原画の向き）, 1 = 右向き（鏡像反転で描く） */
  facing: -1 | 1;
};

export type Bait = {
  x: number;
  /** 上下の揺れの中心となる y */
  baseY: number;
  y: number;
  dir: -1 | 1;
  /** 揺れの位相オフセット（個体差） */
  phase: number;
};

export type SpeciesId = "ramuneFish" | "strawberryJelly";

export type Resident = {
  species: SpeciesId;
  x: number;
  baseY: number;
  y: number;
  dir: -1 | 1;
  phase: number;
};

/** 捕食・誕生時の白リング（誕生演出の本実装は M2。これはプレースホルダ） */
export type Flash = {
  x: number;
  y: number;
  bornAt: number;
  small: boolean;
};

export type GameState = {
  hero: Hero;
  /** 線描き入力のウェイポイント列。先頭から消費する */
  path: Vec2[];
  baits: Bait[];
  residents: Resident[];
  flashes: Flash[];
  satiety: number;
  /** ゲーム内経過時間（ms）。tick ごとに TICK_MS 加算。アニメ・揺れの位相に使う */
  elapsedMs: number;
};

export type Sprite = {
  width: number;
  height: number;
  /** frames[n] は行文字列の配列。1 文字 = 1 ドット。"." = 透明 */
  frames: string[][];
  /** 文字 → 色。種ごとに独立（グローバル共有パレット禁止） */
  palette: Record<string, string>;
  /** 2 フレームアニメの切り替え間隔（ms）。アニメなしは 0 */
  frameIntervalMs: number;
};
