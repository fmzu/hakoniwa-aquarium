# 誕生演出 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プレースホルダの白リングだった誕生演出を、暗転→泡→シルエット→染まり→ドットリング＋キャンディ粒の約2.5秒シーケンスに置き換える。

**Architecture:** Resident に `bornAtMs` を追加し、演出中（2500ms）は `stepResident` が移動をスキップして静止させる。演出の時間進行・座標計算はすべて純粋関数（`render/` 配下、bun test で TDD）に切り出し、Canvas 描画関数は薄く保つ。描画順は「通常要素 → 均一暗転オーバーレイ → 新入り＋演出 → HUD」。既存の捕食小リング（ctx.arc）もドット化し、論理キャンバスへのベクター描画を全廃する。

**Tech Stack:** TypeScript + Vite + Canvas 2D。テストは bun test。lint/format は biome。一関数一ファイル・kebab-case 厳守。

---

## 前提・検証コマンド

- 作業ディレクトリ: `/Users/f/hakoniwa-aquarium`
- テスト: `bun test`（部分実行は `bun test <ファイル名の一部>`）
- 型検査: `bunx tsc --noEmit`
- lint: `bun run lint`（自動修正は `bunx biome check --write .`）
- ビルド: `bun run build`
- コミット規約: `feat:` / `fix:` / `refactor:` / `tune:` / `docs:` + 日本語サマリ

## ファイル構成（この計画で触るファイル）

新規作成:

| ファイル | 責務 |
|---|---|
| `src/data/birth-fx-constants.ts` | 誕生演出の全定数（時間・泡数・半径・色） |
| `src/render/ring-dot-offsets.ts` (+test) | 半径→円周上の1pxドット相対座標列（決定的） |
| `src/render/draw-ring-dots.ts` | ドットリング描画（捕食リングと誕生リングで共用） |
| `src/systems/is-birth-fx-active.ts` (+test) | 誕生演出中かの判定（stepResident と draw-scene で共用） |
| `src/render/birth-fx-phase.ts` (+test) | 誕生からの経過ms→各トラックの進行度（暗転α・泡α・染まり・リング） |
| `src/render/dye-boundary-column.ts` (+test) | 染まり進行度→境界列インデックス |
| `src/render/birth-bubble-point.ts` (+test) | 泡インデックス＋経過ms→相対座標とサイズ（乱数不使用） |
| `src/render/birth-candy-point.ts` (+test) | キャンディ粒インデックス＋進行度→相対座標（乱数不使用） |
| `src/data/resident-sprites.ts` | 種別→スプライトの対応表（draw-scene から移動） |
| `src/render/is-resident-flipped.ts` (+test) | 住民の鏡像反転判定（draw-scene から抽出） |
| `src/render/draw-darken-overlay.ts` | 均一暗転オーバーレイ描画 |
| `src/render/draw-birth-resident.ts` | シルエット／列単位染まり／白境界つきスプライト描画 |
| `src/render/draw-birth-fx.ts` | 誕生演出の合成描画（泡→新入り→リング＋キャンディ） |

変更:

| ファイル | 変更内容 |
|---|---|
| `src/types.ts` | `Resident.bornAtMs` 追加、`Flash.small` 削除 |
| `src/data/world-constants.ts` | 捕食リングの半径定数を追加 |
| `src/systems/step-world.ts` | 誕生時に `bornAtMs` 付与・大フラッシュ発行を削除・位相を演出明け同期に |
| `src/systems/step-world.test.ts` | 上記に合わせた期待値修正 |
| `src/systems/step-resident.ts` | 演出中は静止 |
| `src/systems/step-resident.test.ts` | フィクスチャ修正＋静止テスト追加 |
| `src/render/draw-scene.ts` | 捕食リングのドット化、誕生演出の描画順統合 |

Canvas を直接触る描画関数（draw-*）はプロジェクト方針によりユニットテストを書かない。ロジックはすべて純粋関数側に置く。

---

### Task 1: 誕生演出の定数ファイル

**Files:**
- Create: `src/data/birth-fx-constants.ts`
- Modify: `src/data/world-constants.ts`

- [ ] **Step 1: 定数ファイルを作成**

`src/data/birth-fx-constants.ts`:

```ts
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
```

- [ ] **Step 2: 捕食リングの半径定数を world-constants に追加**

`src/data/world-constants.ts` の `/** 演出 */` セクションを変更:

```ts
/** 演出 */
export const FLASH_DURATION_MS = 600;
/** 捕食リング（ドット）の開始半径と拡大量 */
export const FLASH_BASE_RADIUS = 3;
export const FLASH_GROW_RADIUS = 5;
```

- [ ] **Step 3: 検証**

Run: `bunx tsc --noEmit && bun run lint`
Expected: エラーなし（未使用 export は biome では警告されない）

- [ ] **Step 4: コミット**

```bash
git add src/data/birth-fx-constants.ts src/data/world-constants.ts
git commit -m "feat: 誕生演出の定数ファイルを追加"
```

---

### Task 2: リングの1pxドット座標列 ringDotOffsets（TDD）

角度を等分サンプリングして丸め、重複を除去する。半径に対しステップ数 `max(8, ceil(2πr))` なので抜けが出ない。決定的（乱数・時刻不使用）。

**Files:**
- Create: `src/render/ring-dot-offsets.ts`
- Test: `src/render/ring-dot-offsets.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/render/ring-dot-offsets.test.ts`:

```ts
import { expect, test } from "bun:test";
import { ringDotOffsets } from "./ring-dot-offsets";

test("半径 0 は中心 1 ドット", () => {
  expect(ringDotOffsets(0)).toEqual([{ x: 0, y: 0 }]);
});

test("半径 1 は中心を囲む 8 ドット", () => {
  // steps = max(8, ceil(2π)) = 8。45° 刻みの丸めで 8 方向すべて埋まる
  const dots = ringDotOffsets(1);
  expect(dots.length).toBe(8);
  expect(dots).toContainEqual({ x: 1, y: 0 });
  expect(dots).toContainEqual({ x: -1, y: 0 });
  expect(dots).toContainEqual({ x: 0, y: 1 });
  expect(dots).toContainEqual({ x: 0, y: -1 });
});

test("全ドットが円周 ±0.75px に乗る（半径 5）", () => {
  for (const d of ringDotOffsets(5)) {
    expect(Math.abs(Math.hypot(d.x, d.y) - 5)).toBeLessThanOrEqual(0.75);
  }
});

test("重複ドットがない（半径 4）", () => {
  const dots = ringDotOffsets(4);
  const keys = new Set(dots.map((d) => `${d.x},${d.y}`));
  expect(keys.size).toBe(dots.length);
});

test("小数半径は丸められ決定的（3.4 → 3 と同一）", () => {
  expect(ringDotOffsets(3.4)).toEqual(ringDotOffsets(3));
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test ring-dot-offsets`
Expected: FAIL（`Cannot find module './ring-dot-offsets'`）

- [ ] **Step 3: 実装**

`src/render/ring-dot-offsets.ts`:

