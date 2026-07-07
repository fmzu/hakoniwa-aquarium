# 今日の顔ぶれ（セッションスケジューラ）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** セッションごとに海の顔ぶれが変わる仕組み（開始時抽選のゆらぎ・まれな来訪・満員誕生時の押し出し退場）を実装する。

**Architecture:** 純粋関数を 1 つずつ TDD で追加し、最後に stepWorld へ 3 段階（押し出し → 退場消滅 → 来訪）で組み込む。カメラ位置は stepWorld の入力に加えず `camX = mod(hero.x - VIEW_WIDTH/2, WORLD_WIDTH)` として hero.x から導出する。全タイマーはゲーム内 elapsedMs 基準。セーブスキーマは変更しない。

**Tech Stack:** TypeScript / Bun（bun test）/ Vite / 素の Canvas 2D / Biome。一関数一ファイル・kebab-case 厳守。

**設計ドキュメント:** `docs/design/2026-07-07-session-roster.md`（オーナー承認済み）

**現状ベースライン:** `bun test` = 194 tests / 0 fail（42 files）。本計画で全既存テストを維持する（うち step-world.test.ts の満員 2 本は仕様変更＝押し出し方式に伴い書き換え）。新規テストは約 30 本追加見込み。

**注意:** `bun test` は型チェックをしない（型だけの破壊は実行時に通ってしまう）。型変更タスクの「失敗確認」は `bunx tsc --noEmit` で行う。

---

## ファイル構成（影響範囲の全体像）

### 新規作成

| ファイル | 責務 |
|---|---|
| `src/data/species-size.ts` | 種 → サイズ階級の網羅テーブル（Record で新種追加時に定義を強制） |
| `src/data/species-size.test.ts` | 網羅性と現状値のピン |
| `src/data/roster-constants.ts` | スケジューラ定数の集約（来訪間隔・確率・抽選数・余白） |
| `src/systems/discovered-species.ts` | 図鑑 → 発見済み種 ID 一覧（stepWorld と pickStartingResidents で共用） |
| `src/systems/discovered-species.test.ts` | 上のテスト |
| `src/systems/count-active-residents.ts` | departing を除いた実効住民数（定員判定用） |
| `src/systems/count-active-residents.test.ts` | 上のテスト |
| `src/systems/pick-departing-index.ts` | 押し出し対象の選定（同サイズ階級からランダム・フォールバック付き） |
| `src/systems/pick-departing-index.test.ts` | 上のテスト |
| `src/systems/is-out-of-view.ts` | hero.x から導出した視界＋余白の外か判定（退場消滅用） |
| `src/systems/is-out-of-view.test.ts` | 上のテスト |
| `src/systems/create-visitor.ts` | 来訪者の生成（視界の左右外側に湧き、視界へ向かって泳ぐ） |
| `src/systems/create-visitor.test.ts` | 上のテスト |

### 変更

| ファイル | 変更内容 |
|---|---|
| `src/types.ts` | `SizeClass` 追加、`Resident` に `arrivedAtMs`/`departing`、`GameState` に `nextVisitCheckMs` |
| `src/data/world-constants.ts` | `STARTING_RESIDENT_MAX` を削除（ROSTER_MIN/MAX に置き換え） |
| `src/systems/create-initial-state.ts` | `nextVisitCheckMs: VISIT_INTERVAL_MS` を初期化 |
| `src/systems/create-initial-state.test.ts` | 上の期待値追加 |
| `src/systems/pick-starting-residents.ts` | 抽選数ゆらぎ（2〜4体）・discoveredSpecies 利用・新フィールド |
| `src/systems/pick-starting-residents.test.ts` | 乱数消費順ピンの更新・ゆらぎテスト追加 |
| `src/systems/step-world.ts` | 押し出し誕生・退場消滅・来訪抽選の組み込み、第 3 引数 `discovered` 追加 |
| `src/systems/step-world.test.ts` | フィクスチャ更新・満員 2 本書き換え・新テスト・全呼び出しに第 3 引数 |
| `src/systems/step-resident.test.ts` | フィクスチャに新フィールド追加（5 箇所） |
| `src/systems/is-ceremony-active.test.ts` | フィクスチャ factory に新フィールド追加 |
| `src/systems/detect-born-resident.test.ts` | フィクスチャ factory に新フィールド追加 |
| `src/systems/restore-state-from-save.test.ts` | `nextVisitCheckMs` の期待値追加 |
| `src/main.ts` | `stepWorld(state, Math.random, discoveredSpecies(zukan))` に配線 |
| `docs/spec.md` | テスト観点の「満員時の誕生抑制」を押し出しに更新（決定ログ 3 は設計時に更新済み） |

### 変更不要（確認済み）

- `src/render/is-resident-flipped.test.ts` — `Pick<Resident, "species" | "dir">` を受けるため新フィールドの影響なし
- `src/systems/detect-born-resident.ts` — `bornAtMs === elapsedMs` 判定のまま（来訪者は bornAtMs 負値なので発火しない）
- `src/render/draw-scene.ts` — departing 住民も通常描画（退場演出は作らない。設計のスコープ外）
- `src/save/*` — セーブスキーマ変更なし（顔ぶれ・nextVisitCheckMs は保存しない）

---

## stepWorld の最終的な処理順（Task 11〜13 完了後）

1. `elapsedMs += TICK_MS` → セレモニー判定 → 主人公・餌・捕食（既存のまま）
2. 住民の移動（既存のまま）
3. **退場消滅**: `departing && isOutOfView(x, hero.x)` の住民を除去
4. **誕生**: 満腹 ≥ 5 なら常に誕生。実効数（departing 除く）が RESIDENT_MAX なら、新生児を配列に加える**前に** pickDepartingIndex で 1 体を departing にする（一時的に 9 体を許容）
5. **来訪**: `elapsedMs >= nextVisitCheckMs` なら次回時刻を +VISIT_INTERVAL_MS し、実効数 < RESIDENT_MAX かつ発見種が 1 つ以上あるときだけ `random() < VISIT_CHANCE` を引く。当たれば createVisitor を追加

乱数の消費順（既存テストのピンを壊さないための制約）:
- 満員でない誕生: 餌リスポーン baseY → 新生児 dir（既存と同一）
- 満員の誕生: 餌リスポーン baseY → **押し出し対象の選定** → 新生児 dir
- 来訪チェックは初回が `elapsedMs >= VISIT_INTERVAL_MS`（5 分後）なので、既存テストの範囲（elapsedMs ≒ 0）では乱数を一切消費しない

---

### Task 1: SizeClass 型と SPECIES_SIZE テーブル

**Files:**
- Modify: `src/types.ts`
- Create: `src/data/species-size.ts`
- Create: `src/data/species-size.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/data/species-size.test.ts` を新規作成:

```typescript
import { expect, test } from "bun:test";
import { SPECIES_IDS } from "./species-ids";
import { SPECIES_SIZE } from "./species-size";

test("全種にサイズ階級が定義されている（キーが SPECIES_IDS と一致）", () => {
  expect(Object.keys(SPECIES_SIZE).sort()).toEqual([...SPECIES_IDS].sort());
});

test("現在の 3 種はすべて S（新種追加時はこのピンを更新する）", () => {
  for (const id of SPECIES_IDS) {
    expect(SPECIES_SIZE[id]).toBe("S");
  }
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/data/species-size.test.ts`
Expected: FAIL（`Cannot find module './species-size'` 相当の解決エラー）

- [ ] **Step 3: 型とテーブルを実装する**

`src/types.ts` の `SpeciesId` 定義の直後に追加:

```typescript
/**
 * 種のサイズ階級。満員誕生の押し出しは同階級同士でのみ起きる
 * （同階級不在時は全住民へフォールバック）。現 3 種は全て "S"
 */
export type SizeClass = "SS" | "S" | "M" | "L" | "LL";
```

`src/data/species-size.ts` を新規作成:

