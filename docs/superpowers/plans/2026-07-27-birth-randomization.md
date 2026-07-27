# 誕生のランダム化（固定テーブル廃止）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 誕生する種を固定テーブルのループから「図鑑の未発見種からの一様ランダム抽選（未発見が空なら全種から）」へ変更する。

**Architecture:** 状態レス方式（設計書 案A）。誕生の瞬間に `zukan` から未発見種を導出して抽選するため、セーブスキーマは version 1 のまま変更しない。乱数は既存慣習どおり引数注入。全種リストは既存の `SPECIES_IDS`（`SPECIES_NAMES` のキーから導出）を再利用し、新規定数ファイルは作らない（DRY）。

**Tech Stack:** TypeScript / Bun test（`bun test`）/ Biome（`bun run lint`）/ tsc（`bunx tsc --noEmit`）/ Vite。

---

## 設計書との差分（実装前に必読）

1. **全種リスト定数の新規作成は不要**。設計書は「小さな定数ファイルを1つ追加する」を選択肢に挙げるが、既に `src/data/species-ids.ts` の `SPECIES_IDS`（`Object.keys(SPECIES_NAMES)` から導出、テスト `species-ids.test.ts` 済み）が同一の役割を果たす。これを再利用する。新規 `all-species-ids.ts` は作らない。
2. **`stepWorld` は `discovered` 引数を廃止し `zukan` を受け取る**。現状 `stepWorld(state, random, discovered)` は境界層（main.ts）が `discoveredSpecies(zukan)` を導出して渡していた。設計で `nextBirthSpecies(zukan, random)` となり `stepWorld` が `zukan` を持つ以上、来訪抽選用の `discovered` も `stepWorld` 内部で `discoveredSpecies(zukan)` から導出するのが単一情報源で最もクリーン。`zukan` と `discovered` を二重に渡す冗長を避ける。
3. **乱数消費順が1つ増える**。旧 `nextBirthSpecies(residents.length)` は乱数を消費しなかったが、新 `nextBirthSpecies(zukan, random)` は `random()` を1回消費する（餌リスポーン baseY の後・押し出し選定の前）。既存 step-world テストは全て定数乱数（`() => 0.5` 等）なので消費順シフトは値に影響しないが、抽選される種は変わるため誕生系テストの期待値を作り直す。
4. **`birth-table.test.ts` の網羅保証は `species-ids.test.ts` へ引き継ぎ済み**。「全種が誕生テーブルに含まれる」保証は、`SPECIES_IDS` が `SPECIES_NAMES` から導出され `nextBirthSpecies` がそれを使うことで構造的に担保される。削除で失われるカバレッジはない。

## ファイル構成

| ファイル | 操作 | 責務 |
|---|---|---|
| `src/systems/next-birth-species.ts` | 変更 | `nextBirthSpecies(zukan, random)`: 未発見種から一様抽選（空なら全種） |
| `src/systems/next-birth-species.test.ts` | 変更 | 上記のランダム化仕様のテスト（4観点） |
| `src/systems/step-world.ts` | 変更 | 引数を `(state, random, zukan)` に変更。`discovered` を内部導出し `nextBirthSpecies(zukan, random)` を呼ぶ |
| `src/systems/step-world.test.ts` | 変更 | 呼び出し3引数目を `Zukan` に。誕生系テストの期待値作り直し・固定テーブルテスト削除 |
| `src/main.ts` | 変更 | `stepWorld(state, Math.random, zukan)`。未使用 `discoveredSpecies` import 削除 |
| `src/data/birth-table.ts` | 削除 | 固定テーブル廃止 |
| `src/data/birth-table.test.ts` | 削除 | 同上のテスト |

## 前提コンテキスト（実装者向け）