```ts
import type { Vec2 } from "../types";

/**
 * 半径 radius の円周を 1px ドットで近似した相対座標列を返す。決定的（乱数不使用）。
 * 論理キャンバスへのベクター描画（arc）を使わないためのドット規律の基盤
 */
export function ringDotOffsets(radius: number): Vec2[] {
  const r = Math.max(0, Math.round(radius));
  if (r === 0) return [{ x: 0, y: 0 }];
  const steps = Math.max(8, Math.ceil(Math.PI * 2 * r));
  const seen = new Set<string>();
  const dots: Vec2[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const x = Math.round(Math.cos(angle) * r);
    const y = Math.round(Math.sin(angle) * r);
    const key = `${x},${y}`;
    if (!seen.has(key)) {
      seen.add(key);
      dots.push({ x, y });
    }
  }
  return dots;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `bun test ring-dot-offsets`
Expected: PASS（5 tests）

- [ ] **Step 5: コミット**

```bash
git add src/render/ring-dot-offsets.ts src/render/ring-dot-offsets.test.ts
git commit -m "feat: リングの1pxドット座標列 ringDotOffsets を追加"
```

---

### Task 3: ドットリング描画 drawRingDots

Canvas 描画のためテストなし。捕食リングと誕生リングの両方から呼ぶ。

**Files:**
- Create: `src/render/draw-ring-dots.ts`

- [ ] **Step 1: 実装**

`src/render/draw-ring-dots.ts`:

```ts
import { ringDotOffsets } from "./ring-dot-offsets";

/** 1px ドットで円環を描く。中心は整数に丸めてドットのにじみを防ぐ */
export function drawRingDots(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
): void {
  const cx = Math.round(centerX);
  const cy = Math.round(centerY);
  ctx.fillStyle = color;
  for (const dot of ringDotOffsets(radius)) {
    ctx.fillRect(cx + dot.x, cy + dot.y, 1, 1);
  }
}
```

- [ ] **Step 2: 検証**

Run: `bunx tsc --noEmit && bun run lint`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/render/draw-ring-dots.ts
git commit -m "feat: ドットリング描画 drawRingDots を追加"
```

---

### Task 4: 型変更（bornAtMs 追加・Flash.small 廃止）と全使用箇所の更新

型変更は分割できないため、このタスクだけ範囲が広い。`Resident.bornAtMs` 追加・`Flash.small` 削除・step-world の大フラッシュ発行削除・捕食リングのドット化・既存テスト修正を一括で行い、green に戻してからコミットする。

**Files:**
- Modify: `src/types.ts`
- Modify: `src/systems/step-world.ts`
- Modify: `src/systems/step-world.test.ts`
- Modify: `src/systems/step-resident.test.ts`
- Modify: `src/render/draw-scene.ts`

- [ ] **Step 1: types.ts を変更**

`Resident` と `Flash` を以下に置き換える:

```ts
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
};
```

```ts
/** 捕食時の白ドットリング */
export type Flash = {
  x: number;
  y: number;
  bornAt: number;
};
```

- [ ] **Step 2: step-world.ts を変更**

変更点は 3 つ: (a) 捕食フラッシュから `small` 削除、(b) 誕生時の大フラッシュ発行を削除、(c) 新入りに `bornAtMs` を付与し、揺れ位相を「演出明けに sin 項が 0」になる値に固定する（演出中は静止 y=baseY のため、復帰した瞬間の y 飛びを防ぐ。位相は誕生時刻から決まるので個体差は残る）。

ファイル全体を以下に置き換える:

```ts
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { SPECIES_MOTION } from "../data/species-motion";
import {
  BAIT_MAX_BASE_Y,
  BAIT_MIN_BASE_Y,
  FLASH_DURATION_MS,
  RESIDENT_MAX,
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  SATIETY_MAX,
  TICK_MS,
} from "../data/world-constants";
import { clamp } from "../engine/clamp";
import { isStrokePhase } from "../engine/is-stroke-phase";
import type { Flash, GameState, Resident } from "../types";
import { headPosition } from "./head-position";
import { isBaitCaught } from "./is-bait-caught";
import { nextBirthSpecies } from "./next-birth-species";
import { respawnBait } from "./respawn-bait";
import { stepBait } from "./step-bait";
import { stepHero } from "./step-hero";
import { stepResident } from "./step-resident";

/** 1 tick の全状態更新。主人公 → 餌移動 → 捕食 → 満腹/誕生 → 住民 → フラッシュ寿命 */
export function stepWorld(state: GameState, random: () => number): GameState {
  const elapsedMs = state.elapsedMs + TICK_MS;
  const stroke = isStrokePhase(elapsedMs);
  const { hero, path } = stepHero(state.hero, state.path, stroke);
  const head = headPosition(hero);

  let satiety = state.satiety;
  let flashes: Flash[] = state.flashes.filter(
    (f) => elapsedMs - f.bornAt < FLASH_DURATION_MS,
  );

  const baits = state.baits.map((bait) => {
    const moved = stepBait(bait, elapsedMs);
    if (!isBaitCaught(moved, head)) return moved;
    satiety += 1;
    flashes = [...flashes, { x: moved.x, y: moved.y, bornAt: elapsedMs }];
    const newBaseY =
      BAIT_MIN_BASE_Y + random() * (BAIT_MAX_BASE_Y - BAIT_MIN_BASE_Y);
    return respawnBait(moved, hero.x, newBaseY);
  });

  let residents = state.residents.map((resident) =>
    stepResident(resident, elapsedMs),
  );
  if (satiety >= SATIETY_MAX) {
    satiety = 0;
    if (residents.length < RESIDENT_MAX) {
      const baseY = clamp(hero.y, RESIDENT_MIN_BASE_Y, RESIDENT_MAX_BASE_Y);
      const species = nextBirthSpecies(residents.length);
      const born: Resident = {
        species,
        x: hero.x,
        baseY,
        y: baseY,
        dir: random() < 0.5 ? -1 : 1,
        // 演出明け（bornAtMs + BIRTH_FX_TOTAL_MS）に sin 項が 0 になる位相。
        // 演出中は y=baseY で静止するため、復帰時の y 飛びを防ぐ
        phase: -(elapsedMs + BIRTH_FX_TOTAL_MS) * SPECIES_MOTION[species].bobFrequency,
        bornAtMs: elapsedMs,
      };
      residents = [...residents, born];
    }
  }

  return { hero, path, baits, residents, flashes, satiety, elapsedMs };
}
```

- [ ] **Step 3: step-world.test.ts を更新**

変更点:
- 全 Resident フィクスチャに `bornAtMs: -10000` を追加（演出済み扱い）
- 捕食テストから `small` の検証を削除
- 誕生テストを「大フラッシュを発行しない・bornAtMs と位相が正しい」検証に変更
- フラッシュ寿命テストのフィクスチャから `small` を削除

該当部分を以下のとおり書き換える（`stateWithBaitAtHead` と `経過時間` テストは変更なし）:

```ts
import { expect, test } from "bun:test";
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { SPECIES_MOTION } from "../data/species-motion";
import { TICK_MS } from "../data/world-constants";
import type { Bait, GameState, Resident } from "../types";
import { createInitialState } from "./create-initial-state";
import { stepWorld } from "./step-world";
```