```typescript
import type { SizeClass, SpeciesId } from "../types";

/**
 * 種ごとのサイズ階級。満員誕生の押し出し対象の選定に使う。
 * Record<SpeciesId, SizeClass> の網羅により、SpeciesId へ新種を追加すると
 * ここへの追記を tsc が強制する（定義漏れをコンパイラで防ぐ）
 */
export const SPECIES_SIZE: Record<SpeciesId, SizeClass> = {
  ramuneFish: "S",
  strawberryJelly: "S",
  taiyaki: "S",
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/data/species-size.test.ts && bunx tsc --noEmit`
Expected: 2 pass / 0 fail、tsc エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/types.ts src/data/species-size.ts src/data/species-size.test.ts
git commit -m "feat: サイズ階級（SizeClass）と種別テーブル SPECIES_SIZE を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: スケジューラ定数の集約ファイル

**Files:**
- Create: `src/data/roster-constants.ts`

定数のみのファイルなのでテストは書かない（world-constants.ts と同じ扱い）。

- [ ] **Step 1: 定数ファイルを作成する**

`src/data/roster-constants.ts` を新規作成:

```typescript
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
```

- [ ] **Step 2: 型・lint を確認する**

Run: `bunx tsc --noEmit && bun run lint`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/data/roster-constants.ts
git commit -m "feat: 顔ぶれスケジューラの調整定数を roster-constants に集約

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Resident に arrivedAtMs / departing を追加（全構築箇所・全フィクスチャ更新）

**Files:**
- Modify: `src/types.ts`
- Modify: `src/systems/pick-starting-residents.ts`（構築箇所）
- Modify: `src/systems/step-world.ts`（構築箇所）
- Modify: `src/systems/step-world.test.ts`（フィクスチャ 6 箇所）
- Modify: `src/systems/step-resident.test.ts`（フィクスチャ 5 箇所）
- Modify: `src/systems/is-ceremony-active.test.ts`（factory 1 箇所）
- Modify: `src/systems/detect-born-resident.test.ts`（factory 1 箇所）
- Modify: `src/systems/pick-starting-residents.test.ts`（期待値追加）

型駆動のタスク。必須フィールド追加 → tsc が全構築箇所を列挙 → 全て直す、を 1 コミットで行う（中間状態はコンパイルが通らないため分割しない）。

- [ ] **Step 1: 型にフィールドを追加する**

`src/types.ts` の `Resident` の `bornAtMs` の後に追加:

```typescript
  /**
   * 到着時刻（ゲーム内 elapsedMs）。来訪記録として保持する。
   * 押し出し判定には使わない（最古参ルールは不採用。設計ドキュメント参照）
   */
  arrivedAtMs: number;
  /** 退場予定。真の住民は通常通り泳ぎ続け、視界外（余白込み）に出た瞬間に消える */
  departing: boolean;
```

- [ ] **Step 2: tsc が失敗することを確認する（失敗確認）**

Run: `bunx tsc --noEmit`
Expected: FAIL。`Property 'arrivedAtMs' is missing` 系のエラーが `pick-starting-residents.ts` / `step-world.ts` / 各テストのフィクスチャで出る（bun test は型を見ないのでここは tsc で確認する）

- [ ] **Step 3: src 側の構築箇所を直す**

`src/systems/pick-starting-residents.ts` の `residents.push({ ... })` に 2 行追加:

```typescript
    residents.push({
      species,
      x: random() * WORLD_WIDTH,
      baseY,
      y: baseY,
      dir: random() < 0.5 ? -1 : 1,
      phase: random() * 6,
      // 演出窓の外に置く（定数変更に追従）
      bornAtMs: -BIRTH_FX_TOTAL_MS,
      // セッション開始メンバーの到着はセッション開始時刻（elapsedMs=0）
      arrivedAtMs: 0,
      departing: false,
    });
```

`src/systems/step-world.ts` の `born` オブジェクトに 2 行追加:

```typescript
      const born: Resident = {
        species,
        x: hero.x,
        baseY,
        y: baseY,
        dir: random() < 0.5 ? -1 : 1,
        // 演出明け（bornAtMs + BIRTH_FX_TOTAL_MS）に sin 項が 0 になる位相。
        // 演出中は y=baseY で静止するため、復帰時の y 飛びを防ぐ
        phase:
          -(elapsedMs + BIRTH_FX_TOTAL_MS) *
          SPECIES_MOTION[species].bobFrequency,
        bornAtMs: elapsedMs,
        arrivedAtMs: elapsedMs,
        departing: false,
      };
```

- [ ] **Step 4: テストのフィクスチャを全て直す**

以下の全ての Resident リテラル／factory に `arrivedAtMs: 0, departing: false,` を追加する（`bornAtMs` の行の直後）:

- `src/systems/step-world.test.ts` — 6 箇所: `existing`（誕生順テスト）、`full`（満員繰り越しテスト内の Array.from）、`full`（満員誕生しないテスト内の Array.from）、`newborn` と `elder`（stateDuringCeremony 内）、`newborn`（演出明けテスト内）
- `src/systems/step-resident.test.ts` — 5 箇所: `fish`（ラムネ魚）、`jelly`、`fish`（torus 折り返し）、`newborn`（演出中静止）、`newborn`（演出明け）
- `src/systems/is-ceremony-active.test.ts` — 1 箇所: `residentBornAt` factory の返すオブジェクト
- `src/systems/detect-born-resident.test.ts` — 1 箇所: `resident` factory の返すオブジェクト

例（step-resident.test.ts の 1 箇所目）:

```typescript
  const fish: Resident = {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: Math.PI / 2,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  };
```

- [ ] **Step 5: 新フィールドの期待値テストを追加する**

`src/systems/pick-starting-residents.test.ts` の「生成された住民は帯内の位置・誕生演出なしの bornAtMs を持つ」テストの末尾に追加:

```typescript
  expect(resident.arrivedAtMs).toBe(0); // セッション開始メンバーの到着は 0
  expect(resident.departing).toBe(false);
```

`src/systems/step-world.test.ts` の「誕生した住民は bornAtMs を持ち、演出明けに y=baseY となる位相を持つ」テストの末尾に追加:

```typescript
  expect(born.arrivedAtMs).toBe(born.bornAtMs); // 誕生＝到着
  expect(born.departing).toBe(false);
```

- [ ] **Step 6: 全テスト・型が通ることを確認する**

Run: `bunx tsc --noEmit && bun test`
Expected: tsc エラーなし、196 tests / 0 fail（ベースライン 194 + Task 1 の 2 本）

- [ ] **Step 7: コミット**

```bash
git add src/types.ts src/systems/pick-starting-residents.ts src/systems/step-world.ts src/systems/step-world.test.ts src/systems/step-resident.test.ts src/systems/is-ceremony-active.test.ts src/systems/detect-born-resident.test.ts src/systems/pick-starting-residents.test.ts
git commit -m "feat: Resident に到着時刻 arrivedAtMs と退場予定 departing を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: GameState に nextVisitCheckMs を追加

**Files:**
- Modify: `src/types.ts`
- Modify: `src/systems/create-initial-state.ts`
- Modify: `src/systems/create-initial-state.test.ts`
- Modify: `src/systems/step-world.ts`（戻り値のパススルー）
- Modify: `src/systems/restore-state-from-save.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/create-initial-state.test.ts` に追加:

```typescript
import { VISIT_INTERVAL_MS } from "../data/roster-constants";

