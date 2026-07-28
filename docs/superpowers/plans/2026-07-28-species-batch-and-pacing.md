# 新種5匹の一括追加と誕生ペーシング 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 図鑑を3種→8種に拡張し、必要餌数を `satietyMax(zukan) = 5 + floor(発見数 / 2)` の純粋関数で発見数に応じて漸増させる。

**Architecture:** ペーシング先行（小さく独立）→ 種追加（データ一括 + スプライト5ファイル）の2タスク構成。`SATIETY_MAX = 5` 定数の直接参照を全廃し、`satietyMax(zukan)` 純粋関数に集約する。セーブスキーマは version 1 のまま不変（発見数も必要数も `zukan` から毎回導出）。種追加は `Record<SpeciesId, ...>` の網羅性チェックで漏れが tsc に強制される。

**Tech Stack:** TypeScript / Bun test（`bun test`）/ Biome（`bun run lint`）/ tsc（`bunx tsc --noEmit`）/ Vite（`bun run build`）。

---

## 設計・現物との差分（実装前に必読）

1. **`parse-save.ts` も `SATIETY_MAX` を参照している**（設計書の実装箇所リストに未記載。grep で発見）。満腹の上限バリデーション `satiety >= SATIETY_MAX` を `satiety >= satietyMax(zukan)` に変える。上限が発見数に依存するため、**満腹より先に図鑑をパースする順序**へ組み替える必要がある（現状は満腹→図鑑の順）。
2. **HUD 満腹ゲージは `satietyMax` を数値パラメータで受け取る**（`src/render/draw-scene.ts:135` の `for (i < SATIETY_MAX)`）。描画層に漸増ロジックや `zukan` 依存を持ち込まず、`main.ts` が `satietyMax(zukan)` を計算して渡す（レンダラは「N 個のピップを描く」だけに保つ）。
3. **`SATIETY_MAX` 定数は `world-constants.ts` から削除する**。直接参照者（step-world / draw-scene / parse-save）を全て `satietyMax()` 経由に置換した後、ベース値 `5` は `satiety-max.ts` 内の private const `SATIETY_BASE` に移す。grep で確認済みの参照箇所は step-world / draw-scene / parse-save とテストのコメントのみ。
4. **⚠ 式と設計表の不整合（全種発見時）**: 決定ログ／設計の式は `5 + floor(発見数 / 2)`。発見数 8（全種発見）では `5 + floor(8/2) = 9`。一方、設計書の表は「全種発見後 = 8匹（変化なし）」と記載。**本計画は決定ログの式（spec.md 決定ログ6が正）を literal に実装し、全種発見時は 9 とする**。テストもこの値をピンする。gameplay 上は誕生後の birthCount 蓄積速度に微差があるのみ（コンプリート後は新規発見が起きないため体験差は小さい）。**オーナーに要確認**（8 に丸めたい場合は `Math.min(発見数, 7)` 等でキャップ）。
5. **step-world の誕生テストを「発見数から閾値を導出する」形にリファクタする**。現状 line 54・131 の誕生テストは 2 種発見済み `zukan` を渡すため、pacing 後は `satietyMax = 6` になり satiety=5 では誕生しない（テストが割れる）。さらに Task 2 で種が増えると「未発見が1種」の前提も崩れる。両方に強いよう、`SPECIES_IDS` から「対象種以外を全発見させる」ヘルパー + `satietyMax(zukan)` で必要数を導出する形へ書き換える（Task 1 で実施 → Task 2 では無変更で通る）。
6. **スプライトの扱い（採用方式）**: **本番グリッドを実装ステップで作成**する（プレースホルダ骨格は不採用＝後から仕上げる死蔵ステップを作らない、No Placeholders 原則）。ただし**量産式**で既存テンプレートを最大流用する:
   - しょうゆだい: ラムネ魚シルエットを下敷きに白ボディ＋赤キャップへリマップ（たい焼き＝ラムネ流用の前例に倣う）。
   - ソーダ／コーラクマノミ: クマノミ形状テンプレートを1つ新規作成し、**コーラはソーダの frame 文字列をそのまま流用（パレットのみ差し替え）**。`taiyakiSprite.frames[0] === ramuneFishSprite.frames[0]` を pin する既存テスト慣例に倣い、`colaClownfishSprite.frames === sodaClownfishSprite.frames` を deep-equal で pin する。
   - こんぺいとうヒトデ／マカロンフグ: 星形・まんまるを新規シルエットで作成。
   本計画は各種の**パレット hex を確定**し、**形状の言語仕様**と**フレーム差分の内容**を与える。グリッド本体（16×16 文字列）は実装者が仕様に沿って作成し、**機械的受け入れ基準はテスト**（16×16・パレット網羅・2フレーム同寸・フレーム間差分・クマノミ量産式）で担保する。見た目の良否はオーナーが Chrome で目視レビューし、気に入らない種はリテイクする（設計書 検証 節）。

## ファイル構成

### Task 1: ペーシング