```ts
test("頭の近くの餌を食べると満腹 +1 し、餌は反対側にリスポーンする", () => {
  const next = stepWorld(stateWithBaitAtHead(), fixedRandom);
  expect(next.satiety).toBe(1);
  expect(next.baits[0].x).toBeCloseTo(340.00768, 3); // mod(hero.x + 240, 480)
  expect(next.baits[0].baseY).toBe(74); // 28 + 0.5 * 92
  expect(next.flashes.length).toBe(1);
});

test("満腹 5 で誕生し、1 体目はラムネ魚", () => {
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom);
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(1);
  expect(next.residents[0].species).toBe("ramuneFish");
  expect(next.residents[0].baseY).toBe(60); // clamp(hero.y, 24, 118)
  // 大フラッシュは廃止。捕食リング 1 個だけが残る
  expect(next.flashes.length).toBe(1);
});

test("誕生した住民は bornAtMs を持ち、演出明けに y=baseY となる位相を持つ", () => {
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom);
  const born = next.residents[0];
  expect(born.bornAtMs).toBeCloseTo(TICK_MS, 5);
  // phase = -(bornAtMs + BIRTH_FX_TOTAL_MS) * bobFrequency なので sin 項は厳密に 0
  const freq = SPECIES_MOTION[born.species].bobFrequency;
  expect(
    Math.sin((born.bornAtMs + BIRTH_FX_TOTAL_MS) * freq + born.phase),
  ).toBeCloseTo(0, 5);
});

test("誕生順は固定テーブルをループする（2 体目はストロベリークラゲ）", () => {
  const existing: Resident = {
    species: "ramuneFish",
    x: 300,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
  };
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: [existing] }),
    fixedRandom,
  );
  expect(next.residents.length).toBe(2);
  expect(next.residents[1].species).toBe("strawberryJelly");
});

test("住民 8 体で満員のときは満腹がリセットされるだけで誕生しない", () => {
  const full: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
  }));
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: full }),
    fixedRandom,
  );
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(8);
});

test("古いフラッシュは 600ms で消える", () => {
  const state: GameState = {
    ...createInitialState(fixedRandom),
    elapsedMs: 1000,
    flashes: [
      { x: 10, y: 10, bornAt: 300 }, // 経過 700ms → 消える
      { x: 20, y: 20, bornAt: 900 }, // 経過 100ms → 残る
    ],
  };
  const next = stepWorld(state, fixedRandom);
  expect(next.flashes.length).toBe(1);
  expect(next.flashes[0].x).toBe(20);
});
```

- [ ] **Step 4: step-resident.test.ts のフィクスチャに bornAtMs を追加**

3 つの Resident リテラルすべてに `bornAtMs: -10000,` を追加する（`phase` の次の行）。テストの期待値は変更しない。

- [ ] **Step 5: draw-scene.ts の捕食リングをドット化**

import に追加:

```ts
import {
  FLASH_BASE_RADIUS,
  FLASH_DURATION_MS,
  FLASH_GROW_RADIUS,
  SATIETY_MAX,
  VIEW_WIDTH,
  WORLD_WIDTH,
} from "../data/world-constants";
import { drawRingDots } from "./draw-ring-dots";
```

フラッシュ描画ループ（`ctx.strokeStyle` 〜 `ctx.stroke()` を含むブロック）を以下に置き換える:

```ts
  // 捕食フラッシュ（白ドットリング。ベクター描画禁止のドット規律に従う）
  for (const flash of state.flashes) {
    const age = (state.elapsedMs - flash.bornAt) / FLASH_DURATION_MS;
    const x = torusDistance(flash.x, camX, WORLD_WIDTH);
    drawRingDots(
      ctx,
      x,
      flash.y - camY,
      FLASH_BASE_RADIUS + age * FLASH_GROW_RADIUS,
      `rgba(255,255,255,${1 - age})`,
    );
  }
```

ファイル先頭のコメントも更新: `/** 1 フレームぶんの描画。背景 → 道のり → 餌 → 住民 → 主人公 → 捕食リング → 満腹ピップ */`

- [ ] **Step 6: 全体検証**

Run: `bun test && bunx tsc --noEmit && bun run lint`
Expected: 全テスト PASS、型・lint エラーなし

- [ ] **Step 7: コミット**

```bash
git add src/types.ts src/systems/step-world.ts src/systems/step-world.test.ts src/systems/step-resident.test.ts src/render/draw-scene.ts
git commit -m "feat: Resident に bornAtMs を追加し捕食リングをドット化、誕生の大フラッシュを廃止"
```

---

### Task 5: 誕生演出のアクティブ判定 isBirthFxActive（TDD）

**Files:**
- Create: `src/systems/is-birth-fx-active.ts`
- Test: `src/systems/is-birth-fx-active.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/is-birth-fx-active.test.ts`:

```ts
import { expect, test } from "bun:test";
import { isBirthFxActive } from "./is-birth-fx-active";

test("誕生直後は演出中", () => {
  expect(isBirthFxActive(0, 0)).toBe(true);
});

test("2499ms 経過はまだ演出中", () => {
  expect(isBirthFxActive(0, 2499)).toBe(true);
});

test("2500ms 経過で演出終了", () => {
  expect(isBirthFxActive(0, 2500)).toBe(false);
});

test("bornAtMs が十分過去（初期配置相当）なら演出しない", () => {
  expect(isBirthFxActive(-10000, 0)).toBe(false);
});

test("途中誕生でも bornAtMs 基準で判定される", () => {
  expect(isBirthFxActive(1000, 2000)).toBe(true);
  expect(isBirthFxActive(1000, 3500)).toBe(false);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test is-birth-fx-active`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 実装**

`src/systems/is-birth-fx-active.ts`:

```ts
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";

/** 誕生演出中か。演出中は住民が静止し、描画は draw-birth-fx が担当する */
export function isBirthFxActive(bornAtMs: number, elapsedMs: number): boolean {
  return elapsedMs - bornAtMs < BIRTH_FX_TOTAL_MS;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `bun test is-birth-fx-active`
Expected: PASS（5 tests）

- [ ] **Step 5: コミット**

```bash
git add src/systems/is-birth-fx-active.ts src/systems/is-birth-fx-active.test.ts
git commit -m "feat: 誕生演出のアクティブ判定 isBirthFxActive を追加"
```

---

### Task 6: 演出中の住民静止（TDD）

**Files:**
- Modify: `src/systems/step-resident.ts`
- Test: `src/systems/step-resident.test.ts`

- [ ] **Step 1: 失敗するテストを追加**

`src/systems/step-resident.test.ts` に追記:

```ts
test("誕生演出中は移動も揺れもしない", () => {
  const newborn: Resident = {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: 0,
  };
  const next = stepResident(newborn, 1000);
  expect(next.x).toBe(100);
  expect(next.y).toBe(60);
});