test("次回来訪チェックは VISIT_INTERVAL_MS（ゲーム内 5 分後）から始まる", () => {
  const state = createInitialState(() => 0.5);
  expect(state.nextVisitCheckMs).toBe(VISIT_INTERVAL_MS);
});
```

`src/systems/restore-state-from-save.test.ts` の「餌・主人公・経過時間は初期状態と同じ」テストの末尾に追加:

```typescript
  expect(state.nextVisitCheckMs).toBe(300000); // 保存対象外。毎セッション初期値から
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/create-initial-state.test.ts src/systems/restore-state-from-save.test.ts`
Expected: FAIL（`nextVisitCheckMs` が undefined のため `expect(undefined).toBe(300000)` で落ちる）

- [ ] **Step 3: 型と初期化・パススルーを実装する**

`src/types.ts` の `GameState` の `elapsedMs` の後に追加:

```typescript
  /**
   * 次回の来訪チェック時刻（ゲーム内 elapsedMs）。セーブしない
   * （顔ぶれと同じく毎セッション初期化。到達すると VISIT_INTERVAL_MS 先へ進む）
   */
  nextVisitCheckMs: number;
```

`src/systems/create-initial-state.ts`:

```typescript
import { VISIT_INTERVAL_MS } from "../data/roster-constants";
```

を import に追加し、return オブジェクトに追加:

```typescript
    elapsedMs: 0,
    nextVisitCheckMs: VISIT_INTERVAL_MS,
```

`src/systems/step-world.ts` の return を変更（来訪ロジック実装までのパススルー）:

```typescript
  return {
    hero,
    path,
    baits,
    residents,
    flashes,
    satiety,
    elapsedMs,
    nextVisitCheckMs: state.nextVisitCheckMs,
  };
```

- [ ] **Step 4: 全テスト・型が通ることを確認する**

Run: `bunx tsc --noEmit && bun test`
Expected: tsc エラーなし、197 tests / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/types.ts src/systems/create-initial-state.ts src/systems/create-initial-state.test.ts src/systems/step-world.ts src/systems/restore-state-from-save.test.ts
git commit -m "feat: GameState に来訪チェック時刻 nextVisitCheckMs を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: discoveredSpecies の抽出（図鑑 → 発見済み種一覧）

**Files:**
- Create: `src/systems/discovered-species.ts`
- Create: `src/systems/discovered-species.test.ts`
- Modify: `src/systems/pick-starting-residents.ts`（重複ロジックの置き換え）

pickStartingResidents 内の `SPECIES_IDS.filter(...)` と、後の main.ts 配線（Task 13）で同じロジックを使うため関数に抽出する（DRY）。

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/discovered-species.test.ts` を新規作成:

```typescript
import { expect, test } from "bun:test";
import type { ZukanEntry } from "../types";
import { discoveredSpecies } from "./discovered-species";

const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
  birthCount: 1,
};

test("発見済みの種だけを SPECIES_IDS 順で返す", () => {
  expect(discoveredSpecies({ taiyaki: entry, ramuneFish: entry })).toEqual([
    "ramuneFish",
    "taiyaki",
  ]);
});

test("空の図鑑なら空配列", () => {
  expect(discoveredSpecies({})).toEqual([]);
});

test("毎回新しい配列を返す（呼び出し側で splice しても安全）", () => {
  const zukan = { ramuneFish: entry };
  discoveredSpecies(zukan).splice(0, 1);
  expect(discoveredSpecies(zukan)).toEqual(["ramuneFish"]);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/discovered-species.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/systems/discovered-species.ts` を新規作成:

```typescript
import { SPECIES_IDS } from "../data/species-ids";
import type { SpeciesId, Zukan } from "../types";

/**
 * 図鑑から発見済みの種 ID を SPECIES_IDS 順で返す。
 * 常に新しい配列を返す（呼び出し側の破壊操作から SPECIES_IDS を守る）
 */
export function discoveredSpecies(zukan: Zukan): SpeciesId[] {
  return SPECIES_IDS.filter((id) => zukan[id] !== undefined);
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/systems/discovered-species.test.ts`
Expected: 3 pass / 0 fail

- [ ] **Step 5: pickStartingResidents をリファクタリングする（挙動不変）**

`src/systems/pick-starting-residents.ts` の

```typescript
import { SPECIES_IDS } from "../data/species-ids";
```

を削除して

```typescript
import { discoveredSpecies } from "./discovered-species";
```

に置き換え、関数内の

```typescript
  const pool = SPECIES_IDS.filter((id) => zukan[id] !== undefined);
```

を

```typescript
  const pool = discoveredSpecies(zukan);
```

に置き換える（`pool.splice` は discoveredSpecies が新しい配列を返すため安全）。

- [ ] **Step 6: 全テストが通ることを確認する（リファクタなので既存ピンは不変）**

Run: `bunx tsc --noEmit && bun test`
Expected: 200 tests / 0 fail

- [ ] **Step 7: コミット**

```bash
git add src/systems/discovered-species.ts src/systems/discovered-species.test.ts src/systems/pick-starting-residents.ts
git commit -m "refactor: 発見済み種の一覧取得を discoveredSpecies に抽出

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 開始時抽選のゆらぎ（2〜4 体）と STARTING_RESIDENT_MAX の廃止

**Files:**
- Modify: `src/systems/pick-starting-residents.ts`
- Modify: `src/systems/pick-starting-residents.test.ts`
- Modify: `src/data/world-constants.ts`（STARTING_RESIDENT_MAX 削除）

抽選数を「最初の乱数 1 回」で決める: `count = min(ROSTER_MIN + floor(random() * (ROSTER_MAX - ROSTER_MIN + 1)), pool.length)`。
既存の fixedRandom=0.5 では `2 + floor(0.5 * 3) = 3` となり、後続の乱数消費は従来と同じ値なので、乱数消費順ピン以外の既存期待値はコメント更新のみで済む。

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/pick-starting-residents.test.ts` に追加:

```typescript
/** 指定した値を順に返し、尽きたら 0.5 を返す乱数（テスト決定性） */
function sequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++] ?? 0.5;
}

test("抽選数はゆらぐ: 最初の乱数 0 なら ROSTER_MIN の 2 体", () => {
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  expect(pickStartingResidents(zukan, sequenceRandom([0])).length).toBe(2);
});

test("抽選数が発見数を超えるときは発見数まで（roll=4 でも 3 種なら 3 体）", () => {
  // 2 + floor(0.99 * 3) = 4 → min(4, 発見 3 種) = 3。ROSTER_MAX=4 は 4 種目の発見後に効く
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  expect(pickStartingResidents(zukan, sequenceRandom([0.99])).length).toBe(3);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/pick-starting-residents.test.ts`
Expected: FAIL（現実装は `min(STARTING_RESIDENT_MAX=3, 3) = 3` 固定なので、1 本目が `expect(3).toBe(2)` で落ちる）

- [ ] **Step 3: 実装する**

`src/systems/pick-starting-residents.ts` を以下の全文にする:

```typescript
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { ROSTER_MAX, ROSTER_MIN } from "../data/roster-constants";
import {
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  WORLD_WIDTH,
} from "../data/world-constants";
import type { Resident, Zukan } from "../types";
import { discoveredSpecies } from "./discovered-species";

/**
 * セッション開始時の顔ぶれ抽選。発見済みの種から ROSTER_MIN〜ROSTER_MAX 体
 * （種の重複なし。発見数が少なければ発見数まで）を生成する。乱数は注入（テスト決定性）。
 * 抽選数は最初の乱数 1 回で決める。bornAtMs は十分過去の値にして誕生演出を再生しない
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function pickStartingResidents(
  zukan: Zukan,
  random: () => number,
): Resident[] {
  const pool = discoveredSpecies(zukan);
  const count = Math.min(
    ROSTER_MIN + Math.floor(random() * (ROSTER_MAX - ROSTER_MIN + 1)),
    pool.length,
  );
  const residents: Resident[] = [];
  for (let i = 0; i < count; i++) {
    const species = pool.splice(Math.floor(random() * pool.length), 1)[0];
    const baseY =
      RESIDENT_MIN_BASE_Y +
      random() * (RESIDENT_MAX_BASE_Y - RESIDENT_MIN_BASE_Y);
    residents.push({
      species,
      x: random() * WORLD_WIDTH,
      baseY,
      y: baseY,
      dir: random() < 0.5 ? -1 : 1,
      phase: random() * 6,
      // 演出窓の外に置く（定数変更に追従）
      bornAtMs: -BIRTH_FX_TOTAL_MS,
      // セッション開始メンバーの到着はセッション開始時刻（elapsedMs=0）
      arrivedAtMs: 0,
      departing: false,
    });
  }
  return residents;
}
```