| ファイル | 操作 | 責務 |
|---|---|---|
| `src/systems/satiety-max.ts` | 新規 | `satietyMax(zukan): number` = `5 + floor(発見数/2)`。純粋関数・一関数一ファイル |
| `src/systems/satiety-max.test.ts` | 新規 | 境界値テスト（発見 0/1/2/3 種。7/8 は Task 2 で追加） |
| `src/systems/step-world.ts` | 変更 | 誕生判定・繰り越しを `satietyMax(zukan)` 参照へ。`SATIETY_MAX` import 削除 |
| `src/systems/step-world.test.ts` | 変更 | 誕生テスト2件を発見数導出型へ書き換え。`{}` 系はコメントのみ更新 |
| `src/render/draw-scene.ts` | 変更 | `drawScene` に `satietyMax: number` 引数追加。ゲージ分母を動的化。`SATIETY_MAX` import 削除 |
| `src/main.ts` | 変更 | `drawScene(..., satietyMax(zukan))`。`satietyMax` import 追加 |
| `src/save/parse-save.ts` | 変更 | 図鑑を先にパース → 満腹を `satietyMax(zukan)` で検証。import 追加 |
| `src/save/parse-save.test.ts` | 変更 | 満腹境界テストを動的上限へ更新。空図鑑ケース追加 |
| `src/data/world-constants.ts` | 変更 | `SATIETY_MAX` 定数を削除 |

### Task 2: 新種5匹

| ファイル | 操作 | 責務 |
|---|---|---|
| `src/types.ts` | 変更 | `SpeciesId` union に5種追加 |
| `src/data/species-names.ts` | 変更 | 5種の表示名追加 |
| `src/data/species-motion.ts` | 変更 | 5種の泳ぎパラメータ追加 |
| `src/data/species-size.ts` | 変更 | 5種を "S" 追加。ピンテスト名を更新 |
| `src/data/sprites/shoyu-dai.ts` | 新規 | しょうゆだいスプライト |
| `src/data/sprites/soda-clownfish.ts` | 新規 | ソーダクマノミ（クマノミ形状テンプレート） |
| `src/data/sprites/cola-clownfish.ts` | 新規 | コーラクマノミ（soda の frames 流用・パレット差し替え） |
| `src/data/sprites/konpeito-starfish.ts` | 新規 | こんぺいとうヒトデ |
| `src/data/sprites/macaron-puffer.ts` | 新規 | マカロンフグ |
| `src/data/resident-sprites.ts` | 変更 | 5種を `RESIDENT_SPRITES` に登録 |
| `src/data/sprites/sprites.test.ts` | 変更 | 5種を整合性配列へ追加＋フレーム差分・量産式テスト |
| `src/systems/satiety-max.test.ts` | 変更 | 発見 6/7/8 種の境界テストを追加（種が揃って初めて構築可能） |

## 前提コンテキスト（実装者向け）

- `SpeciesId`（`src/types.ts:22`）は文字列 union。`Zukan = Partial<Record<SpeciesId, ZukanEntry>>`。未発見の種はキーごと存在しない。
- `SPECIES_IDS`（`src/data/species-ids.ts`）は `Object.keys(SPECIES_NAMES)` から導出。順序＝定義順。図鑑表示順・誕生抽選プール順がこれに従う。
- `discoveredSpecies(zukan)`（`src/systems/discovered-species.ts`）は `SPECIES_IDS.filter((id) => zukan[id] !== undefined)`。発見数は `.length`。
- 網羅 Record（追加漏れを tsc が強制する）: `SPECIES_NAMES` / `SPECIES_MOTION` / `SPECIES_SIZE` / `RESIDENT_SPRITES`。`SpeciesId` に種を足すとこの4つで型エラーになる。
- `is-resident-flipped.ts` は `species !== "strawberryJelly" && dir > 0`。新5種は全て「進行方向で反転」扱いになる（魚形は正しく前を向き、星形・まんまるは左右対称なので反転は無害）。**変更不要**（データ駆動化は M2 候補・スコープ外）。
- スプライトの `palette` 文字規律: `H`=ハイライト / `L`=ライト / `S`=基調 / `M`=中間陰 / `E`=selout輪郭 / `O`=目。種ごとに独立（グローバル共有禁止）。追加色が要る場合は別文字を足してよい（`Sprite.palette` に個数制限はない）。
- 全 pure 関数テストは `import { expect, test } from "bun:test";`。描画（draw-scene）はテストしない（spec.md）。
- 一関数一ファイル厳守。private const（例: `SATIETY_BASE`）は単一関数の実装詳細として同居可。
- **import 順序**: biome が全ファイルの import を昇順整列する（`../data/...` < `../systems/...` < `../types` < `./...`）。既存の整列済みブロックへ import を挿す Step（step-world.ts / step-world.test.ts / main.ts / resident-sprites.ts / sprites.test.ts）で lint が順序を指摘したら、`biome check --write .` で自動整列してから再検査する（`bun run lint` は検査のみで自動修正しない）。

---

## Task 1: 誕生ペーシング（satietyMax 漸増式）

シグネチャ変更が複数ファイルに波及するため、全ファイルを緑にしてから1コミットする。

**Files:**
- Create: `src/systems/satiety-max.ts`, `src/systems/satiety-max.test.ts`
- Modify: `src/systems/step-world.ts`, `src/systems/step-world.test.ts`
- Modify: `src/render/draw-scene.ts:9,135`, `src/main.ts:7,65`
- Modify: `src/save/parse-save.ts`, `src/save/parse-save.test.ts`
- Modify: `src/data/world-constants.ts:52`

- [ ] **Step 1: satiety-max.test.ts を作成（失敗するテスト）**

`src/systems/satiety-max.test.ts` を新規作成する:

```ts
import { expect, test } from "bun:test";
import { SPECIES_IDS } from "../data/species-ids";
import type { Zukan, ZukanEntry } from "../types";
import { satietyMax } from "./satiety-max";

const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-28T00:00:00.000Z",
  birthCount: 1,
};

/** 先頭 n 種を発見済みにした図鑑を作る（発見数がちょうど n になる） */
function discoverFirst(n: number): Zukan {
  const zukan: Zukan = {};
  for (const id of SPECIES_IDS.slice(0, n)) zukan[id] = entry;
  return zukan;
}

test("発見 0 種ならベース値 5", () => {
  expect(satietyMax({})).toBe(5);
  expect(satietyMax(discoverFirst(0))).toBe(5);
});

test("発見 1 種でも 5（floor(1/2)=0）", () => {
  expect(satietyMax(discoverFirst(1))).toBe(5);
});

test("発見 2 種で 6（floor(2/2)=1）", () => {
  expect(satietyMax(discoverFirst(2))).toBe(6);
});

test("発見 3 種でも 6（floor(3/2)=1）", () => {
  expect(satietyMax(discoverFirst(3))).toBe(6);
});

test("発見数だけに依存し、どの種を発見したかには依存しない", () => {
  const a: Zukan = { ramuneFish: entry, taiyaki: entry };
  const b: Zukan = { strawberryJelly: entry, taiyaki: entry };
  expect(satietyMax(a)).toBe(satietyMax(b));
  expect(satietyMax(a)).toBe(6);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test src/systems/satiety-max.test.ts`
Expected: FAIL（`satietyMax` が未定義 / モジュール解決不可）

- [ ] **Step 3: satiety-max.ts を実装**

`src/systems/satiety-max.ts` を新規作成する:

```ts
import type { Zukan } from "../types";
import { discoveredSpecies } from "./discovered-species";

/** 誕生に必要な餌数のベース（発見 0〜1 種のときの値）。旧 SATIETY_MAX 定数の後継 */
const SATIETY_BASE = 5;

/**
 * 誕生に必要な餌数。発見数が増えるほど漸増する（5 + floor(発見数 / 2)）。
 * 純粋関数。「次の必要数」はセーブに持たず毎回ここで導出する（スキーマ不変）。
 * @param zukan - 図鑑。発見数は discoveredSpecies(zukan).length で導出する
 */
export function satietyMax(zukan: Zukan): number {
  return SATIETY_BASE + Math.floor(discoveredSpecies(zukan).length / 2);
}
```

- [ ] **Step 4: satiety-max のテストが通ることを確認**

Run: `bun test src/systems/satiety-max.test.ts`
Expected: PASS（5 tests）。import 順序を biome が指摘したら `bun run lint` で確認・整列する

- [ ] **Step 5: step-world.ts を satietyMax(zukan) 参照へ変更**

`src/systems/step-world.ts` を編集する。

(a) world-constants の import（3-10 行目）から `SATIETY_MAX,` の1行を削除する（`RESIDENT_MAX`・`TICK_MS` 等は残す）。

(b) systems import 群に次を追加する（biome が `./respawn-bait` と `./step-bait` の間へ整列する）:

```ts
import { satietyMax } from "./satiety-max";
```

(c) 誕生判定ブロック（73-97 行目）を次に置き換える。旧:

```ts
  if (satiety >= SATIETY_MAX) {
    // 同tick複数捕食の超過分は次の誕生へ繰り越す（docs/spec.md 決定ログ参照）
    // 安全性: BAIT_COUNT=3 より 1 tick の最大加算は 3 → 繰り越しは最大 2 で
    // SATIETY_MAX(5) に届かず、二重誕生は構造的に不可能。
    // セレモニー中は捕食無効なので誕生の連鎖も起きない
    satiety -= SATIETY_MAX;
```

新（先頭で必要数を導出し、以降 `need` を参照する。他行は不変）:

```ts
  const need = satietyMax(zukan);
  if (satiety >= need) {
    // 同tick複数捕食の超過分は次の誕生へ繰り越す（docs/spec.md 決定ログ参照）
    // 安全性: BAIT_COUNT=3 より 1 tick の最大加算は 3 → 繰り越しは最大 2 で
    // need（最小 5）に届かず、二重誕生は構造的に不可能。
    // セレモニー中は捕食無効なので誕生の連鎖も起きない
    satiety -= need;
```

（`const species = nextBirthSpecies(zukan, random);` 以降のブロックはそのまま）

- [ ] **Step 6: step-world.test.ts の誕生テストを発見数導出型へ書き換える**

`src/systems/step-world.test.ts` を編集する。

(a) import に `satietyMax`・`SPECIES_IDS`・`SpeciesId` を足す。5-6 行目付近を次のように補う（既存 import は残す）:

```ts
import { SPECIES_IDS } from "../data/species-ids";
import type { Bait, GameState, Resident, SpeciesId, Zukan, ZukanEntry } from "../types";
import { satietyMax } from "./satiety-max";
```

`zukanEntry` フィクスチャ（14-17 行目）の直後にヘルパーを追加する:

```ts
/** 対象種以外を全発見させた図鑑（未発見をちょうど1種に絞る。種数が増えても堅牢） */
function zukanDiscoveringAllExcept(target: SpeciesId): Zukan {
  const zukan: Zukan = {};
  for (const id of SPECIES_IDS) if (id !== target) zukan[id] = zukanEntry;
  return zukan;
}
```

(b) 「満腹 5 で誕生する（未発見1種ならその種）」テスト（54-68 行目）を次に置き換える:

```ts
test("必要数に達すると誕生する（未発見が1種ならその種）", () => {
  // ramuneFish 以外を全発見 → 未発見は ramuneFish のみ
  const zukan = zukanDiscoveringAllExcept("ramuneFish");
  const need = satietyMax(zukan); // 発見数に応じた必要数（3種時は 6）
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: need - 1 }),
    fixedRandom,
    zukan,
  );
  expect(next.satiety).toBe(0); // (need-1)+1 - need
  expect(next.residents.length).toBe(1);
  expect(next.residents[0].species).toBe("ramuneFish");
  expect(next.residents[0].baseY).toBe(60); // clamp(hero.y, 24, 118)
  expect(next.flashes.length).toBe(1); // 捕食リング1個
});
```