test("演出時間（2500ms）経過後は通常挙動に戻る", () => {
  const newborn: Resident = {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: 0,
  };
  const next = stepResident(newborn, 2500);
  expect(next.x).toBe(100.25);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test step-resident`
Expected: 「誕生演出中は移動も揺れもしない」が FAIL（x が 100.25 になる）

- [ ] **Step 3: 実装**

`src/systems/step-resident.ts` を以下に置き換える:

```ts
import { SPECIES_MOTION } from "../data/species-motion";
import { WORLD_WIDTH } from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Resident } from "../types";
import { isBirthFxActive } from "./is-birth-fx-active";

/**
 * 住民の 1 tick 更新。種ごとの速度で周回し、種ごとの振幅・周期で揺れる。
 * 誕生演出中は静止する（演出明けの位相は stepWorld が y=baseY に合わせて設定済み）
 */
export function stepResident(resident: Resident, elapsedMs: number): Resident {
  if (isBirthFxActive(resident.bornAtMs, elapsedMs)) return resident;
  const motion = SPECIES_MOTION[resident.species];
  return {
    ...resident,
    x: mod(resident.x + resident.dir * motion.speed, WORLD_WIDTH),
    y:
      resident.baseY +
      Math.sin(elapsedMs * motion.bobFrequency + resident.phase) *
        motion.bobAmplitude,
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `bun test step-resident && bun test step-world`
Expected: 全 PASS（既存フィクスチャは bornAtMs: -10000 なので影響なし）

- [ ] **Step 5: コミット**

```bash
git add src/systems/step-resident.ts src/systems/step-resident.test.ts
git commit -m "feat: 誕生演出中は住民を静止させる"
```

---

### Task 7: フェーズ進行 birthFxPhase（TDD）

演出は排他的なフェーズではなく重なり合うトラック（暗転・泡・シルエット・染まり・リング）なので、経過 ms から各トラックの進行度をまとめて返す 1 関数にする。

**Files:**
- Create: `src/render/birth-fx-phase.ts`
- Test: `src/render/birth-fx-phase.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/render/birth-fx-phase.test.ts`:

```ts
import { expect, test } from "bun:test";
import { birthFxPhase } from "./birth-fx-phase";

test("開始時: 暗転 0・泡あり・新入り非表示", () => {
  const fx = birthFxPhase(0);
  expect(fx.active).toBe(true);
  expect(fx.darkenAlpha).toBe(0);
  expect(fx.bubbleAlpha).toBe(1);
  expect(fx.residentVisible).toBe(false);
  expect(fx.dyeProgress).toBeNull();
  expect(fx.ringProgress).toBeNull();
});

test("150ms: 暗転フェードイン半分（0.5 × 0.55 = 0.275）", () => {
  expect(birthFxPhase(150).darkenAlpha).toBeCloseTo(0.275, 5);
});

test("700ms: 新入り（シルエット）が出現、染まりはまだ", () => {
  const fx = birthFxPhase(700);
  expect(fx.residentVisible).toBe(true);
  expect(fx.dyeProgress).toBeNull();
  expect(fx.darkenAlpha).toBeCloseTo(0.55, 5);
});

test("1000ms: 染まり進行 (1000-900)/800 = 0.125", () => {
  expect(birthFxPhase(1000).dyeProgress).toBeCloseTo(0.125, 5);
});

test("2000ms: リング 0.5・泡フェードアウト 0.5・染まり完了", () => {
  const fx = birthFxPhase(2000);
  expect(fx.ringProgress).toBeCloseTo(0.5, 5);
  expect(fx.bubbleAlpha).toBeCloseTo(0.5, 5);
  expect(fx.dyeProgress).toBe(1);
});

test("2400ms: 暗転フェードアウト半分・リング終了・泡消滅", () => {
  const fx = birthFxPhase(2400);
  expect(fx.darkenAlpha).toBeCloseTo(0.275, 5);
  expect(fx.ringProgress).toBeNull();
  expect(fx.bubbleAlpha).toBe(0);
  expect(fx.dyeProgress).toBe(1);
});

test("2500ms 以降と負の時間は非アクティブ", () => {
  expect(birthFxPhase(2500).active).toBe(false);
  expect(birthFxPhase(-1).active).toBe(false);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test birth-fx-phase`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 実装**

`src/render/birth-fx-phase.ts`:

```ts
import {
  BIRTH_FX_DARKEN_IN_END_MS,
  BIRTH_FX_DARKEN_MAX_ALPHA,
  BIRTH_FX_DARKEN_OUT_START_MS,
  BIRTH_FX_DYE_END_MS,
  BIRTH_FX_DYE_START_MS,
  BIRTH_FX_RING_END_MS,
  BIRTH_FX_RING_START_MS,
  BIRTH_FX_SILHOUETTE_AT_MS,
  BIRTH_FX_TOTAL_MS,
} from "../data/birth-fx-constants";
import { clamp } from "../engine/clamp";

/** 誕生演出の 1 フレームぶんの進行度。トラックは重なり合うためフェーズ enum ではなく並列の値で表す */
export type BirthFxFrame = {
  active: boolean;
  /** 暗転オーバーレイの実アルファ（0〜BIRTH_FX_DARKEN_MAX_ALPHA） */
  darkenAlpha: number;
  /** 泡の不透明度（0〜1）。リング期にフェードアウト */
  bubbleAlpha: number;
  /** 新入り（シルエット以降）を描くか */
  residentVisible: boolean;
  /** 染まり進行度（0〜1）。染まり開始前は null */
  dyeProgress: number | null;
  /** リング＋キャンディ粒の進行度（0〜1）。リング期以外は null */
  ringProgress: number | null;
};

const INACTIVE: BirthFxFrame = {
  active: false,
  darkenAlpha: 0,
  bubbleAlpha: 0,
  residentVisible: false,
  dyeProgress: null,
  ringProgress: null,
};

/** 誕生からの経過 ms を各トラックの進行度に変換する。決定的（乱数・時刻不使用） */
export function birthFxPhase(msSinceBirth: number): BirthFxFrame {
  if (msSinceBirth < 0 || msSinceBirth >= BIRTH_FX_TOTAL_MS) return INACTIVE;

  let darkenAlpha: number;
  if (msSinceBirth < BIRTH_FX_DARKEN_IN_END_MS) {
    darkenAlpha =
      (msSinceBirth / BIRTH_FX_DARKEN_IN_END_MS) * BIRTH_FX_DARKEN_MAX_ALPHA;
  } else if (msSinceBirth < BIRTH_FX_DARKEN_OUT_START_MS) {
    darkenAlpha = BIRTH_FX_DARKEN_MAX_ALPHA;
  } else {
    const outSpan = BIRTH_FX_TOTAL_MS - BIRTH_FX_DARKEN_OUT_START_MS;
    darkenAlpha =
      BIRTH_FX_DARKEN_MAX_ALPHA *
      (1 - (msSinceBirth - BIRTH_FX_DARKEN_OUT_START_MS) / outSpan);
  }

  const ringSpan = BIRTH_FX_RING_END_MS - BIRTH_FX_RING_START_MS;
  const bubbleAlpha =
    msSinceBirth < BIRTH_FX_RING_START_MS
      ? 1
      : clamp(1 - (msSinceBirth - BIRTH_FX_RING_START_MS) / ringSpan, 0, 1);

  const dyeProgress =
    msSinceBirth < BIRTH_FX_DYE_START_MS
      ? null
      : clamp(
          (msSinceBirth - BIRTH_FX_DYE_START_MS) /
            (BIRTH_FX_DYE_END_MS - BIRTH_FX_DYE_START_MS),
          0,
          1,
        );

  const ringProgress =
    msSinceBirth >= BIRTH_FX_RING_START_MS &&
    msSinceBirth < BIRTH_FX_RING_END_MS
      ? (msSinceBirth - BIRTH_FX_RING_START_MS) / ringSpan
      : null;

  return {
    active: true,
    darkenAlpha,
    bubbleAlpha,
    residentVisible: msSinceBirth >= BIRTH_FX_SILHOUETTE_AT_MS,
    dyeProgress,
    ringProgress,
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `bun test birth-fx-phase`
Expected: PASS（7 tests）

- [ ] **Step 5: コミット**

```bash
git add src/render/birth-fx-phase.ts src/render/birth-fx-phase.test.ts
git commit -m "feat: 誕生演出のフェーズ進行 birthFxPhase を追加"
```

---

### Task 8: 染まり境界列 dyeBoundaryColumn（TDD）

スプライト座標（原画では列 0 が頭側）で「フレーバー色に染まった列数」を返す。列 `< 戻り値` がフレーバー色、列 `=== 戻り値`（幅未満のとき）が白境界、それ以降がシルエット。鏡像反転は描画側で処理する。

**Files:**
- Create: `src/render/dye-boundary-column.ts`
- Test: `src/render/dye-boundary-column.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/render/dye-boundary-column.test.ts`:

```ts
import { expect, test } from "bun:test";
import { dyeBoundaryColumn } from "./dye-boundary-column";

test("進行 0 は境界が先頭列（何も染まっていない）", () => {
  expect(dyeBoundaryColumn(0, 16)).toBe(0);
});

test("進行 0.125 は floor(0.125 × 17) = 2", () => {
  expect(dyeBoundaryColumn(0.125, 16)).toBe(2);
});

test("進行 0.5 は floor(0.5 × 17) = 8", () => {
  expect(dyeBoundaryColumn(0.5, 16)).toBe(8);
});

test("進行 1 で全列（16）が染まり白境界は消える", () => {
  expect(dyeBoundaryColumn(1, 16)).toBe(16);
});

test("範囲外の進行度はクランプされる", () => {
  expect(dyeBoundaryColumn(1.2, 16)).toBe(16);
  expect(dyeBoundaryColumn(-0.1, 16)).toBe(0);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test dye-boundary-column`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 実装**

`src/render/dye-boundary-column.ts`:

```ts
import { clamp } from "../engine/clamp";

/**
 * 染まり進行度（0〜1）→ 染まり境界列（スプライト座標）。
 * 列 < 戻り値: フレーバー色 / 列 === 戻り値（width 未満のとき）: 白境界 / それ以降: シルエット。
 * 原画は列 0 が頭側なので「頭から尾へ」染まる。progress×(width+1) で 0〜width を等分する
 */
export function dyeBoundaryColumn(progress: number, width: number): number {
  return clamp(Math.floor(progress * (width + 1)), 0, width);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `bun test dye-boundary-column`
Expected: PASS（5 tests）

- [ ] **Step 5: コミット**

```bash
git add src/render/dye-boundary-column.ts src/render/dye-boundary-column.test.ts
git commit -m "feat: 染まり境界列 dyeBoundaryColumn を追加"
```

---

### Task 9: 泡軌道 birthBubblePoint（TDD）

インデックスと経過 ms だけから決定的に座標を返す（乱数不使用）。散らばりは `(index × 29) % 13` の擬似分散、揺らぎは sin。座標は整数に丸めてドット規律を守る。

**Files:**
- Create: `src/render/birth-bubble-point.ts`
- Test: `src/render/birth-bubble-point.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/render/birth-bubble-point.test.ts`:

```ts
import { expect, test } from "bun:test";
import { birthBubblePoint } from "./birth-bubble-point";

test("index 0 は遅延なしで出現。開始位置は中心の 8px 下", () => {
  // age=0: baseDx = ((0×29)%13)−6 = −6, sway = round(sin(0)×1.5) = 0
  // dy = 8 − round(0×0.02) = 8, size = 0%3===0 → 2
  expect(birthBubblePoint(0, 0)).toEqual({ dx: -6, dy: 8, size: 2 });
});

test("index 0 は 500ms で 10px 上昇している", () => {
  // age=500: sway = round(sin(500×0.006+0)×1.5) = round(sin(3)×1.5) = round(0.212) = 0
  // dy = 8 − round(500×0.02) = 8 − 10 = −2
  expect(birthBubblePoint(0, 500)).toEqual({ dx: -6, dy: -2, size: 2 });
});

test("index 1 は 90ms 遅延して出現し 1px サイズ", () => {
  // age = 500−90 = 410: baseDx = (29%13)−6 = −3
  // sway = round(sin(410×0.006+1)×1.5) = round(sin(3.46)×1.5) = round(−0.471) = 0
  // dy = 8 − round(410×0.02) = 8 − round(8.2) = 0, size = 1%3!==0 → 1
  expect(birthBubblePoint(1, 500)).toEqual({ dx: -3, dy: 0, size: 1 });
});

test("出現前（経過 < index×90ms）は null", () => {
  expect(birthBubblePoint(2, 100)).toBeNull();
});

test("index 3 の 900ms 時点（決定性の固定値検証）", () => {
  // age = 900−270 = 630: baseDx = (87%13)−6 = 3
  // sway = round(sin(630×0.006+3)×1.5) = round(sin(6.78)×1.5) = round(0.713) = 1
  // dy = 8 − round(630×0.02) = 8 − 13 = −5, size = 3%3===0 → 2
  expect(birthBubblePoint(3, 900)).toEqual({ dx: 4, dy: -5, size: 2 });
});

test("同じ入力は常に同じ出力（決定的）", () => {
  expect(birthBubblePoint(5, 777)).toEqual(birthBubblePoint(5, 777));
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test birth-bubble-point`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 実装**

`src/render/birth-bubble-point.ts`:

```ts
import {
  BIRTH_FX_BUBBLE_DELAY_MS,
  BIRTH_FX_BUBBLE_RISE_PER_MS,
  BIRTH_FX_BUBBLE_START_DY,
} from "../data/birth-fx-constants";

export type BubblePoint = {
  /** 演出中心からの相対 x（整数 px） */
  dx: number;
  /** 演出中心からの相対 y（整数 px）。負が上 */
  dy: number;
  /** ドットの一辺（1 = 1px、2 = 2×2） */
  size: 1 | 2;
};

/**
 * 泡 index の msSinceBirth 時点の位置。出現前は null。
 * インデックスと時間だけから決定的に計算する（乱数不使用）。
 * 散らばり: (index×29)%13 の擬似分散 / 揺らぎ: sin / 座標は整数に丸める
 */
export function birthBubblePoint(
  index: number,
  msSinceBirth: number,
): BubblePoint | null {
  const age = msSinceBirth - index * BIRTH_FX_BUBBLE_DELAY_MS;
  if (age < 0) return null;
  const baseDx = ((index * 29) % 13) - 6;
  const sway = Math.round(Math.sin(age * 0.006 + index) * 1.5);
  return {
    dx: baseDx + sway,
    dy: BIRTH_FX_BUBBLE_START_DY - Math.round(age * BIRTH_FX_BUBBLE_RISE_PER_MS),
    size: index % 3 === 0 ? 2 : 1,
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `bun test birth-bubble-point`
Expected: PASS（6 tests）

- [ ] **Step 5: コミット**

```bash
git add src/render/birth-bubble-point.ts src/render/birth-bubble-point.test.ts
git commit -m "feat: 泡軌道 birthBubblePoint を追加"
```

---

### Task 10: キャンディ粒座標 birthCandyPoint（TDD）

黄金角でインデックスごとに方向を割り、進行度に応じて中心から飛散させる。決定的・乱数不使用。

**Files:**
- Create: `src/render/birth-candy-point.ts`
- Test: `src/render/birth-candy-point.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/render/birth-candy-point.test.ts`:

```ts
import { expect, test } from "bun:test";
import { birthCandyPoint } from "./birth-candy-point";

test("index 0 進行 0: 角度 0・距離 2 → (2, 0)", () => {
  expect(birthCandyPoint(0, 0)).toEqual({ x: 2, y: 0 });
});

test("index 0 進行 1: 距離 12（BIRTH_FX_CANDY_MAX_DIST）→ (12, 0)", () => {
  expect(birthCandyPoint(0, 1)).toEqual({ x: 12, y: 0 });
});

test("index 1 進行 0.5: 距離 7・角度 2.39996rad", () => {
  // x = round(cos(2.39996)×7) = round(−5.162) = −5
  // y = round(sin(2.39996)×7) = round(4.728) = 5
  expect(birthCandyPoint(1, 0.5)).toEqual({ x: -5, y: 5 });
});

test("index 3 進行 1: 決定性の固定値検証", () => {
  // 角度 = 3×2.39996 = 7.19989rad（≒ 0.9167rad）
  // x = round(cos×12) = round(7.303) = 7, y = round(sin×12) = round(9.522) = 10
  expect(birthCandyPoint(3, 1)).toEqual({ x: 7, y: 10 });
});

test("同じ入力は常に同じ出力（決定的）", () => {
  expect(birthCandyPoint(7, 0.3)).toEqual(birthCandyPoint(7, 0.3));
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test birth-candy-point`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 実装**

`src/render/birth-candy-point.ts`:

```ts
import { BIRTH_FX_CANDY_MAX_DIST } from "../data/birth-fx-constants";
import type { Vec2 } from "../types";

/** 黄金角（rad）。インデックスごとに方向が均等に散らばる */
const GOLDEN_ANGLE = 2.399963229728653;
/** 飛散の開始距離（px） */
const START_DIST = 2;

/**
 * キャンディ粒 index の飛散位置（演出中心からの相対・整数 px）。
 * 進行度 0〜1 で距離 START_DIST → BIRTH_FX_CANDY_MAX_DIST に広がる。決定的（乱数不使用）
 */
export function birthCandyPoint(index: number, progress: number): Vec2 {
  const angle = index * GOLDEN_ANGLE;
  const dist = START_DIST + progress * (BIRTH_FX_CANDY_MAX_DIST - START_DIST);
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `bun test birth-candy-point`
Expected: PASS（5 tests）

- [ ] **Step 5: コミット**

```bash
git add src/render/birth-candy-point.ts src/render/birth-candy-point.test.ts
git commit -m "feat: キャンディ粒座標 birthCandyPoint を追加"
```

---

### Task 11: スプライト対応表と反転判定の共用化

`RESIDENT_SPRITES` と反転判定は draw-scene と draw-birth-fx の両方が使うため、それぞれ専用ファイルへ移す。挙動は不変。

**Files:**
- Create: `src/data/resident-sprites.ts`
- Create: `src/render/is-resident-flipped.ts`
- Test: `src/render/is-resident-flipped.test.ts`
- Modify: `src/render/draw-scene.ts`

- [ ] **Step 1: resident-sprites.ts を作成**

`src/data/resident-sprites.ts`:

```ts
import type { SpeciesId, Sprite } from "../types";
import { ramuneFishSprite } from "./sprites/ramune-fish";
import { strawberryJellySprite } from "./sprites/strawberry-jelly";

/** 住民スプライトの種別対応表。draw-scene と draw-birth-fx で共用する */
export const RESIDENT_SPRITES: Record<SpeciesId, Sprite> = {
  ramuneFish: ramuneFishSprite,
  strawberryJelly: strawberryJellySprite,
};
```

- [ ] **Step 2: isResidentFlipped の失敗するテストを書く**

`src/render/is-resident-flipped.test.ts`:

```ts
import { expect, test } from "bun:test";
import { isResidentFlipped } from "./is-resident-flipped";

test("右向きのラムネ魚は鏡像反転する", () => {
  expect(isResidentFlipped({ species: "ramuneFish", dir: 1 })).toBe(true);
});

test("左向きのラムネ魚は反転しない（原画の向き）", () => {
  expect(isResidentFlipped({ species: "ramuneFish", dir: -1 })).toBe(false);
});

test("クラゲは左右対称なので向きに関わらず反転しない", () => {
  expect(isResidentFlipped({ species: "strawberryJelly", dir: 1 })).toBe(false);
  expect(isResidentFlipped({ species: "strawberryJelly", dir: -1 })).toBe(false);
});
```

Run: `bun test is-resident-flipped`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 実装**

`src/render/is-resident-flipped.ts`:

```ts
import type { Resident } from "../types";

/** 鏡像反転するか。魚は進行方向で反転、クラゲは左右対称なので反転しない */
export function isResidentFlipped(
  resident: Pick<Resident, "species" | "dir">,
): boolean {
  return resident.species === "ramuneFish" && resident.dir > 0;
}
```

Run: `bun test is-resident-flipped`
Expected: PASS（3 tests）

- [ ] **Step 4: draw-scene.ts の参照を差し替える**

- ファイル内の `const RESIDENT_SPRITES: Record<SpeciesId, Sprite> = {...}` 定義を削除し、`import { RESIDENT_SPRITES } from "../data/resident-sprites";` に置き換える
- `import { ramuneFishSprite } ...` と `import { strawberryJellySprite } ...` を削除
- `import type { GameState, SpeciesId, Sprite } from "../types";` → `import type { GameState } from "../types";`
- 住民ループの `const flip = resident.species === "ramuneFish" && resident.dir > 0;` を `const flip = isResidentFlipped(resident);` に置き換え、`import { isResidentFlipped } from "./is-resident-flipped";` を追加

- [ ] **Step 5: 検証**

Run: `bun test && bunx tsc --noEmit && bun run lint`
Expected: 全 PASS・エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/data/resident-sprites.ts src/render/is-resident-flipped.ts src/render/is-resident-flipped.test.ts src/render/draw-scene.ts
git commit -m "refactor: 住民スプライト表と反転判定を共用化"
```

---

### Task 12: 誕生演出の描画関数 3 本

Canvas 描画のためテストなし。ロジックは Task 7〜10 の純粋関数を呼ぶだけに保つ。

**Files:**
- Create: `src/render/draw-darken-overlay.ts`
- Create: `src/render/draw-birth-resident.ts`
- Create: `src/render/draw-birth-fx.ts`

- [ ] **Step 1: 暗転オーバーレイ**

`src/render/draw-darken-overlay.ts`:

```ts
import { BIRTH_FX_DARKEN_RGB } from "../data/birth-fx-constants";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../data/world-constants";

/**
 * 画面全体を均一に暗くするオーバーレイ。円形マスクは使わない
 * （円の縁がベクター描画になりドット規律違反のため）。均一処理なので解像度の混在は起きない
 */
export function drawDarkenOverlay(
  ctx: CanvasRenderingContext2D,
  alpha: number,
): void {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(${BIRTH_FX_DARKEN_RGB}, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}
```

- [ ] **Step 2: シルエット／染まり住民の描画**

`src/render/draw-birth-resident.ts`:

```ts
import {
  BIRTH_FX_DYE_BOUNDARY_COLOR,
  BIRTH_FX_SILHOUETTE_COLOR,
} from "../data/birth-fx-constants";

/**
 * 誕生中の住民を描く。drawGrid と同じグリッド文法だが、列ごとに
 * フレーバー色（boundaryColumn 未満）／白境界（=== boundaryColumn）／シルエット（それ以降）を塗り分ける。
 * boundaryColumn === null は全シルエット。境界はスプライト座標（列 0 = 頭側）で判定するので
 * 鏡像反転時も見た目は頭から染まる
 */
export function drawBirthResident(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  palette: Record<string, string>,
  originX: number,
  originY: number,
  flip: boolean,
  boundaryColumn: number | null,
): void {
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const spriteColumn = flip ? row.length - 1 - c : c;
      const color = palette[row[spriteColumn]];
      if (!color) continue;
      let fill = BIRTH_FX_SILHOUETTE_COLOR;
      if (boundaryColumn !== null) {
        if (spriteColumn < boundaryColumn) fill = color;
        else if (spriteColumn === boundaryColumn)
          fill = BIRTH_FX_DYE_BOUNDARY_COLOR;
      }
      ctx.fillStyle = fill;
      ctx.fillRect(originX + c, originY + r, 1, 1);
    }
  }
}
```

- [ ] **Step 3: 誕生演出の合成描画**

`src/render/draw-birth-fx.ts`:

```ts
import {
  BIRTH_FX_BUBBLE_COUNT,
  BIRTH_FX_BUBBLE_RGB,
  BIRTH_FX_CANDY_COLOR,
  BIRTH_FX_CANDY_COUNT,
  BIRTH_FX_RING_BASE_RADIUS,
  BIRTH_FX_RING_MAX_RADIUS,
} from "../data/birth-fx-constants";
import { RESIDENT_SPRITES } from "../data/resident-sprites";
import type { Resident } from "../types";
import { birthBubblePoint } from "./birth-bubble-point";
import { birthCandyPoint } from "./birth-candy-point";
import { birthFxPhase } from "./birth-fx-phase";
import { drawBirthResident } from "./draw-birth-resident";
import { drawRingDots } from "./draw-ring-dots";
import { dyeBoundaryColumn } from "./dye-boundary-column";
import { isResidentFlipped } from "./is-resident-flipped";

/**
 * 誕生演出の合成描画。泡 → 新入り（シルエット/染まり） → リング＋キャンディ粒。
 * 暗転オーバーレイは呼び出し側（draw-scene）がこの関数の前に描く
 */
export function drawBirthFx(
  ctx: CanvasRenderingContext2D,
  resident: Resident,
  elapsedMs: number,
  screenX: number,
  screenY: number,
): void {
  const ms = elapsedMs - resident.bornAtMs;
  const fx = birthFxPhase(ms);
  if (!fx.active) return;
  const cx = Math.round(screenX);
  const cy = Math.round(screenY);
  const sprite = RESIDENT_SPRITES[resident.species];

  if (fx.bubbleAlpha > 0) {
    ctx.fillStyle = `rgba(${BIRTH_FX_BUBBLE_RGB}, ${fx.bubbleAlpha})`;
    for (let i = 0; i < BIRTH_FX_BUBBLE_COUNT; i++) {
      const p = birthBubblePoint(i, ms);
      if (!p) continue;
      ctx.fillRect(cx + p.dx, cy + p.dy, p.size, p.size);
    }
  }

  if (fx.residentVisible) {
    const boundary =
      fx.dyeProgress === null
        ? null
        : dyeBoundaryColumn(fx.dyeProgress, sprite.width);
    drawBirthResident(
      ctx,
      sprite.frames[0],
      sprite.palette,
      cx - 8,
      cy - 8,
      isResidentFlipped(resident),
      boundary,
    );
  }

  if (fx.ringProgress !== null) {
    const radius =
      BIRTH_FX_RING_BASE_RADIUS +
      fx.ringProgress * (BIRTH_FX_RING_MAX_RADIUS - BIRTH_FX_RING_BASE_RADIUS);
    drawRingDots(ctx, cx, cy, radius, `rgba(255,255,255,${1 - fx.ringProgress})`);
    // キャンディ粒: その種のパレット色＋金平糖色を index で巡回（Object.values は挿入順で決定的）
    const candyColors = [...Object.values(sprite.palette), BIRTH_FX_CANDY_COLOR];
    for (let i = 0; i < BIRTH_FX_CANDY_COUNT; i++) {
      const p = birthCandyPoint(i, fx.ringProgress);
      ctx.fillStyle = candyColors[i % candyColors.length];
      ctx.fillRect(cx + p.x, cy + p.y, 1, 1);
    }
  }
}
```

- [ ] **Step 4: 検証**

Run: `bunx tsc --noEmit && bun run lint`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/render/draw-darken-overlay.ts src/render/draw-birth-resident.ts src/render/draw-birth-fx.ts
git commit -m "feat: 暗転・染まり住民・誕生演出の合成描画を追加"
```

---

### Task 13: draw-scene への統合

描画順を「背景 → 道のり → 餌 → 住民（誕生中を除く） → 主人公 → 捕食リング → 暗転 → 新入り＋演出 → 満腹ピップ」に拡張する。HUD（満腹ピップ）は暗転の影響を受けないよう最後に描く。誕生中の住民は通常ループでスキップし、暗転の上に描く。

**Files:**
- Modify: `src/render/draw-scene.ts`

- [ ] **Step 1: draw-scene.ts をファイル全体で置き換える**

```ts
import { RESIDENT_SPRITES } from "../data/resident-sprites";
import { nessieSprite } from "../data/sprites/nessie";
import { shadowFishSprite } from "../data/sprites/shadow-fish";
import {
  FLASH_BASE_RADIUS,
  FLASH_DURATION_MS,
  FLASH_GROW_RADIUS,
  SATIETY_MAX,
  VIEW_WIDTH,
  WORLD_WIDTH,
} from "../data/world-constants";
import { isStrokePhase } from "../engine/is-stroke-phase";
import { mod } from "../engine/mod";
import { torusDistance } from "../engine/torus-distance";
import { isBirthFxActive } from "../systems/is-birth-fx-active";
import type { GameState, Resident } from "../types";
import { birthFxPhase } from "./birth-fx-phase";
import { drawBackground } from "./draw-background";
import { drawBirthFx } from "./draw-birth-fx";
import { drawDarkenOverlay } from "./draw-darken-overlay";
import { drawGrid } from "./draw-grid";
import { drawPath } from "./draw-path";
import { drawRingDots } from "./draw-ring-dots";
import { isResidentFlipped } from "./is-resident-flipped";

/**
 * 1 フレームぶんの描画。
 * 背景 → 道のり → 餌 → 住民（誕生中を除く） → 主人公 → 捕食リング → 暗転 → 新入り＋誕生演出 → 満腹ピップ
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number,
): void {
  drawBackground(ctx, camY);
  drawPath(ctx, state.path, camX, camY);

  for (const bait of state.baits) {
    const x = torusDistance(bait.x, camX, WORLD_WIDTH);
    // 中央揃え（幅 16 → x±8）なのでカリングも左右対称にする
    if (x < -8 || x > VIEW_WIDTH + 8) continue;
    drawGrid(
      ctx,
      shadowFishSprite.frames[0],
      shadowFishSprite.palette,
      x - 8,
      bait.y - camY - 2,
      bait.dir > 0,
    );
  }

  // 誕生演出中の住民は通常ループでは描かず、暗転オーバーレイの上に描く
  const birthing: { resident: Resident; screenX: number }[] = [];

  for (const resident of state.residents) {
    const x = torusDistance(resident.x, camX, WORLD_WIDTH);
    if (x < -18 || x > VIEW_WIDTH + 4) continue;
    if (isBirthFxActive(resident.bornAtMs, state.elapsedMs)) {
      birthing.push({ resident, screenX: x });
      continue;
    }
    const sprite = RESIDENT_SPRITES[resident.species];
    // frameIntervalMs === 0（1 フレームのスプライト）は mod(x, 0) = NaN になるためガードする
    const frameIndex =
      sprite.frameIntervalMs === 0 ||
      mod(state.elapsedMs, sprite.frameIntervalMs * 2) < sprite.frameIntervalMs
        ? 0
        : 1;
    drawGrid(
      ctx,
      sprite.frames[frameIndex],
      sprite.palette,
      x - 8,
      resident.y - camY - 8,
      isResidentFlipped(resident),
    );
  }

  // 主人公: 掻きフレーム（frame2）を推進バーストと同期させる
  const heroFrame = isStrokePhase(state.elapsedMs) ? 1 : 0;
  const heroX = torusDistance(state.hero.x, camX, WORLD_WIDTH);
  drawGrid(
    ctx,
    nessieSprite.frames[heroFrame],
    nessieSprite.palette,
    heroX - 12,
    state.hero.y - camY - 8,
    state.hero.facing === 1,
  );

  // 捕食フラッシュ（白ドットリング。ベクター描画禁止のドット規律に従う）
  for (const flash of state.flashes) {
    const age = (state.elapsedMs - flash.bornAt) / FLASH_DURATION_MS;
    const x = torusDistance(flash.x, camX, WORLD_WIDTH);
    drawRingDots(
      ctx,
      x,
      flash.y - camY,
      FLASH_BASE_RADIUS + age * FLASH_GROW_RADIUS,
      `rgba(255,255,255,${1 - age})`,
    );
  }

  // 誕生演出: 均一暗転 → その上に新入り＋演出（同時複数誕生時は最も濃い暗転を 1 回だけ描く）
  if (birthing.length > 0) {
    let darkenAlpha = 0;
    for (const b of birthing) {
      darkenAlpha = Math.max(
        darkenAlpha,
        birthFxPhase(state.elapsedMs - b.resident.bornAtMs).darkenAlpha,
      );
    }
    drawDarkenOverlay(ctx, darkenAlpha);
    for (const b of birthing) {
      drawBirthFx(
        ctx,
        b.resident,
        state.elapsedMs,
        b.screenX,
        b.resident.y - camY,
      );
    }
  }

  // HUD: 満腹ピップ（暗転の影響を受けないよう最後に描く）
  for (let i = 0; i < SATIETY_MAX; i++) {
    ctx.fillStyle = i < state.satiety ? "#FFB0C6" : "rgba(255,255,255,0.25)";
    ctx.fillRect(4 + i * 6, 4, 4, 4);
  }
}
```

- [ ] **Step 2: 検証**

Run: `bun test && bunx tsc --noEmit && bun run lint && bun run build`
Expected: 全 PASS・エラーなし・ビルド成功

- [ ] **Step 3: コミット**

```bash
git add src/render/draw-scene.ts
git commit -m "feat: draw-scene に誕生演出（暗転→新入り＋演出）を統合"
```

---

### Task 14: 実機確認（dev サーバー + ヘッドレススクショ）

満腹 5 まで実際に食べさせるのはヘッドレスでは困難なので、main.ts に検証用の新入りを一時注入して起動直後に演出を再生させる。**この変更はコミット禁止。確認後に必ず revert する。**

**Files:**
- Modify (一時的・コミット禁止): `src/main.ts`
- Modify (微調整があれば): `src/data/birth-fx-constants.ts`

- [ ] **Step 1: main.ts に検証用の新入りを一時注入**

`let state = createInitialState(Math.random);` の直後に追加:

```ts
// ↓検証用（コミット禁止）: 起動直後に誕生演出を再生する
state = {
  ...state,
  residents: [
    {
      species: "ramuneFish",
      x: 80,
      baseY: 60,
      y: 60,
      dir: 1,
      phase: 0,
      bornAtMs: 0,
    },
  ],
};
```

主人公の初期位置 (80, 60) と同じ場所なのでカメラ中央で演出が再生される。

- [ ] **Step 2: dev サーバーを起動**

Run: `lsof -ti :5173 | xargs kill 2>/dev/null; bun run dev` （バックグラウンド実行）
Expected: `Local: http://localhost:5173/`

- [ ] **Step 3: フェーズごとにヘッドレススクショを撮る**

`--virtual-time-budget` は仮想時間を早送りして描画完了後に撮影する。ページロード時間ぶんのオフセットがあるため、境界より少し余裕を持った値にしている。

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for t in 700 1300 2000 2600; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --run-all-compositor-stages-before-draw \
    --window-size=1024,720 \
    --virtual-time-budget=$t \
    --screenshot=/tmp/birth-$t.png \
    http://localhost:5173/
done
```

Expected: `/tmp/birth-700.png` 〜 `/tmp/birth-2600.png` の 4 枚が生成される

- [ ] **Step 4: スクショを目視確認（Read ツールで画像を開く）**

確認観点:
- `birth-700.png`: 画面が均一に暗い＋泡が上っている＋シルエット（#0F1E27）の新入りが見える
- `birth-1300.png`: 新入りが頭側から途中まで色づき、境界に白い縦 1 列がある
- `birth-2000.png`: 1px ドットのリング＋色つきのキャンディ粒が飛散、泡が薄い
- `birth-2600.png`: 暗転が消え、新入りが通常のラムネ魚として描かれている
- 全スクショ共通: 満腹ピップ（左上）が暗転の影響を受けていない、円弧のなめらかな線（ベクター）が存在しない

スクショが真っ黒・真っ白で不安定な場合は `--virtual-time-budget` を増やす／`sleep 2` を挟んで再試行する。それでも撮れない場合は通常起動での目視確認に切り替え、確認内容を報告する。

- [ ] **Step 5: 暗転の強さを微調整（必要な場合のみ）**

暗転が強すぎ・弱すぎる場合は `BIRTH_FX_DARKEN_MAX_ALPHA`（0.55）を 0.05 刻みで調整し、Step 3〜4 を再実行する。変更した場合のみコミット:

```bash
git add src/data/birth-fx-constants.ts
git commit -m "tune: 誕生演出の暗転の強さを実機確認で調整"
```

- [ ] **Step 6: 検証用コードを revert し、最終検証**

```bash
git checkout -- src/main.ts
git status  # main.ts の変更が消えていることを確認
bun run lint && bunx tsc --noEmit && bun test && bun run build
```

Expected: main.ts がクリーン、全チェック green

- [ ] **Step 7: dev サーバーを停止**

Run: `lsof -ti :5173 | xargs kill 2>/dev/null || true`

---

## 設計ドキュメントとの対応（カバレッジ）

| 設計項目 | 対応タスク |
|---|---|
| 暗転フェードイン/アウト（均一・円形マスク不使用） | Task 1, 7, 12, 13 |
| 泡 6〜10 個（1px と 2×2）・決定的軌道 | Task 1（8 個）, 9, 12 |
| シルエット #0F1E27 出現（0.7s）・静止 | Task 1, 4, 6, 7, 12 |
| 頭から尾へ列単位の染まり・白境界 #FFFFFF | Task 8, 12 |
| 1px ドットリング拡大＋キャンディ粒（パレット＋#FFE39A） | Task 2, 3, 10, 12 |
| 演出後に通常挙動へ（2.5s） | Task 5, 6（＋位相合わせ: Task 4） |
| 捕食小リングのドット化（ベクター全廃） | Task 2, 3, 4 |
| 定数の専用ファイル集約 | Task 1 |
| 大フラッシュの廃止と既存テスト調整 | Task 4 |
| 実機確認 | Task 14 |