`src/data/world-constants.ts` から以下の 2 行を削除する:

```typescript
/** 起動時に図鑑（発見済みの種）から泳がせる住民の最大数 */
export const STARTING_RESIDENT_MAX = 3;
```

- [ ] **Step 4: 既存の乱数消費順ピンのコメントを更新する**

`src/systems/pick-starting-residents.test.ts` の「random=0.5 の抽選順」テストのコメントを更新（期待値自体は不変）:

```typescript
test("random=0.5 の抽選順は [strawberryJelly, taiyaki, ramuneFish]", () => {
  // 実装の乱数消費順のリグレッションピン。抽選方式を変えたら期待値を更新する
  // 1 回目: 抽選数 = 2 + floor(0.5 * 3) = 3（min(3, 発見 3 種) = 3）
  // pool [ramuneFish, strawberryJelly, taiyaki] から floor(0.5*3)=1 → strawberryJelly
  // pool [ramuneFish, taiyaki] から floor(0.5*2)=1 → taiyaki
  // pool [ramuneFish] から floor(0.5*1)=0 → ramuneFish
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  const species = pickStartingResidents(zukan, fixedRandom).map(
    (r) => r.species,
  );
  expect(species).toEqual(["strawberryJelly", "taiyaki", "ramuneFish"]);
});
```

「3 種発見済みなら 3 体・種の重複なし」テストのタイトルとコメントも実態に合わせる:

```typescript
test("3 種発見済み・random=0.5 なら 3 体・種の重複なし", () => {
  // 抽選数 roll: 2 + floor(0.5 * 3) = 3
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  const residents = pickStartingResidents(zukan, fixedRandom);
  expect(residents.length).toBe(3);
  expect(new Set(residents.map((r) => r.species)).size).toBe(3);
});
```

（「1 種だけ発見済みなら 1 体だけ泳ぐ」「図鑑が空なら誰も泳がない」「生成された住民は…」は count roll 後の乱数が同じ値 0.5 なので期待値不変。触らない）

- [ ] **Step 5: 全テスト・型が通ることを確認する**

Run: `bunx tsc --noEmit && bun test`
Expected: tsc エラーなし（STARTING_RESIDENT_MAX の参照が残っていればここで検出）、202 tests / 0 fail

- [ ] **Step 6: コミット**

```bash
git add src/systems/pick-starting-residents.ts src/systems/pick-starting-residents.test.ts src/data/world-constants.ts
git commit -m "feat: セッション開始の抽選数を 2〜4 体のゆらぎに変更

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: countActiveResidents（実効住民数）

**Files:**
- Create: `src/systems/count-active-residents.ts`
- Create: `src/systems/count-active-residents.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/count-active-residents.test.ts` を新規作成:

```typescript
import { expect, test } from "bun:test";
import type { Resident } from "../types";
import { countActiveResidents } from "./count-active-residents";

function resident(departing: boolean): Resident {
  return {
    species: "ramuneFish",
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing,
  };
}

test("退場予定を除いた数を返す", () => {
  const residents = [resident(true), resident(false), resident(false)];
  expect(countActiveResidents(residents)).toBe(2);
});