(c) 「満員でも誕生し、同サイズ階級からランダムに 1 体が退場予定になる（押し出し）」テスト（131-163 行目）を次に置き換える（未発見を taiyaki のみに絞り新生児種を決定化。押し出し挙動は全員 "S" で不変）:

```ts
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
  // taiyaki 以外を全発見 → 未発見は taiyaki のみ
  const zukan = zukanDiscoveringAllExcept("taiyaki");
  const need = satietyMax(zukan);
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: need - 1, residents: full }),
    fixedRandom,
    zukan,
  );
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(9); // 一時的に 9 体を許容
  // 新生児は未発見唯一の taiyaki（末尾に追加）
  const born = next.residents[8];
  expect(born.species).toBe("taiyaki");
  expect(born.bornAtMs).toBeCloseTo(TICK_MS, 5);
  expect(born.departing).toBe(false);
  // 押し出し: 全員 "S" = 新生児と同階級。乱数は全て 0.5 の定数なので
  // 消費順が変わっても値は不変 → floor(0.5 * 8) = 4 が退場予定になる
  expect(next.residents.filter((r) => r.departing).length).toBe(1);
  expect(next.residents[4].departing).toBe(true);
  // 押し出された住民は消えず泳ぎ続ける（消滅判定は押し出しより前段）
  expect(next.residents[4].x).toBeCloseTo(280.25, 5); // 200 + 4*20 + speed 0.25
});
```

(d) `{}`（空図鑑 → `satietyMax` は常に 5）を渡す繰り越しテストのコメントを更新する。satiety=4 で誕生する挙動は不変（空図鑑では必要数 5 のまま）なので**アサーションは変えない**。99 行目 `// 6 - SATIETY_MAX。切り捨てず繰り越す` と 128 行目 `// 6 - SATIETY_MAX。繰り越しは満員でも同じ` をそれぞれ次に置き換える:

```ts
  expect(next.satiety).toBe(1); // 6 - satietyMax({})=5。切り捨てず繰り越す
```

```ts
  expect(next.satiety).toBe(1); // 6 - satietyMax({})=5。繰り越しは満員でも同じ
```

（他の `{}` を渡すテスト＝満腹4→誕生・演出系・来訪系は空図鑑で必要数5のまま変わらないので無変更）

- [ ] **Step 7: draw-scene.ts のゲージ分母を動的化**

`src/render/draw-scene.ts` を編集する。

(a) world-constants の import（5-12 行目）から `SATIETY_MAX,` の1行を削除する。

(b) `drawScene` シグネチャ（31-36 行目）に第5引数 `satietyMax: number` を追加する:

```ts
export function drawScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number,
  satietyMax: number,
): void {
```

(c) HUD ループ（135 行目）を置き換える:

```ts
  for (let i = 0; i < satietyMax; i++) {
```

- [ ] **Step 8: main.ts で satietyMax(zukan) を drawScene へ渡す**

`src/main.ts` を編集する。

(a) import 群に次を追加する（biome が整列する）:

```ts
import { satietyMax } from "./systems/satiety-max";
```

(b) drawScene 呼び出し（65 行目）を置き換える:

```ts
  drawScene(ctx, state, camX, camY, satietyMax(zukan));
```

- [ ] **Step 9: parse-save.ts を図鑑先パース＋動的上限へ組み替える**

`src/save/parse-save.ts` の全内容を次に置き換える（version → 図鑑 → 満腹 の順。満腹上限を `satietyMax(zukan)` に）:

```ts
import { SPECIES_IDS } from "../data/species-ids";
import { satietyMax } from "../systems/satiety-max";
import type { SaveData, SpeciesId, Zukan } from "../types";
import { createInitialSave } from "./create-initial-save";

/**
 * セーブ文字列を検証つきで読み取る。壊れた JSON・欠損フィールド・不正値は
 * すべて初期セーブへフォールバックする（クラッシュさせない・部分修復はしない）。
 * 満腹の上限は発見数に依存する（satietyMax(zukan)）ため、図鑑を先に検証する。
 */
export function parseSave(raw: string | null): SaveData {
  if (raw === null) return createInitialSave();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return createInitialSave();
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return createInitialSave();
  }
  const record = data as Record<string, unknown>;
  if (record.version !== 1) return createInitialSave();

  // 図鑑を先に検証・構築する（満腹の上限が発見数に依存するため順序が重要）
  const zukanRaw = record.zukan;
  if (
    typeof zukanRaw !== "object" ||
    zukanRaw === null ||
    Array.isArray(zukanRaw)
  ) {
    return createInitialSave();
  }
  const zukan: Zukan = {};
  for (const [key, value] of Object.entries(zukanRaw)) {
    if (!(SPECIES_IDS as readonly string[]).includes(key)) {
      return createInitialSave();
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return createInitialSave();
    }
    const entry = value as Record<string, unknown>;
    if (
      typeof entry.firstDiscoveredAt !== "string" ||
      Number.isNaN(Date.parse(entry.firstDiscoveredAt))
    ) {
      return createInitialSave();
    }
    if (
      typeof entry.birthCount !== "number" ||
      !Number.isInteger(entry.birthCount) ||
      entry.birthCount < 1 ||
      entry.birthCount > Number.MAX_SAFE_INTEGER
    ) {
      return createInitialSave();
    }
    zukan[key as SpeciesId] = {
      firstDiscoveredAt: entry.firstDiscoveredAt,
      birthCount: entry.birthCount,
    };
  }

  // 満腹は 0〜satietyMax(zukan)-1 の整数（stepWorld は誕生時に必ず減算するため
  // 保存値は上限未満に収まる）
  const satiety = record.satiety;
  if (
    typeof satiety !== "number" ||
    !Number.isInteger(satiety) ||
    satiety < 0 ||
    satiety >= satietyMax(zukan)
  ) {
    return createInitialSave();
  }

  return { version: 1, zukan, satiety };
}
```

