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

export type SpeciesId = "ramuneFish" | "strawberryJelly" | "taiyaki";

/**
 * 種のサイズ階級。満員誕生の押し出しは同階級同士でのみ起きる
 * （同階級不在時は全住民へフォールバック）。現 3 種は全て "S"
 */
export type SizeClass = "SS" | "S" | "M" | "L" | "LL";

export type Resident = {
  species: SpeciesId;
  x: number;
  baseY: number;
  y: number;
  dir: -1 | 1;
  phase: number;
  /**
   * 誕生時刻（ゲーム内 elapsedMs）。
   * elapsedMs - bornAtMs < BIRTH_FX_TOTAL_MS の間は誕生演出中＝静止。
   * 演出を再生しない住民（テストフィクスチャ等）は十分過去の値（例: -10000）にする
   */
  bornAtMs: number;
  /**
   * 到着時刻（ゲーム内 elapsedMs）。来訪記録として保持する。
   * 押し出し判定には使わない（最古参ルールは不採用。docs/design/2026-07-07-session-roster.md 参照）
   */
  arrivedAtMs: number;
  /** 退場予定フラグ。true の住民は通常通り泳ぎ続け、視界外（余白込み）に出た瞬間に消える */
  departing: boolean;
};

/** 捕食時の白ドットリング */
export type Flash = {
  x: number;
  y: number;
  bornAt: number;
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
  /**
   * 次回の来訪チェック時刻（ゲーム内 elapsedMs）。セーブしない
   * （顔ぶれと同じく毎セッション初期化。到達すると VISIT_INTERVAL_MS 先へ進む）
   */
  nextVisitCheckMs: number;
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

/** 図鑑の 1 種ぶんの記録。将来の拡張（回遊レアの目撃など）はフィールド追加＋version 更新で行う */
export type ZukanEntry = {
  /** 初発見日時（ISO 8601 文字列）。現実時刻の取得は境界層（main.ts）でのみ行う */
  firstDiscoveredAt: string;
  /** 累計誕生数 */
  birthCount: number;
};

/** 図鑑。未発見の種はキーごと存在しない */
export type Zukan = Partial<Record<SpeciesId, ZukanEntry>>;

/** localStorage に保存するセーブデータ全体。version はスキーマ番号（初版は 1） */
export type SaveData = {
  version: 1;
  zukan: Zukan;
  satiety: number;
};