- `SPECIES_IDS`（`src/data/species-ids.ts`）は `readonly SpeciesId[]`。順序は `SPECIES_NAMES` の定義順 = `["ramuneFish", "strawberryJelly", "taiyaki"]`。
- `Zukan`（`src/types.ts`）は `Partial<Record<SpeciesId, ZukanEntry>>`。未発見の種はキーごと存在しない（`zukan[id] === undefined`）。
- `ZukanEntry` = `{ firstDiscoveredAt: string; birthCount: number }`。
- 既存 `create-visitor.ts` の抽選パターン `pool[Math.floor(random() * pool.length)]` を踏襲する。
- 全ての pure 関数テストは `bun:test` の `import { expect, test } from "bun:test";`。
- 一関数一ファイル厳守。`nextBirthSpecies` は自ファイルに1関数のみ。

---

## Task 1: nextBirthSpecies をランダム抽選へ書き換え、zukan を stepWorld/main へ通す（アトミックなシグネチャ変更）

このタスクはシグネチャ変更が複数ファイルにまたがるため、全ファイルを緑にしてから1コミットする。

**Files:**
- Modify: `src/systems/next-birth-species.test.ts`
- Modify: `src/systems/next-birth-species.ts`
- Modify: `src/systems/step-world.ts:12,20,32-38,72-96,98-114`
- Modify: `src/systems/step-world.test.ts`
- Modify: `src/main.ts:12,43`

- [ ] **Step 1: next-birth-species.test.ts を新仕様のテストに置き換える**

`src/systems/next-birth-species.test.ts` の全内容を以下で置き換える:

```ts
import { expect, test } from "bun:test";
import type { Zukan, ZukanEntry } from "../types";
import { nextBirthSpecies } from "./next-birth-species";

const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-27T00:00:00.000Z",
  birthCount: 1,
};

test("未発見が残っているとき、選ばれるのは必ず未発見の種", () => {
  // ramuneFish のみ発見済み → 未発見は strawberryJelly, taiyaki
  const zukan: Zukan = { ramuneFish: entry };
  for (const r of [0, 0.4, 0.6, 0.99]) {
    const picked = nextBirthSpecies(zukan, () => r);
    expect(picked).not.toBe("ramuneFish");
    expect(["strawberryJelly", "taiyaki"]).toContain(picked);
  }
});

test("全種発見済みのときは全種のいずれかが選ばれる", () => {
  const zukan: Zukan = {
    ramuneFish: entry,
    strawberryJelly: entry,
    taiyaki: entry,
  };
  expect(nextBirthSpecies(zukan, () => 0)).toBe("ramuneFish");
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe("taiyaki");
});

test("同じ乱数値なら同じ種（決定性）", () => {
  const zukan: Zukan = {}; // 全種未発見 → プールは [ramuneFish, strawberryJelly, taiyaki]
  expect(nextBirthSpecies(zukan, () => 0)).toBe("ramuneFish");
  expect(nextBirthSpecies(zukan, () => 0.5)).toBe("strawberryJelly");
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe("taiyaki");
});

test("未発見が1種だけならどんな乱数でもその種が確実に選ばれる", () => {
  // ramuneFish と taiyaki が発見済み → 未発見は strawberryJelly のみ
  const zukan: Zukan = { ramuneFish: entry, taiyaki: entry };
  expect(nextBirthSpecies(zukan, () => 0)).toBe("strawberryJelly");
  expect(nextBirthSpecies(zukan, () => 0.99)).toBe("strawberryJelly");
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test src/systems/next-birth-species.test.ts`
Expected: FAIL（旧 `nextBirthSpecies(residentCount: number)` の型不一致、または実行時の誤った戻り値）

- [ ] **Step 3: next-birth-species.ts を実装**

`src/systems/next-birth-species.ts` の全内容を以下で置き換える:

```ts
import { SPECIES_IDS } from "../data/species-ids";
import type { SpeciesId, Zukan } from "../types";

/**
 * 次に生まれる種を引く。図鑑の未発見種から一様抽選する（重複なし体験を構造的に担保）。
 * 未発見が空（全種発見済み）なら全種から抽選する。状態を持たない純粋関数。
 * @param zukan - 図鑑。未発見の種はキーごと存在しない
 * @param random - [0, 1) を返す乱数（Math.random 互換）
 */
export function nextBirthSpecies(
  zukan: Zukan,
  random: () => number,
): SpeciesId {
  const undiscovered = SPECIES_IDS.filter((id) => zukan[id] === undefined);
  const pool = undiscovered.length > 0 ? undiscovered : SPECIES_IDS;
  return pool[Math.floor(random() * pool.length)];
}
```

- [ ] **Step 4: next-birth-species のテストが通ることを確認**

Run: `bun test src/systems/next-birth-species.test.ts`
Expected: PASS（4 tests）

- [ ] **Step 5: step-world.ts のシグネチャと誕生処理を変更**

`src/systems/step-world.ts` を次のとおり編集する。

(a) import を修正（`discoveredSpecies` を追加、`Zukan` を型に追加）。12行目 `import type { Flash, GameState, SpeciesId } from "../types";` を:

```ts
import type { Flash, GameState, Zukan } from "../types";
```

に変更し（`SpeciesId` はシグネチャから消えるため不要になる。他で未使用なら削除）、13行目付近の systems import 群に次を追加:

```ts
import { discoveredSpecies } from "./discovered-species";
```

(b) JSDoc（32行目の `@param discovered ...`）と関数シグネチャ（34-38行目）を置き換える:

```ts
/**
 * 1 tick の全状態更新。主人公 → 餌移動 → 捕食 → 住民移動 → 退場消滅 →
 * 満腹/誕生（押し出し） → 来訪抽選 → フラッシュ寿命。
 * 誕生セレモニー中は主人公を完全静止させ（path は消費せず保持）、捕食判定もスキップする。
 * カメラは主人公追従なので、これで誕生地点が画面内に留まる
 * @param zukan - 図鑑。誕生の未発見抽選と来訪の発見済み候補の両方をここから導出する
 */
export function stepWorld(
  state: GameState,
  random: () => number,
  zukan: Zukan,
): GameState {
```

(c) 誕生処理（78行目）の固定テーブル呼び出しを置き換える。旧:

```ts
    const species = nextBirthSpecies(residents.length);
```

新:

```ts
    const species = nextBirthSpecies(zukan, random);
```

(d) 来訪ブロックの直前（101行目 `let nextVisitCheckMs = ...` の直前）に `discovered` の内部導出を追加する:

```ts
  // 来訪抽選の候補は発見済みの種。境界層ではなくここで図鑑から導出する
  const discovered = discoveredSpecies(zukan);
```

来訪ブロック内の `discovered.length > 0`・`createVisitor(discovered, ...)` はそのまま（ローカル変数 `discovered` を参照する）。

- [ ] **Step 6: main.ts の呼び出しを修正**

`src/main.ts` を編集する。12行目の import を削除:

```ts
import { discoveredSpecies } from "./systems/discovered-species";
```

（この import は他で使っていないため行ごと削除する）

43行目を置き換える。旧:

```ts
  state = stepWorld(state, Math.random, discoveredSpecies(zukan));
```

新:

```ts
  state = stepWorld(state, Math.random, zukan);
```

- [ ] **Step 7: step-world.test.ts の呼び出し引数と誕生系テストを作り直す**

`src/systems/step-world.test.ts` を次のとおり編集する。

(a) 先頭の import に図鑑エントリ用の型を追加する。6行目付近 `import type { Bait, GameState, Resident } from "../types";` を:

```ts
import type { Bait, GameState, Resident, Zukan, ZukanEntry } from "../types";
```

に変更し、`fixedRandom` 定義（12行目）の直後にフィクスチャを追加:

```ts
const zukanEntry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-27T00:00:00.000Z",
  birthCount: 1,
};
```