- [ ] **Step 10: parse-save.test.ts の満腹境界テストを更新**

`src/save/parse-save.test.ts` を編集する。`validSave` は 2 種発見（ramuneFish, taiyaki）なので `satietyMax = 6`。

(a) 「satiety が不正（範囲外・非整数・型違い）なら初期セーブになる」テスト（51-65 行目）のコメントと 5→6 を置き換える:

```ts
test("satiety が不正（範囲外・非整数・型違い）なら初期セーブになる", () => {
  // validSave は 2 種発見 → satietyMax=6。6 以上は不正
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 6 }))).toEqual(
    createInitialSave(),
  );
  expect(parseSave(JSON.stringify({ ...validSave, satiety: -1 }))).toEqual(
    createInitialSave(),
  );
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 1.5 }))).toEqual(
    createInitialSave(),
  );
  expect(parseSave(JSON.stringify({ ...validSave, satiety: "2" }))).toEqual(
    createInitialSave(),
  );
});
```

(b) 「satiety の境界値 0 と 4（SATIETY_MAX - 1）は受理される」テスト（67 行目〜）を次に置き換える（上限が 6 なので受理境界は 5）:

```ts
test("satiety の境界値 0 と satietyMax-1（=5）は受理される", () => {
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 0 }))).toEqual({
    ...validSave,
    satiety: 0,
  });
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 5 }))).toEqual({
    ...validSave,
    satiety: 5,
  });
});
```

(c) 空図鑑では上限が 5 になることをピンするテストを追加する（動的上限の回帰防止）。ファイル末尾に追記:

```ts
test("空図鑑なら上限は 5（satietyMax({})）: satiety 4 は受理・5 は不正", () => {
  const emptyZukan = { version: 1, zukan: {}, satiety: 4 };
  expect(parseSave(JSON.stringify(emptyZukan))).toEqual({
    version: 1,
    zukan: {},
    satiety: 4,
  });
  expect(parseSave(JSON.stringify({ ...emptyZukan, satiety: 5 }))).toEqual(
    createInitialSave(),
  );
});
```

- [ ] **Step 11: world-constants.ts から SATIETY_MAX を削除**

`src/data/world-constants.ts:52` の行を削除する:

```ts
export const SATIETY_MAX = 5;
```

（51 行目のコメント `/** 満腹・誕生 */` は残す。直下の `RESIDENT_MAX` 等はそのまま）

- [ ] **Step 12: 全テストが通ることを確認**

Run: `bun test`
Expected: PASS（全スイート緑。satiety-max.test.ts の 5 件が増える）

- [ ] **Step 13: 型チェック**

Run: `bunx tsc --noEmit`
Expected: エラーなし（exit 0）。`SATIETY_MAX` の未解決参照が残っていればここで露見する

- [ ] **Step 14: Lint**

Run: `bun run lint`
Expected: 成功出力（import 未整列などの指摘がないこと）

- [ ] **Step 15: コミット**

```bash
git add src/systems/satiety-max.ts src/systems/satiety-max.test.ts src/systems/step-world.ts src/systems/step-world.test.ts src/render/draw-scene.ts src/main.ts src/save/parse-save.ts src/save/parse-save.test.ts src/data/world-constants.ts
git commit -m "$(cat <<'MSG'
feat: 誕生コストを発見数に応じた漸増式にする

SATIETY_MAX 定数の直接参照を廃止し、satietyMax(zukan)=5+floor(発見数/2)
の純粋関数に集約する。step-world の誕生判定・繰り越し、HUD ゲージ分母、
parse-save の満腹上限を動的化。セーブスキーマは version 1 のまま不変。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 2: 新種5匹の一括追加

`SpeciesId` 拡張で 4 つの網羅 Record が型エラーになるのを全て解消し、スプライト5ファイルを本番グリッドで作成する。全ファイルを緑にしてから1コミットする。

**Files:** ファイル構成表（Task 2）参照。

- [ ] **Step 1: types.ts の SpeciesId に5種追加**

`src/types.ts:22` を置き換える:

```ts
export type SpeciesId =
  | "ramuneFish"
  | "strawberryJelly"
  | "taiyaki"
  | "shoyuDai"
  | "sodaClownfish"
  | "colaClownfish"
  | "konpeitoStarfish"
  | "macaronPuffer";