test("空配列なら 0", () => {
  expect(countActiveResidents([])).toBe(0);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/count-active-residents.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/systems/count-active-residents.ts` を新規作成:

```typescript
import type { Resident } from "../types";

/**
 * 退場予定（departing）を除いた実効の住民数。
 * 定員（RESIDENT_MAX）の判定はこの数で行う（退場予定は枠を空けたとみなす）
 */
export function countActiveResidents(residents: readonly Resident[]): number {
  return residents.filter((resident) => !resident.departing).length;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/systems/count-active-residents.test.ts`
Expected: 2 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/systems/count-active-residents.ts src/systems/count-active-residents.test.ts
git commit -m "feat: 退場予定を除いた実効住民数 countActiveResidents を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: pickDepartingIndex（押し出し対象の選定）

**Files:**
- Create: `src/systems/pick-departing-index.ts`
- Create: `src/systems/pick-departing-index.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/pick-departing-index.test.ts` を新規作成:

```typescript
import { expect, test } from "bun:test";
import type { Resident, SpeciesId } from "../types";
import { pickDepartingIndex } from "./pick-departing-index";

function resident(species: SpeciesId, departing = false): Resident {
  return {
    species,
    x: 100,
    baseY: 60,
    y: 60,
    dir: 1,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing,
  };
}

test("新生児と同じサイズ階級からランダムに選ぶ（全員 S・random=0.5 なら 8 体中 index 4）", () => {
  const residents = Array.from({ length: 8 }, () => resident("ramuneFish"));
  expect(pickDepartingIndex(residents, "S", () => 0.5)).toBe(4);
});

test("random=0 なら先頭、random=0.99 なら末尾を選ぶ", () => {
  const residents = Array.from({ length: 8 }, () => resident("ramuneFish"));
  expect(pickDepartingIndex(residents, "S", () => 0)).toBe(0);
  expect(pickDepartingIndex(residents, "S", () => 0.99)).toBe(7); // floor(0.99*8)
});

test("すでに退場予定の住民は候補から外す（元配列の添字を返す）", () => {
  // 候補は index 1, 2 の 2 体 → floor(0.5 * 2) = 1 → 元配列の index 2
  const residents = [
    resident("ramuneFish", true),
    resident("ramuneFish"),
    resident("ramuneFish"),
  ];
  expect(pickDepartingIndex(residents, "S", () => 0.5)).toBe(2);
});

test("同サイズ階級が不在なら退場予定でない全住民からランダム（フォールバック）", () => {
  // 現 3 種は全て "S" なので、新生児サイズ "L" を渡すと同階級ゼロ → 全体 3 体から floor(0.5*3)=1
  const residents = [
    resident("ramuneFish"),
    resident("strawberryJelly"),
    resident("taiyaki"),
  ];
  expect(pickDepartingIndex(residents, "L", () => 0.5)).toBe(1);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/pick-departing-index.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/systems/pick-departing-index.ts` を新規作成:

```typescript
import { SPECIES_SIZE } from "../data/species-size";
import type { Resident, SizeClass } from "../types";

/**
 * 満員時の誕生で退場予定にする住民の添字を選ぶ（押し出し）。
 * 新生児と同じサイズ階級の住民（退場予定でないもの）からランダムに 1 体、
 * 同階級が不在なら退場予定でない全住民からランダム（フォールバック。
 * 現 3 種は全て "S" なので当面未発動だが、将来の L 級以上に備える）。
 * 新生児は residents に加える前にこの関数を呼ぶことで対象から除外する。
 * 前提: 退場予定でない住民が 1 体以上いること（満員時のみ呼ばれるため保証される）
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function pickDepartingIndex(
  residents: readonly Resident[],
  newbornSize: SizeClass,
  random: () => number,
): number {
  const active = residents
    .map((resident, index) => ({ resident, index }))
    .filter(({ resident }) => !resident.departing);
  const sameSize = active.filter(
    ({ resident }) => SPECIES_SIZE[resident.species] === newbornSize,
  );
  const pool = sameSize.length > 0 ? sameSize : active;
  return pool[Math.floor(random() * pool.length)].index;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/systems/pick-departing-index.test.ts`
Expected: 4 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/systems/pick-departing-index.ts src/systems/pick-departing-index.test.ts
git commit -m "feat: 押し出し対象の選定 pickDepartingIndex を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: isOutOfView（hero.x から導出する視界外判定）

**Files:**
- Create: `src/systems/is-out-of-view.ts`
- Create: `src/systems/is-out-of-view.test.ts`

カメラは主人公追従（`camX = mod(hero.x - VIEW_WIDTH/2, WORLD_WIDTH)`。camera-position.ts と同じ式）なので、stepWorld の入力にカメラを追加せず hero.x から導出する（設計判断の確定）。

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/is-out-of-view.test.ts` を新規作成:

```typescript
import { expect, test } from "bun:test";
import { isOutOfView } from "./is-out-of-view";

// heroX=100 → camX = mod(100 - 64, 480) = 36。視界は世界 x 36〜164、
// 余白 DESPAWN_MARGIN_PX=12 込みの生存域は screenX ∈ [-12, 140]

test("視界内は偽", () => {
  expect(isOutOfView(100, 100)).toBe(false); // screenX = 64
});

test("右端: 余白の内側（screenX=140）は偽、外（141）は真", () => {
  expect(isOutOfView(176, 100)).toBe(false); // 176 - 36 = 140
  expect(isOutOfView(177, 100)).toBe(true); // 141
});

test("左端: 余白の内側（screenX=-12）は偽、外（-13）は真", () => {
  expect(isOutOfView(24, 100)).toBe(false); // 24 - 36 = -12
  expect(isOutOfView(23, 100)).toBe(true); // -13
});

test("torus 境界をまたぐカメラでも正しく判定する", () => {
  // heroX=10 → camX = mod(10 - 64, 480) = 426。視界は世界 x 426〜480〜74
  expect(isOutOfView(470, 10)).toBe(false); // torusDistance(470,426)=44 → 視界内
  expect(isOutOfView(86, 10)).toBe(false); // mod(86-426,480)=140 → 余白ちょうど
  expect(isOutOfView(90, 10)).toBe(true); // 144 → 右余白の外
  expect(isOutOfView(270, 10)).toBe(true); // torusDistance=-156 → 完全に反対側
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/is-out-of-view.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/systems/is-out-of-view.ts` を新規作成:

```typescript
import { DESPAWN_MARGIN_PX } from "../data/roster-constants";
import { VIEW_WIDTH, WORLD_WIDTH } from "../data/world-constants";
import { mod } from "../engine/mod";
import { torusDistance } from "../engine/torus-distance";

/**
 * 世界座標 x が視界（余白込み）の外か。退場予定住民の消滅判定に使う。
 * カメラは主人公追従なので camX = mod(heroX - VIEW_WIDTH/2, WORLD_WIDTH) を
 * hero.x から導出する（camera-position.ts と同じ式。stepWorld にカメラを入力させない）。
 * 余白 DESPAWN_MARGIN_PX はスプライト半幅 + 数 px（完全に見えなくなってから消す）
 */
export function isOutOfView(x: number, heroX: number): boolean {
  const camX = mod(heroX - VIEW_WIDTH / 2, WORLD_WIDTH);
  const screenX = torusDistance(x, camX, WORLD_WIDTH);
  return (
    screenX < -DESPAWN_MARGIN_PX || screenX > VIEW_WIDTH + DESPAWN_MARGIN_PX
  );
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/systems/is-out-of-view.test.ts`
Expected: 4 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/systems/is-out-of-view.ts src/systems/is-out-of-view.test.ts
git commit -m "feat: hero.x から導出する視界外判定 isOutOfView を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: createVisitor（来訪者の生成）

**Files:**
- Create: `src/systems/create-visitor.ts`
- Create: `src/systems/create-visitor.test.ts`

来訪者と誕生の区別が最重要: `bornAtMs = -BIRTH_FX_TOTAL_MS`（負値）にすることで、誕生演出（isBirthFxActive: `age = elapsedMs - bornAtMs ≥ BIRTH_FX_TOTAL_MS` となり常に偽）も図鑑更新（detectBornResident: `bornAtMs === elapsedMs` は elapsedMs ≥ 0 で成立不可能）も発火しない。これをテストで明示検証する。

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/create-visitor.test.ts` を新規作成:

```typescript
import { expect, test } from "bun:test";
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { createVisitor } from "./create-visitor";
import { detectBornResident } from "./detect-born-resident";
import { isBirthFxActive } from "./is-birth-fx-active";

/** 指定した値を順に返し、尽きたら 0.5 を返す乱数（テスト決定性） */
function sequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++] ?? 0.5;
}

// heroX=100 → camX = mod(100 - 64, 480) = 36。
// 乱数の消費順: 種 → 左右 → baseY → phase

test("右外湧き: 視界の右外（camX + VIEW_WIDTH + 16）に湧き、左向きに泳ぐ", () => {
  const visitor = createVisitor(
    ["ramuneFish", "taiyaki"],
    100,
    300000,
    sequenceRandom([0.5, 0.6, 0.5, 0.5]),
  );
  expect(visitor.species).toBe("taiyaki"); // floor(0.5 * 2) = 1
  expect(visitor.x).toBe(180); // mod(36 + 128 + 16, 480)
  expect(visitor.dir).toBe(-1); // 視界へ向かう
  expect(visitor.baseY).toBe(71); // 24 + 0.5 * 94
  expect(visitor.y).toBe(71);
  expect(visitor.phase).toBe(3); // 0.5 * 6
  expect(visitor.arrivedAtMs).toBe(300000);
  expect(visitor.departing).toBe(false);
});

test("左外湧き: 視界の左外（camX - 16）に湧き、右向きに泳ぐ", () => {
  const visitor = createVisitor(
    ["ramuneFish"],
    100,
    300000,
    sequenceRandom([0, 0]),
  );
  expect(visitor.species).toBe("ramuneFish");
  expect(visitor.x).toBe(20); // mod(36 - 16, 480)
  expect(visitor.dir).toBe(1);
});

test("torus 境界をまたぐ湧き位置は折り返す", () => {
  // heroX=70 → camX = 6 → 左外 = mod(6 - 16, 480) = 470
  const visitor = createVisitor(["ramuneFish"], 70, 300000, sequenceRandom([0, 0]));
  expect(visitor.x).toBe(470);
});

test("来訪者は誕生演出も図鑑更新も発火させない（bornAtMs が負値）", () => {
  const visitor = createVisitor(["ramuneFish"], 100, 300000, sequenceRandom([0, 0]));
  expect(visitor.bornAtMs).toBe(-BIRTH_FX_TOTAL_MS);
  // 誕生演出: 演出窓は 0 <= age < BIRTH_FX_TOTAL_MS。age = elapsedMs + 2500 は
  // elapsedMs=0 でもちょうど窓の外（境界含む）
  expect(isBirthFxActive(visitor.bornAtMs, 300000)).toBe(false);
  expect(isBirthFxActive(visitor.bornAtMs, 0)).toBe(false);
  // 図鑑更新: bornAtMs === elapsedMs は elapsedMs >= 0 で成立しない
  expect(detectBornResident([visitor], 300000)).toBeUndefined();
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/create-visitor.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/systems/create-visitor.ts` を新規作成:

```typescript
import { BIRTH_FX_TOTAL_MS } from "../data/birth-fx-constants";
import { VISIT_SPAWN_MARGIN_PX } from "../data/roster-constants";
import {
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  VIEW_WIDTH,
  WORLD_WIDTH,
} from "../data/world-constants";
import { mod } from "../engine/mod";
import type { Resident, SpeciesId } from "../types";

/**
 * 来訪者を 1 体つくる。発見済みの種からランダムに選び、視界の左右どちらか外側
 * （余白 VISIT_SPAWN_MARGIN_PX 付き）に湧かせて視界へ向かって泳がせる。
 * カメラは主人公追従なので camX は hero.x から導出する。
 * bornAtMs は -BIRTH_FX_TOTAL_MS（負値）固定にして、誕生演出（isBirthFxActive）も
 * 図鑑更新（detectBornResident の bornAtMs === elapsedMs 判定）も発火させない
 * @param discovered - 発見済みの種（1 種以上あることは呼び出し側が保証する）
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function createVisitor(
  discovered: readonly SpeciesId[],
  heroX: number,
  elapsedMs: number,
  random: () => number,
): Resident {
  const species = discovered[Math.floor(random() * discovered.length)];
  const fromLeft = random() < 0.5;
  const camX = mod(heroX - VIEW_WIDTH / 2, WORLD_WIDTH);
  const x = fromLeft
    ? mod(camX - VISIT_SPAWN_MARGIN_PX, WORLD_WIDTH)
    : mod(camX + VIEW_WIDTH + VISIT_SPAWN_MARGIN_PX, WORLD_WIDTH);
  const baseY =
    RESIDENT_MIN_BASE_Y +
    random() * (RESIDENT_MAX_BASE_Y - RESIDENT_MIN_BASE_Y);
  return {
    species,
    x,
    baseY,
    y: baseY,
    dir: fromLeft ? 1 : -1,
    phase: random() * 6,
    bornAtMs: -BIRTH_FX_TOTAL_MS,
    arrivedAtMs: elapsedMs,
    departing: false,
  };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/systems/create-visitor.test.ts`
Expected: 4 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/systems/create-visitor.ts src/systems/create-visitor.test.ts
git commit -m "feat: 来訪者を視界外に生成する createVisitor を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: stepWorld — 満員誕生の押し出し

**Files:**
- Modify: `src/systems/step-world.ts`
- Modify: `src/systems/step-world.test.ts`（満員 2 本の書き換え + 新テスト 1 本）

旧仕様「満員でも満腹は消化する（誕生はしない）」を押し出し方式に書き換える（docs/spec.md 決定ログ 3 は更新済み）。

- [ ] **Step 1: 満員時の既存テスト 2 本を書き換え、新テストを追加する**

`src/systems/step-world.test.ts` の「住民 8 体で満員のときは満腹がリセットされるだけで誕生しない」テストを**削除**し、以下に置き換える:

```typescript
test("満員でも誕生し、同サイズ階級からランダムに 1 体が退場予定になる（押し出し）", () => {
  const full: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  }));
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: full }),
    fixedRandom,
  );
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(9); // 一時的に 9 体を許容
  // 新生児: nextBirthSpecies(8) = BIRTH_TABLE[8 % 3 = 2] = taiyaki（末尾に追加）
  const born = next.residents[8];
  expect(born.species).toBe("taiyaki");
  expect(born.bornAtMs).toBeCloseTo(TICK_MS, 5);
  expect(born.departing).toBe(false);
  // 押し出し: 全員 "S" = 新生児と同階級。乱数消費は 餌リスポーン baseY →
  // 押し出し選定 → 新生児 dir の順なので floor(0.5 * 8) = 4 が退場予定になる
  expect(next.residents.filter((r) => r.departing).length).toBe(1);
  expect(next.residents[4].departing).toBe(true);
  // 押し出された住民は消えず泳ぎ続ける（消えるのは視界外に出た瞬間）
  expect(next.residents[4].x).toBeCloseTo(280.25, 5); // 200 + 4*20 + speed 0.25
});
```

「満員時も満腹 4 + 同 tick 2 匹捕食の超過分 1 は繰り越される（誕生はしない）」テストを以下に書き換える（フィクスチャの `full` はそのまま、期待値とタイトルを変更）:

```typescript
test("満員で満腹 4 + 同 tick 2 匹捕食でも誕生し、超過分 1 は繰り越される", () => {
  const full: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  }));
  const secondBait: Bait = {
    x: 88,
    baseY: 54,
    y: 54,
    dir: 1,
    phase: -(TICK_MS * 0.002),
  };
  const base = stateWithBaitAtHead({ satiety: 4, residents: full });
  const next = stepWorld(
    { ...base, baits: [...base.baits, secondBait] },
    fixedRandom,
  );
  expect(next.residents.length).toBe(9); // 押し出し誕生
  expect(next.satiety).toBe(1); // 6 - SATIETY_MAX。繰り越しは満員でも同じ
});
```

新テストを追加（実効数の定義を検証）:

```typescript
test("退場予定は定員に数えない（8 体中 1 体退場予定なら押し出しなしで誕生する）", () => {
  // 退場予定の 1 体は視界内（x=60）に置き、この tick で消えないようにする
  const residents: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: i === 0 ? 60 : 200 + i * 20,
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: i === 0,
  }));
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents }),
    fixedRandom,
  );
  // 実効 7 体 < RESIDENT_MAX なので通常誕生（押し出しなし）
  expect(next.residents.length).toBe(9);
  expect(next.residents.filter((r) => r.departing).length).toBe(1); // 元の 1 体のまま
  expect(next.residents[8].bornAtMs).toBeCloseTo(TICK_MS, 5);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/step-world.test.ts`
Expected: FAIL 3 本（現実装は満員時に誕生しないため `expect(8).toBe(9)` で落ちる。「退場予定は定員に数えない」も residents.length が 8 のまま）

- [ ] **Step 3: stepWorld の誕生ブロックを押し出し方式に書き換える**

`src/systems/step-world.ts` の import に追加:

```typescript
import { SPECIES_SIZE } from "../data/species-size";
import { countActiveResidents } from "./count-active-residents";
import { pickDepartingIndex } from "./pick-departing-index";
```

誕生ブロック全体（`if (satiety >= SATIETY_MAX) { ... }`）を以下に置き換える:

```typescript
  if (satiety >= SATIETY_MAX) {
    // 同tick複数捕食の超過分は次の誕生へ繰り越す（docs/spec.md 決定ログ参照）
    // 安全性: BAIT_COUNT=3 より 1 tick の最大加算は 3 → 繰り越しは最大 2 で
    // SATIETY_MAX(5) に届かず、二重誕生は構造的に不可能。
    // セレモニー中は捕食無効なので誕生の連鎖も起きない
    satiety -= SATIETY_MAX;
    const species = nextBirthSpecies(residents.length);
    // 満員（退場予定を除く実効数が上限）でも誕生する（押し出し方式。
    // docs/spec.md 決定ログ 3 参照）。新生児と同サイズ階級から 1 体を退場予定にする。
    // 新生児を配列に加える前に選ぶことで新生児自身を対象から除外する
    if (countActiveResidents(residents) >= RESIDENT_MAX) {
      const departingIndex = pickDepartingIndex(
        residents,
        SPECIES_SIZE[species],
        random,
      );
      residents = residents.map((resident, index) =>
        index === departingIndex ? { ...resident, departing: true } : resident,
      );
    }
    const baseY = clamp(hero.y, RESIDENT_MIN_BASE_Y, RESIDENT_MAX_BASE_Y);
    const born: Resident = {
      species,
      x: hero.x,
      baseY,
      y: baseY,
      dir: random() < 0.5 ? -1 : 1,
      // 演出明け（bornAtMs + BIRTH_FX_TOTAL_MS）に sin 項が 0 になる位相。
      // 演出中は y=baseY で静止するため、復帰時の y 飛びを防ぐ
      phase:
        -(elapsedMs + BIRTH_FX_TOTAL_MS) * SPECIES_MOTION[species].bobFrequency,
      bornAtMs: elapsedMs,
      arrivedAtMs: elapsedMs,
      departing: false,
    };
    residents = [...residents, born];
    // セレモニー中はカメラ（主人公追従）を止め誕生地点にフォーカスするため即座に静止
    hero = { ...hero, vx: 0, vy: 0 };
  }
```

（旧コードの `if (residents.length < RESIDENT_MAX)` 分岐と「満員で誕生しない場合も同様に繰り越す」のコメント行は削除する）

- [ ] **Step 4: 全テストが通ることを確認する**

Run: `bunx tsc --noEmit && bun test`
Expected: 217 tests / 0 fail（Task 7〜10 の新規 14 本と本タスクの +1 本を含む。満員以外の誕生テストは乱数消費順が変わらないため無修正で通る）

- [ ] **Step 5: コミット**

```bash
git add src/systems/step-world.ts src/systems/step-world.test.ts
git commit -m "feat: 満員でも誕生する押し出し方式に変更（同サイズ階級から退場予定を選ぶ）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: stepWorld — 退場予定住民の視界外消滅

**Files:**
- Modify: `src/systems/step-world.ts`
- Modify: `src/systems/step-world.test.ts`（新テスト 1 本）

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/step-world.test.ts` に追加:

```typescript
test("退場予定の住民は視界外に出た瞬間に消え、視界内なら泳ぎ続ける", () => {
  // hero は水流で x=100.00768 に進む → camX = 36.00768。
  // 生存域は screenX ∈ [-12, 140]（DESPAWN_MARGIN_PX=12）
  const base = {
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
  };
  const goneDeparting: Resident = {
    ...base,
    species: "ramuneFish",
    x: 300, // screenX ≈ -215.8（完全に視界外）→ 消える
    departing: true,
  };
  const farNonDeparting: Resident = {
    ...base,
    species: "strawberryJelly",
    x: 300, // 同じ位置でも退場予定でなければ消えない
    departing: false,
  };
  const nearDeparting: Resident = {
    ...base,
    species: "taiyaki",
    x: 60, // screenX ≈ 24.2（視界内）→ 退場予定でもまだ消えない
    departing: true,
  };
  const next = stepWorld(
    stateWithBaitAtHead({
      residents: [goneDeparting, farNonDeparting, nearDeparting],
      baits: [], // 捕食・誕生を絡めない
    }),
    fixedRandom,
  );
  expect(next.residents.map((r) => r.species)).toEqual([
    "strawberryJelly",
    "taiyaki",
  ]);
  expect(next.residents[1].departing).toBe(true); // 視界内の退場予定は維持
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/step-world.test.ts`
Expected: FAIL 1 本（現実装は消滅処理がないため 3 体のまま。`expect(["ramuneFish", "strawberryJelly", "taiyaki"]).toEqual([...])` で落ちる）

- [ ] **Step 3: 消滅処理を実装する**

`src/systems/step-world.ts` の import に追加:

```typescript
import { isOutOfView } from "./is-out-of-view";
```

住民の移動処理の直後（誕生ブロックの前）に追加:

```typescript
  let residents = state.residents.map((resident) =>
    stepResident(resident, elapsedMs),
  );
  // 退場予定の住民は視界外（余白込み）に出た瞬間に静かに消える（退場演出はスコープ外）。
  // 判定は移動後の位置 × 移動後の hero（カメラ）で行う
  residents = residents.filter(
    (resident) => !(resident.departing && isOutOfView(resident.x, hero.x)),
  );
```

- [ ] **Step 4: 全テストが通ることを確認する**

Run: `bunx tsc --noEmit && bun test`
Expected: 218 tests / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/systems/step-world.ts src/systems/step-world.test.ts
git commit -m "feat: 退場予定の住民を視界外で静かに消す

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: stepWorld — 来訪抽選 + main.ts 配線

**Files:**
- Modify: `src/systems/step-world.ts`（第 3 引数 `discovered` 追加 + 来訪ブロック）
- Modify: `src/systems/step-world.test.ts`（既存の全 stepWorld 呼び出しに `, []` 追加 + 新テスト 5 本）
- Modify: `src/main.ts`

stepWorld の署名変更と main.ts の追随を同一コミットで行う（分けるとコンパイルが通らない中間状態ができる）。

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/step-world.test.ts` の import に追加:

```typescript
import { VISIT_INTERVAL_MS } from "../data/roster-constants";
import { detectBornResident } from "./detect-born-resident";
import { isBirthFxActive } from "./is-birth-fx-active";
```

新テストを追加（この時点では第 3 引数が無いのでコンパイル上は余分な引数だが、bun test は型を見ないため実行され、ロジック未実装で落ちる）:

```typescript
test("来訪チェック時刻を過ぎると抽選し、当たれば視界外から 1 体来訪する", () => {
  const state = stateWithBaitAtHead({ baits: [], nextVisitCheckMs: 0 });
  // random=0.4: 当選（0.4 < VISIT_CHANCE 0.5）→ 種 floor(0.4*1)=0 →
  // 左右 0.4 < 0.5 = 左外 → baseY 24 + 0.4*94 = 61.6 → phase 2.4
  const next = stepWorld(state, () => 0.4, ["ramuneFish"]);
  expect(next.residents.length).toBe(1);
  const visitor = next.residents[0];
  expect(visitor.species).toBe("ramuneFish");
  // hero は水流で 100.00768 に進む → camX = 36.00768 → 左外湧き = camX - 16
  expect(visitor.x).toBeCloseTo(20.00768, 3);
  expect(visitor.dir).toBe(1); // 視界へ向かって泳ぐ
  expect(visitor.baseY).toBeCloseTo(61.6, 5);
  expect(visitor.bornAtMs).toBe(-BIRTH_FX_TOTAL_MS);
  expect(visitor.arrivedAtMs).toBeCloseTo(TICK_MS, 5);
  expect(visitor.departing).toBe(false);
  expect(next.nextVisitCheckMs).toBe(VISIT_INTERVAL_MS); // 0 + 300000
  // 来訪では誕生演出・図鑑更新が発火しない（明示検証）
  expect(isBirthFxActive(visitor.bornAtMs, next.elapsedMs)).toBe(false);
  expect(detectBornResident(next.residents, next.elapsedMs)).toBeUndefined();
});

test("抽選に外れたら来訪せず、次回チェック時刻だけ進む", () => {
  const state = stateWithBaitAtHead({ baits: [], nextVisitCheckMs: 0 });
  const next = stepWorld(state, () => 0.6, ["ramuneFish"]); // 0.6 >= 0.5 で外れ
  expect(next.residents.length).toBe(0);
  expect(next.nextVisitCheckMs).toBe(VISIT_INTERVAL_MS);
});

test("チェック時刻に達していなければ抽選しない", () => {
  const state = stateWithBaitAtHead({ baits: [] }); // nextVisitCheckMs = 300000（初期値）
  const next = stepWorld(state, () => 0.4, ["ramuneFish"]);
  expect(next.residents.length).toBe(0);
  expect(next.nextVisitCheckMs).toBe(VISIT_INTERVAL_MS); // 据え置き
});

test("定員（退場予定を除く 8 体）のときは来訪しない", () => {
  const full: Resident[] = Array.from({ length: 8 }, (_, i) => ({
    species: "ramuneFish" as const,
    x: 60 + i * 10, // 全員視界周辺（despawn と無関係、departing=false なので消えない）
    baseY: 60,
    y: 60,
    dir: 1 as const,
    phase: 0,
    bornAtMs: -10000,
    arrivedAtMs: 0,
    departing: false,
  }));
  const state = stateWithBaitAtHead({
    baits: [],
    residents: full,
    nextVisitCheckMs: 0,
  });
  const next = stepWorld(state, () => 0.4, ["ramuneFish"]);
  expect(next.residents.length).toBe(8);
  expect(next.nextVisitCheckMs).toBe(VISIT_INTERVAL_MS); // チェック自体は消化する
});

test("未発見（discovered が空）なら当たっても来訪しない", () => {
  const state = stateWithBaitAtHead({ baits: [], nextVisitCheckMs: 0 });
  const next = stepWorld(state, () => 0.4, []);
  expect(next.residents.length).toBe(0);
  expect(next.nextVisitCheckMs).toBe(VISIT_INTERVAL_MS);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/step-world.test.ts`
Expected: FAIL（来訪ロジック未実装のため「当たれば来訪」で residents.length が 0、「外れ」系でも nextVisitCheckMs が 0 のままで落ちる）

- [ ] **Step 3: stepWorld に来訪ブロックと第 3 引数を実装する**

`src/systems/step-world.ts` の import に追加:

```typescript
import { VISIT_CHANCE, VISIT_INTERVAL_MS } from "../data/roster-constants";
import type { Flash, GameState, Resident, SpeciesId } from "../types";
import { createVisitor } from "./create-visitor";
```

（`types` の import 行は既存を書き換えて `SpeciesId` を足す）

関数署名と JSDoc を変更:

```typescript
/**
 * 1 tick の全状態更新。主人公 → 餌移動 → 捕食 → 住民移動 → 退場消滅 →
 * 満腹/誕生（押し出し） → 来訪抽選 → フラッシュ寿命。
 * 誕生セレモニー中は主人公を完全静止させ（path は消費せず保持）、捕食判定もスキップする。
 * カメラは主人公追従なので、これで誕生地点が画面内に留まる
 * @param discovered - 発見済みの種（来訪抽選の候補。境界層が図鑑から導出して渡す）
 */
export function stepWorld(
  state: GameState,
  random: () => number,
  discovered: readonly SpeciesId[],
): GameState {
```

誕生ブロックの後・return の前に来訪ブロックを追加し、return を差し替える:

```typescript
  // まれな来訪: ゲーム内時間で VISIT_INTERVAL_MS ごとに 1 回だけ抽選する。
  // 実効数（退場予定を除く）が定員未満・発見種ありのときだけ乱数を引く
  // （乱数消費を条件付きにして既存の消費順ピンを守る）。来た子は帰らない
  let nextVisitCheckMs = state.nextVisitCheckMs;
  if (elapsedMs >= nextVisitCheckMs) {
    nextVisitCheckMs += VISIT_INTERVAL_MS;
    if (
      countActiveResidents(residents) < RESIDENT_MAX &&
      discovered.length > 0 &&
      random() < VISIT_CHANCE
    ) {
      residents = [
        ...residents,
        createVisitor(discovered, hero.x, elapsedMs, random),
      ];
    }
  }

  return {
    hero,
    path,
    baits,
    residents,
    flashes,
    satiety,
    elapsedMs,
    nextVisitCheckMs,
  };
```

- [ ] **Step 4: 既存の全 stepWorld 呼び出しに第 3 引数を追加する**

`src/systems/step-world.test.ts` 内の既存呼び出し（Step 1 で追加した 5 本以外の全て。約 14 箇所）を機械的に置き換える:

```typescript
stepWorld(state, fixedRandom)  →  stepWorld(state, fixedRandom, [])
```

（来訪は初回チェックが elapsedMs ≥ VISIT_INTERVAL_MS のため、既存テストの範囲では `[]` でも挙動・乱数消費に影響しない）

`src/main.ts` の import に追加:

```typescript
import { discoveredSpecies } from "./systems/discovered-species";
```

advance 内の呼び出しを変更:

```typescript
  state = stepWorld(state, Math.random, discoveredSpecies(zukan));
```

- [ ] **Step 5: 全テスト・型・lint が通ることを確認する**

Run: `bunx tsc --noEmit && bun run lint && bun test`
Expected: tsc・lint エラーなし、223 tests / 0 fail

- [ ] **Step 6: コミット**

```bash
git add src/systems/step-world.ts src/systems/step-world.test.ts src/main.ts
git commit -m "feat: ゲーム内 5 分ごとの来訪抽選を追加（発見済み種が視界外から登場）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: docs/spec.md のテスト観点更新 + 全体検証

**Files:**
- Modify: `docs/spec.md`

決定ログ 3 は設計時に更新済み。テスト観点の 1 行だけが旧仕様のまま残っている。

- [ ] **Step 1: テスト観点の行を更新する**

`docs/spec.md` の「## テスト観点」内:

```markdown
- 異常系: 満員時の誕生抑制 / 入力座標のクランプ / タブ復帰時のtick消化上限
```

を以下に変更:

```markdown
- 異常系: 満員時の押し出し（退場予定の付与と視界外での消滅） / 入力座標のクランプ / タブ復帰時のtick消化上限
```

- [ ] **Step 2: 全体検証（CI と同じ 4 点セット）**

Run: `bun run lint && bunx tsc --noEmit && bun test && bun run build`
Expected: すべて成功。bun test は 223 tests / 0 fail（ベースライン 194 + 新規 29 本。全既存テスト維持、うち満員 2 本は押し出し仕様に書き換え済み）

- [ ] **Step 3: コミット**

```bash
git add docs/spec.md
git commit -m "docs: テスト観点を押し出し方式に更新

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 15: 実機確認（Chrome）

**Files:** なし（確認のみ。定数の一時変更はコミットしない）

- [ ] **Step 1: 開発サーバーを起動して Chrome で開く**

Run: `bun run dev`（Vite の表示する URL を Chrome で開く）

- [ ] **Step 2: リロードで顔ぶれが変わることを確認する**

- 図鑑に 3 種発見済みのセーブがある状態でリロードを数回繰り返す
- 泳いでいる数が 2〜3 体の間で揺らぐ（3 種発見時の上限は 3）・組み合わせが変わることを確認
- localStorage を消して新規開始した場合は 0 体（図鑑が空）で始まることを確認

- [ ] **Step 3: 満員誕生の押し出しを確認する**

- 餌を食べ続けて住民を 8 体まで増やす（既存セーブの satiety を活かすと速い）
- 8 体の状態でさらに満腹 5 にする → **誕生演出が発生する**（旧仕様では何も起きなかった）
- 一時的に 9 体になり、どれか 1 体が泳ぎ続けたまま、主人公が泳ぎ去って画面外に出た（または住民自身が視界外へ泳ぎ出た）タイミングで静かに消えることを確認
- 図鑑の誕生数がカウントアップされることを確認

- [ ] **Step 4: 来訪の登場を確認する**

- 確認を速くするため `src/data/roster-constants.ts` の `VISIT_INTERVAL_MS` を一時的に `10000`、`VISIT_CHANCE` を `1` に変えて（**コミット禁止**）ゲーム内 10 秒待つ
- 画面の左右どちらか外側から新しい住民が泳いで入ってくること・**誕生演出（暗転・泡）が出ないこと**・図鑑の誕生数が増えないことを確認
- 定員 8 体のときは来訪しないことを確認
- 確認後、定数を必ず元に戻し `git diff` が空（未コミット変更なし）であることを確認する

Run: `git diff --stat`
Expected: 出力なし（作業ツリーがクリーン）

---

## Self-Review 記録（計画作成時に実施済み）

- **設計カバレッジ**: 設計ドキュメントの仕様 1（開始抽選ゆらぎ）= Task 6、仕様 2（誕生滞在）= 既存挙動維持、仕様 3（来訪）= Task 10・13、仕様 4（押し出し）= Task 1・8・11・12、仕様 5（elapsedMs 基準）= nextVisitCheckMs 含め全てゲーム内時間、仕様 6（セーブ変更なし）= SaveData 非変更・restore テストで検証。決定ログ更新 = 設計時に実施済み + Task 14 でテスト観点を追随
- **カメラ設計判断**（設計ドキュメントの検討事項）: stepWorld にカメラを入力せず `camX = mod(hero.x - VIEW_WIDTH/2, WORLD_WIDTH)` を hero.x から導出（Task 9・10）
- **型整合**: `pickDepartingIndex(residents, SizeClass, random) → number` / `createVisitor(discovered, heroX, elapsedMs, random) → Resident` / `isOutOfView(x, heroX) → boolean` / `countActiveResidents(residents) → number` / `discoveredSpecies(zukan) → SpeciesId[]` / `stepWorld(state, random, discovered)` — 定義タスクと使用タスクで一致を確認済み
- **乱数消費順**: 既存ピン（pick-starting-residents の抽選順・step-world の餌リスポーン→dir）への影響を各タスクで手計算検証済み