(b) 誕生を伴わない全ての `stepWorld(...)` 呼び出しの第3引数を `[]` から `{}` に変える（型が `Zukan` になるため）。対象テスト（誕生しないもの）:
- 「経過時間が TICK_MS だけ進む」→ `stepWorld(createInitialState(fixedRandom), fixedRandom, {})`
- 「頭の近くの餌を食べると満腹 +1 …」→ 第3引数 `{}`
- 「退場予定の住民は視界外に…」→ 第3引数 `{}`
- 「誕生した tick で主人公の速度が 0 になる」→ 下記 (c) 参照（誕生する）
- 「セレモニー中は主人公が完全静止…」/「セレモニー中は餌に頭が触れても…」/「セレモニー中も世界は生きている」/「演出明けの tick で…」→ 各 `{}`
- 「古いフラッシュは 600ms で消える」→ `{}`

来訪系テスト（第3引数に発見済み配列を渡していたもの）は `Zukan` へ置き換える:
- 「来訪チェック時刻を過ぎると抽選し…」: `stepWorld(state, () => 0.4, ["ramuneFish"])` → `stepWorld(state, () => 0.4, { ramuneFish: zukanEntry })`
- 「抽選に外れたら来訪せず…」: 第3引数 `{ ramuneFish: zukanEntry }`
- 「チェック時刻に達していなければ抽選しない」: 第3引数 `{ ramuneFish: zukanEntry }`
- 「定員（退場予定を除く 8 体）のときは来訪しない」: 第3引数 `{ ramuneFish: zukanEntry }`
- 「未発見（discovered が空）なら当たっても来訪しない」: 第3引数 `{}`

(c) 誕生する種を検証するテストは、未発見を1種に絞って決定化する。

「満腹 5 で誕生し、1 体目はラムネ魚」（49-57行目）を次に置き換える:

```ts
test("満腹 5 で誕生する（未発見1種ならその種）", () => {
  // strawberryJelly と taiyaki を発見済みにし、未発見を ramuneFish のみに絞る
  const zukan: Zukan = { strawberryJelly: zukanEntry, taiyaki: zukanEntry };
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom, zukan);
  expect(next.satiety).toBe(0);
  expect(next.residents.length).toBe(1);
  expect(next.residents[0].species).toBe("ramuneFish");
  expect(next.residents[0].baseY).toBe(60); // clamp(hero.y, 24, 118)
  // 大フラッシュは廃止。捕食リング 1 個だけが残る
  expect(next.flashes.length).toBe(1);
});
```

「誕生した住民は bornAtMs を持ち…」（59-70行目）の `stepWorld(...)` 呼び出しの第3引数を `{}` にする（種は問わないので全種未発見でよい。`fixedRandom` で決定的に1種選ばれる）:

```ts
  const next = stepWorld(stateWithBaitAtHead({ satiety: 4 }), fixedRandom, {});
```

「誕生順は固定テーブルをループする（2 体目はストロベリークラゲ）」（72-91行目）は固定テーブル廃止により**テストごと削除**する（ランダム抽選ロジックは next-birth-species.test.ts が担保）。

「満腹 4 で同 tick に 2 匹捕食すると…」（93-110行目）の `stepWorld(...)` 第3引数を `{}` にする（誕生数と繰り越しのみ検証、種は不問）。

「満員で満腹 4 + 同 tick 2 匹捕食でも誕生し…」（112-139行目）の `stepWorld(...)` 第3引数を `{}` にする（誕生体数と繰り越しのみ検証）。