```

- [ ] **Step 2: 型エラーの発生箇所を確認**

Run: `bunx tsc --noEmit`
Expected: FAIL。`SPECIES_NAMES` / `SPECIES_MOTION` / `SPECIES_SIZE` / `RESIDENT_SPRITES` の4箇所で「5種のプロパティが不足」エラー（網羅チェックが機能している証拠）

- [ ] **Step 3: species-names.ts に5種の表示名を追加**

`src/data/species-names.ts` の `SPECIES_NAMES` に追記する（既存3種の後）:

```ts
export const SPECIES_NAMES: Record<SpeciesId, string> = {
  ramuneFish: "ラムネ魚",
  strawberryJelly: "ストロベリークラゲ",
  taiyaki: "たい焼き",
  shoyuDai: "しょうゆだい",
  sodaClownfish: "ソーダクマノミ",
  colaClownfish: "コーラクマノミ",
  konpeitoStarfish: "こんぺいとうヒトデ",
  macaronPuffer: "マカロンフグ",
};
```

- [ ] **Step 4: species-motion.ts に5種の泳ぎパラメータを追加**

既存3種（ramuneFish=0.25 標準 / strawberryJelly=0.1 遅い大bob / taiyaki=0.18）を基準に相対決定した確定値。`SPECIES_MOTION` に追記する:

```ts
export const SPECIES_MOTION: Record<SpeciesId, Motion> = {
  ramuneFish: { speed: 0.25, bobAmplitude: 4, bobFrequency: 0.0015 },
  strawberryJelly: { speed: 0.1, bobAmplitude: 5, bobFrequency: 0.001 },
  taiyaki: { speed: 0.18, bobAmplitude: 3, bobFrequency: 0.0012 },
  // しょうゆだい: 標準（ラムネ魚相当）
  shoyuDai: { speed: 0.23, bobAmplitude: 4, bobFrequency: 0.0015 },
  // ソーダ/コーラクマノミ: やや速め・小刻み
  sodaClownfish: { speed: 0.3, bobAmplitude: 3, bobFrequency: 0.0018 },
  colaClownfish: { speed: 0.28, bobAmplitude: 3, bobFrequency: 0.0017 },
  // こんぺいとうヒトデ: 最遅・bob 大きめ
  konpeitoStarfish: { speed: 0.07, bobAmplitude: 6, bobFrequency: 0.0009 },
  // マカロンフグ: 中速
  macaronPuffer: { speed: 0.17, bobAmplitude: 4, bobFrequency: 0.0013 },
};
```

- [ ] **Step 5: species-size.ts に5種を追加し、ピンテストを更新**

(a) `src/data/species-size.ts` の `SPECIES_SIZE` に追記する（全種 "S"）:

```ts
export const SPECIES_SIZE: Record<SpeciesId, SizeClass> = {
  ramuneFish: "S",
  strawberryJelly: "S",
  taiyaki: "S",
  shoyuDai: "S",
  sodaClownfish: "S",
  colaClownfish: "S",
  konpeitoStarfish: "S",
  macaronPuffer: "S",
};
```

(b) `src/data/species-size.test.ts:9` のテスト名を更新する（本体ロジックは全 SPECIES_IDS ループなので不変。全種 "S" なので通る）:

```ts
test("全 8 種はすべて S（押し出しは同階級同士。階級を分けたらこのピンを更新する）", () => {
```

- [ ] **Step 6: スプライト5ファイルを作成（本番グリッド）**

各ファイルは `import type { Sprite } from "../../types";` を先頭に置き、`width: 16, height: 16` とする。実装者は下記の**パレット（確定 hex）**・**形状仕様**・**フレーム差分**に沿ってグリッド文字列を作成する。作成後、Step 8 のテストが全て通ること・selout 規律（孤立1pxドット禁止／模様は2px以上か縦横連続）を満たすこと。

**(a) `src/data/sprites/shoyu-dai.ts`**（弁当の魚型醤油容器。ラムネ魚シルエットを下敷きに）
- 形状: ラムネ魚 frame の魚型シルエットを流用し、ボディを半透明白ランプ（W/L/S/M/E）に、胴の下部内側に醤油色 `J` を数ドット（中身が見える）、口先に赤キャップ `C`（2×2 程度）、目 `O`。キャップ上に光沢 `H` を1ドット。
- フレーム差分: frame1 でキャップ光沢 `H` の位置を隣接ドットへ動かす（きらめき）。ボディは不変。**frame0 ≠ frame1**（光沢移動）。
- `frameIntervalMs: 450`
- palette:
```ts
palette: {
  W: "#F4F8FB", // 白ハイライト
  L: "#DDE7EE", // 半透明白ライト
  S: "#C4D0DA", // ボディ基調
  M: "#9BAAB6", // ボディ陰
  E: "#6E7B87", // selout 輪郭
  J: "#7A3E1C", // 醤油（中身）
  C: "#D6402F", // 赤キャップ
  H: "#F7A98C", // キャップ光沢（frame 間で動く）
  O: "#2A2119", // 目
},
```

**(b) `src/data/sprites/soda-clownfish.ts`**（クマノミ形状テンプレート。左向き原画）
- 形状: 楕円の魚体（幅 ~14）＋左端に二又の尾びれ。オレンジソーダ 5 ランプ（H/L/S/M/E）、白縞 `W` を胴に 2 本（縦 2px 幅以上・selout 規律遵守）、目 `O`。
- フレーム差分: frame1 で尾びれ（左端 2〜3 列）の開閉。**frame0 ≠ frame1**。
- 使用文字は `H L S M E W O` のみ（コーラが同一グリッドを流用するため文字集合を固定する）。
- `frameIntervalMs: 350`
- palette:
```ts
palette: {
  H: "#FFE0A8", // 泡ハイライト
  L: "#FFB25A", // オレンジソーダ ライト
  S: "#FB8324", // 基調オレンジ
  M: "#D65E12", // 陰
  E: "#9C3E0A", // selout
  W: "#FFF6E8", // 白縞
  O: "#241A12", // 目
},
```

**(c) `src/data/sprites/cola-clownfish.ts`**（量産式: soda の frames をそのまま流用）
- `frames` は `sodaClownfishSprite.frames` と**完全に同一の文字列**（ドット配置不変）にする。soda を import して `frames: sodaClownfishSprite.frames` を再利用してもよいが、既存 taiyaki 前例に倣い**同一文字列をコピー**してもよい（テストが deep-equal を担保）。`width/height/frameIntervalMs` も soda と同じ（`frameIntervalMs: 350`）。
- palette のみコーラ色へ差し替え（同じ文字 `H L S M E W O`・同一色相で全ランプを回す）:
```ts
palette: {
  H: "#8A5A3C", // コーラ泡ハイライト
  L: "#6B3A22", // コーラ ライト
  S: "#4A2415", // 基調コーラ色
  M: "#301509", // 陰
  E: "#1C0C05", // selout
  W: "#F3E4C4", // クリーム縞
  O: "#0E0603", // 目
},
```

**(d) `src/data/sprites/konpeito-starfish.ts`**（パステルピンク星形）
- 形状: 5 芒星のシルエット。各芒の先に konpeito の突起（2px 幅の膨らみ）。中央に目 `O` を小さく（左右対称 2 ドット可）。ピンク 5 ランプ H/L/S/M/E。
- フレーム差分: frame0/frame1 で芒先端の `H` きらめきドットをトグル（点滅）。**frame0 ≠ frame1**。
- `frameIntervalMs: 600`
- palette:
```ts
palette: {
  H: "#FFF0F5", // きらめき
  L: "#FFD6E6", // パステルピンク ライト
  S: "#FBB6D0", // 基調ピンク
  M: "#E888B0", // 陰
  E: "#C25E8A", // selout
  O: "#5A2E42", // 目
},
```

**(e) `src/data/sprites/macaron-puffer.ts`**（ピスタチオ色まんまるフグ）
- 形状: 円形のボディ＋小さな胸びれ・尾。ピスタチオ 5 ランプ H/L/S/M/E、目 `O`。
- フレーム差分: frame1 で外周を約 1px ぷくっと膨張（輪郭 `E` を 1 ドット外へ）。**frame0 ≠ frame1**。
- `frameIntervalMs: 500`
- palette:
```ts
palette: {
  H: "#EAF6D0", // ハイライト
  L: "#CDE8A6", // ライト
  S: "#A8D477", // 基調ピスタチオ
  M: "#7EAF4E", // 陰
  E: "#547E30", // selout
  O: "#2E3A1C", // 目
},
```

- [ ] **Step 7: resident-sprites.ts に5種を登録**

`src/data/resident-sprites.ts` を編集する。import を追加し `RESIDENT_SPRITES` に登録する:

```ts
import type { SpeciesId, Sprite } from "../types";
import { colaClownfishSprite } from "./sprites/cola-clownfish";
import { konpeitoStarfishSprite } from "./sprites/konpeito-starfish";
import { macaronPufferSprite } from "./sprites/macaron-puffer";
import { ramuneFishSprite } from "./sprites/ramune-fish";
import { shoyuDaiSprite } from "./sprites/shoyu-dai";
import { sodaClownfishSprite } from "./sprites/soda-clownfish";
import { strawberryJellySprite } from "./sprites/strawberry-jelly";
import { taiyakiSprite } from "./sprites/taiyaki";

/** 住民スプライトの種別対応表。draw-scene と draw-birth-fx で共用する */
export const RESIDENT_SPRITES: Record<SpeciesId, Sprite> = {
  ramuneFish: ramuneFishSprite,
  strawberryJelly: strawberryJellySprite,
  taiyaki: taiyakiSprite,
  shoyuDai: shoyuDaiSprite,
  sodaClownfish: sodaClownfishSprite,
  colaClownfish: colaClownfishSprite,
  konpeitoStarfish: konpeitoStarfishSprite,
  macaronPuffer: macaronPufferSprite,
};
```

（import 順序は biome が整列する。`bun run lint` で確認）

- [ ] **Step 8: sprites.test.ts に5種の受け入れ基準を追加**

`src/data/sprites/sprites.test.ts` を編集する。

(a) 5種を import し、整合性配列 `sprites`（9-15 行目）に追加する（既存の 16×16・パレット網羅テストが自動で 5 種をカバーする）:

```ts
import { colaClownfishSprite } from "./cola-clownfish";
import { konpeitoStarfishSprite } from "./konpeito-starfish";
import { macaronPufferSprite } from "./macaron-puffer";
import { shoyuDaiSprite } from "./shoyu-dai";
import { sodaClownfishSprite } from "./soda-clownfish";
```

```ts
const sprites: ReadonlyArray<[string, Sprite]> = [
  ["nessie", nessieSprite],
  ["shadowFish", shadowFishSprite],
  ["ramuneFish", ramuneFishSprite],
  ["strawberryJelly", strawberryJellySprite],
  ["taiyaki", taiyakiSprite],
  ["shoyuDai", shoyuDaiSprite],
  ["sodaClownfish", sodaClownfishSprite],
  ["colaClownfish", colaClownfishSprite],
  ["konpeitoStarfish", konpeitoStarfishSprite],
  ["macaronPuffer", macaronPufferSprite],
];
```

(b) ファイル末尾に新種の受け入れテストを追加する:

```ts
test("新種5種は全て 16×16・2 フレームアニメ", () => {
  const newcomers: ReadonlyArray<[string, Sprite]> = [
    ["shoyuDai", shoyuDaiSprite],
    ["sodaClownfish", sodaClownfishSprite],
    ["colaClownfish", colaClownfishSprite],
    ["konpeitoStarfish", konpeitoStarfishSprite],
    ["macaronPuffer", macaronPufferSprite],
  ];
  for (const [, sprite] of newcomers) {
    expect(sprite.width).toBe(16);
    expect(sprite.height).toBe(16);
    expect(sprite.frames.length).toBe(2);
  }
});

test("アニメする全スプライトはフレーム間に差分がある", () => {
  const animated: ReadonlyArray<Sprite> = [
    nessieSprite,
    ramuneFishSprite,
    strawberryJellySprite,
    shoyuDaiSprite,
    sodaClownfishSprite,
    colaClownfishSprite,
    konpeitoStarfishSprite,
    macaronPufferSprite,
  ];
  for (const sprite of animated) {
    expect(sprite.frames[0]).not.toEqual(sprite.frames[1]);
  }
});

test("コーラクマノミの形状はソーダクマノミの流用（量産式・ドット配置不変・パレットのみ差し替え）", () => {
  expect(colaClownfishSprite.frames).toEqual(sodaClownfishSprite.frames);
  expect(colaClownfishSprite.palette).not.toEqual(sodaClownfishSprite.palette);
});
```

- [ ] **Step 9: satiety-max.test.ts に高発見数の境界を追加**

種が 8 種揃ったので、7/8 発見の境界を追加できる。`src/systems/satiety-max.test.ts` の末尾に追記する:

```ts
test("発見 6 種で 8（floor(6/2)=3）", () => {
  expect(satietyMax(discoverFirst(6))).toBe(8);
});

test("発見 7 種でも 8（floor(7/2)=3）", () => {
  expect(satietyMax(discoverFirst(7))).toBe(8);
});

test("全種発見（8 種）で 9（floor(8/2)=4）※式が正。設計表の『8匹』は要オーナー確認", () => {
  expect(satietyMax(discoverFirst(8))).toBe(9);
});
```

- [ ] **Step 10: 全テストが通ることを確認**

Run: `bun test`
Expected: PASS（全スイート緑。sprites 整合性 + 新種テスト + satiety-max 高境界が増える）

- [ ] **Step 11: 型チェック**

Run: `bunx tsc --noEmit`
Expected: エラーなし（exit 0）。4 つの網羅 Record が全て埋まっている

- [ ] **Step 12: Lint**

Run: `bun run lint`
Expected: 成功出力（import 整列・未使用なし）

- [ ] **Step 13: コミット**

```bash
git add src/types.ts src/data/species-names.ts src/data/species-motion.ts src/data/species-size.ts src/data/species-size.test.ts src/data/resident-sprites.ts src/data/sprites/shoyu-dai.ts src/data/sprites/soda-clownfish.ts src/data/sprites/cola-clownfish.ts src/data/sprites/konpeito-starfish.ts src/data/sprites/macaron-puffer.ts src/data/sprites/sprites.test.ts src/systems/satiety-max.test.ts
git commit -m "$(cat <<'MSG'
feat: 新種5匹（しょうゆだい・クマノミ2種・こんぺいとうヒトデ・マカロンフグ）を追加

図鑑を3種→8種に拡張。SpeciesId 拡張で網羅 Record（names/motion/size/
sprites）を tsc が強制。クマノミはソーダ/コーラを量産式（形状共有・
パレット差し替え）で実装。satiety-max の高発見数境界テストも追加。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 3: 動作確認（自動 + Chrome 目視）

コミットは作らない（検証のみ）。異常があれば該当タスクへ戻る。

- [ ] **Step 1: 自動チェック一式を通す**

```bash
bun test
bunx tsc --noEmit
bun run lint
bun run build
```
Expected: 全て成功（build は `dist/` 生成まで到達）。

- [ ] **Step 2: 開発サーバーを起動**

ポート3000の重複プロセスを落としてから起動する:

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; true
bun run dev
```
Vite の表示 URL（通常 `http://localhost:5173`。3000 指定なら 3000）を控える。

- [ ] **Step 3: 図鑑をリセットして新種の誕生を確認する**

Chrome で開き、DevTools Console で localStorage をクリアしてリロードする（セーブキーは `src/save/save-storage-key.ts` を参照。全消しでよい）:

```js
localStorage.clear(); location.reload();
```
主人公で影の魚を食べ続け、誕生を複数回発生させる。確認観点:
- 必要餌数が発見数に応じて増える（序盤は 5 匹で誕生、種が増えると 6→7→8 匹に伸びる）。HUD の満腹ピップ個数が増えることで視認できる。
- しょうゆだい / ソーダクマノミ / コーラクマノミ / こんぺいとうヒトデ / マカロンフグ が未発見からランダムに誕生し、図鑑に載る。
- 各種の泳ぎ（クマノミはやや速く小刻み、ヒトデは最遅で大きく揺れ、フグは中速）とアニメ（キャップ光沢／尾びれ／きらめき／膨張）が意図どおり。

- [ ] **Step 4: スクリーンショットを取得（オーナー見た目確認用）**

海域を泳ぐ新種と図鑑パネルのスクリーンショットを撮り、オーナーへ提示する。気に入らない種があれば当該スプライトファイルのグリッド／パレットをリテイクする（Task 2 Step 6 の仕様範囲で調整）。

---

## 完了条件

- [ ] `bun test` 全緑
- [ ] `bunx tsc --noEmit` エラーなし
- [ ] `bun run lint` 成功
- [ ] `bun run build` 成功
- [ ] `SATIETY_MAX` 定数が `world-constants.ts` から消え、直接参照が残っていない（`grep -rn "SATIETY_MAX" src/` が一致なし）
- [ ] `satietyMax(zukan)` が step-world 誕生判定・繰り越し / HUD ゲージ / parse-save 上限で使われている
- [ ] 図鑑が 8 種（`SpeciesId` union・4 網羅 Record・5 スプライト・RESIDENT_SPRITES）
- [ ] Chrome で新種5匹の誕生・泳ぎ・アニメをオーナーが目視確認済み