「満員でも誕生し、同サイズ階級からランダムに 1 体が退場予定になる（押し出し）」（141-171行目）を次に置き換える（種を taiyaki に固定するため未発見を taiyaki のみに絞る。全種同サイズ "S" なので押し出し挙動は不変）:

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
  // 未発見を taiyaki のみに絞り、新生児種を決定化する
  const zukan: Zukan = { ramuneFish: zukanEntry, strawberryJelly: zukanEntry };
  const next = stepWorld(
    stateWithBaitAtHead({ satiety: 4, residents: full }),
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
  // 押し出し: 全員 "S" = 新生児と同階級。乱数は全て 0.5 の定数なので消費順が
  // 1つ増えても値は不変 → floor(0.5 * 8) = 4 が退場予定になる
  expect(next.residents.filter((r) => r.departing).length).toBe(1);
  expect(next.residents[4].departing).toBe(true);
  // 押し出された住民は消えず泳ぎ続ける（消滅判定は押し出しより前段）
  expect(next.residents[4].x).toBeCloseTo(280.25, 5); // 200 + 4*20 + speed 0.25
});
```

「退場予定は定員に数えない（8 体中 1 体退場予定なら押し出しなしで誕生する）」（173-195行目）の `stepWorld(...)` 第3引数を `{}` にする（誕生体数のみ検証、種は不問）。

「誕生した tick で主人公の速度が 0 になる」（277-282行目）の `stepWorld(...)` 第3引数を `{}` にする。

- [ ] **Step 8: 全テストが通ることを確認**

Run: `bun test`
Expected: PASS（全スイート緑。削除した固定テーブルループのテストが1件減る）

- [ ] **Step 9: 型チェック**

Run: `bunx tsc --noEmit`
Expected: エラーなし（exit 0）

- [ ] **Step 10: Lint**

Run: `bun run lint`
Expected: `Checked N files ... No fixes needed.` のような成功出力（import 未整列などの指摘がないこと）

- [ ] **Step 11: コミット**

```bash
git add src/systems/next-birth-species.ts src/systems/next-birth-species.test.ts src/systems/step-world.ts src/systems/step-world.test.ts src/main.ts
git commit -m "$(cat <<'MSG'
feat: 誕生種を未発見からのランダム抽選に変更

固定テーブルを廃止し、nextBirthSpecies(zukan, random) で未発見種から
一様抽選する（未発見が空なら全種）。stepWorld は zukan を受け取り、
来訪候補の discovered も内部導出する。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 2: 固定テーブル birth-table を削除する

**Files:**
- Delete: `src/data/birth-table.ts`
- Delete: `src/data/birth-table.test.ts`

- [ ] **Step 1: 残存参照がないことを確認**

Run: `grep -rn "birth-table\|BIRTH_TABLE" src/`
Expected: 一致なし（Task 1 で `next-birth-species.ts` と `step-world.test.ts` の参照は除去済み）

- [ ] **Step 2: ファイルを削除**

```bash
git rm src/data/birth-table.ts src/data/birth-table.test.ts
```

- [ ] **Step 3: 全テストが通ることを確認**

Run: `bun test`
Expected: PASS（birth-table.test.ts の2件が減る。全種網羅の保証は species-ids.test.ts が担保）

- [ ] **Step 4: 型チェックと Lint**

Run: `bunx tsc --noEmit`
Expected: エラーなし（exit 0）

Run: `bun run lint`
Expected: 成功出力（未解決 import 等なし）

- [ ] **Step 5: コミット**

```bash
git commit -m "$(cat <<'MSG'
refactor: 固定誕生テーブル birth-table を削除

誕生のランダム化により不要になった。全種網羅の保証は
SPECIES_IDS（species-ids.test.ts）へ引き継ぎ済み。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
MSG
)"
```

---

## 完了条件

- [ ] `bun test` 全緑
- [ ] `bunx tsc --noEmit` エラーなし
- [ ] `bun run lint` 成功
- [ ] `src/data/birth-table.ts` / `.test.ts` が存在しない
- [ ] `nextBirthSpecies` が `(zukan, random)` シグネチャで未発見抽選する
- [ ] `stepWorld` が `(state, random, zukan)` シグネチャ、main.ts が `zukan` を渡す
