# 図鑑＋セーブ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 発見した住民の記録（図鑑）と進捗の永続化（localStorage セーブ）を追加し、リロード後も発見済みの種が泳ぐ海で再開できるようにする。

**Architecture:** 図鑑（zukan）は `GameState` に入れず main.ts（境界層）で別管理し、`stepWorld` の純粋性を保つ。誕生検知は tick ごとの `residents.length` 増加で行い、純粋関数 `updateZukan` → `storeSave` で自動保存する。シリアライズ／検証／抽選／図鑑更新はすべて乱数・時刻注入の純粋関数として TDD し、localStorage・DOM は薄い境界層に隔離する（テストなし・実機確認）。

**Tech Stack:** TypeScript + Vite + bun test + Biome。UI は index.html への DOM オーバーレイ（フレームワークなし）。スプライトは既存グリッドデータを小 canvas に `drawGrid` で描画（`image-rendering: pixelated`）。

**設計ドキュメント:** `docs/design/2026-07-06-zukan-save.md`（オーナー承認済み）

**既存テストへの影響:** なし。既存 152 テストはすべてそのまま green を維持する（`stepWorld`・`createInitialState` の挙動は変更せず、`src/types.ts` は型の追加のみ、`src/data/world-constants.ts` は定数の追加のみ）。本計画完了時の想定は **180 pass / 0 fail**（新規 28 テスト追加）。

**設計からの実装判断（設計が選択肢として残していた点の確定）:**
- zukan は `GameState` に含めず main.ts で別管理する（設計の「別管理」案を採用）
- 起動復元は `createInitialState` を変更せず、新関数 `restoreStateFromSave` で合成する（設計の「新関数」案を採用）
- セーブ検証は「一部でも不正なら全体を初期セーブへフォールバック」とする（部分修復はしない。シンプルさ優先）
- 未発見シルエットの影色は誕生演出の既存定数 `BIRTH_FX_SILHOUETTE_COLOR`（`#0F1E27`）を再利用する

---

## File Structure

**Create:**

| ファイル | 責務 |
|---|---|
| `src/data/species-ids.ts` | 全種 ID のランタイム定数（図鑑の表示順・セーブ検証用） |
| `src/data/species-names.ts` | 図鑑に表示する種名（暫定名） |
| `src/save/create-initial-save.ts` | 初期セーブデータ生成 |
| `src/save/serialize-save.ts` | セーブ → JSON 文字列 |
| `src/save/parse-save.ts` | JSON 文字列 → 検証済みセーブ（不正時フォールバック） |
| `src/save/update-zukan.ts` | 誕生 1 回ぶんの図鑑更新（純粋・非破壊） |
| `src/save/save-storage-key.ts` | localStorage キー定数 |
| `src/save/load-save.ts` | localStorage 読み込み境界層（テストなし） |
| `src/save/store-save.ts` | localStorage 書き込み境界層（テストなし） |
| `src/systems/pick-starting-residents.ts` | 起動時の海の抽選（乱数注入） |
| `src/systems/restore-state-from-save.ts` | セーブ → 起動時 GameState |
| `src/render/shadow-palette.ts` | パレット全色を影色に変換（未発見表示用） |
| `src/ui/render-zukan-panel.ts` | 図鑑カード一覧の DOM 描画（テストなし） |
| `src/ui/attach-zukan-ui.ts` | 図鑑ボタン・パネル開閉の配線（テストなし） |

**Modify:**

| ファイル | 変更内容 |
|---|---|
| `src/types.ts` | `ZukanEntry` / `Zukan` / `SaveData` 型を追加（末尾追記のみ） |
| `src/data/world-constants.ts` | `STARTING_RESIDENT_MAX` を追加（末尾追記のみ） |
| `index.html` | 「ずかん」ボタンとパネルの DOM・CSS を追加 |
| `src/main.ts` | 起動時復元・誕生検知・自動保存・図鑑 UI 接続 |

---

### Task 1: 型定義と種データ（SPECIES_IDS / SPECIES_NAMES）

**Files:**
- Modify: `src/types.ts`（末尾に追記）
- Create: `src/data/species-ids.ts`
- Create: `src/data/species-names.ts`
- Test: `src/data/species-ids.test.ts`
- Test: `src/data/species-names.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/data/species-ids.test.ts`:

```typescript
import { expect, test } from "bun:test";
import { SPECIES_IDS } from "./species-ids";

test("SPECIES_IDS は全 3 種を誕生テーブルと同じ順で重複なく含む", () => {
  expect(SPECIES_IDS).toEqual(["ramuneFish", "strawberryJelly", "taiyaki"]);
  expect(new Set(SPECIES_IDS).size).toBe(SPECIES_IDS.length);
});
```

`src/data/species-names.test.ts`:

```typescript
import { expect, test } from "bun:test";
import { SPECIES_IDS } from "./species-ids";
import { SPECIES_NAMES } from "./species-names";

test("全種に空でない表示名がある", () => {
  for (const id of SPECIES_IDS) {
    expect(SPECIES_NAMES[id].length).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/data/species-ids.test.ts src/data/species-names.test.ts`
Expected: FAIL（`Cannot find module "./species-ids"` 等の解決エラー）

- [ ] **Step 3: 型とデータを実装する**

`src/types.ts` の末尾（`Sprite` 型の後）に追記:

```typescript
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
```

`src/data/species-ids.ts` を新規作成:

```typescript
import type { SpeciesId } from "../types";

/**
 * 全種 ID の一覧（ランタイム定数）。図鑑の表示順・セーブ検証に使う。
 * SpeciesId に種を追加したら必ずここにも足す（順序は BIRTH_TABLE と揃える）
 */
export const SPECIES_IDS: readonly SpeciesId[] = [
  "ramuneFish",
  "strawberryJelly",
  "taiyaki",
];
```

`src/data/species-names.ts` を新規作成:

```typescript
import type { SpeciesId } from "../types";

/** 図鑑に表示する種名（暫定。命名規則の本格検討は未決事項のまま） */
export const SPECIES_NAMES: Record<SpeciesId, string> = {
  ramuneFish: "ラムネ魚",
  strawberryJelly: "ストロベリークラゲ",
  taiyaki: "たい焼き",
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/data/species-ids.test.ts src/data/species-names.test.ts`
Expected: 2 pass / 0 fail

- [ ] **Step 5: 全テスト・lint・型チェックを確認してコミット**

Run: `bun test && bun run lint && bunx tsc --noEmit`
Expected: 154 pass / 0 fail、lint・tsc エラーなし

```bash
git add src/types.ts src/data/species-ids.ts src/data/species-ids.test.ts src/data/species-names.ts src/data/species-names.test.ts
git commit -m "feat: 図鑑・セーブの型定義と種データ（SPECIES_IDS / SPECIES_NAMES）を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: createInitialSave（初期セーブ）

**Files:**
- Create: `src/save/create-initial-save.ts`
- Test: `src/save/create-initial-save.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/save/create-initial-save.test.ts`:

```typescript
import { expect, test } from "bun:test";
import { createInitialSave } from "./create-initial-save";

test("version 1・図鑑空・満腹 0 を返す", () => {
  expect(createInitialSave()).toEqual({ version: 1, zukan: {}, satiety: 0 });
});

test("呼ぶたびに独立したオブジェクトを返す（共有ミュータブル状態を作らない）", () => {
  const a = createInitialSave();
  const b = createInitialSave();
  expect(a).not.toBe(b);
  expect(a.zukan).not.toBe(b.zukan);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/save/create-initial-save.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/save/create-initial-save.ts` を新規作成:

```typescript
import type { SaveData } from "../types";

/** 初期セーブ（未発見・満腹 0）。セーブがない／壊れているときの出発点 */
export function createInitialSave(): SaveData {
  return { version: 1, zukan: {}, satiety: 0 };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/save/create-initial-save.test.ts`
Expected: 2 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/save/create-initial-save.ts src/save/create-initial-save.test.ts
git commit -m "feat: 初期セーブデータ生成 createInitialSave を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: serializeSave（シリアライズ）

**Files:**
- Create: `src/save/serialize-save.ts`
- Test: `src/save/serialize-save.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/save/serialize-save.test.ts`:

```typescript
import { expect, test } from "bun:test";
import type { SaveData } from "../types";
import { serializeSave } from "./serialize-save";

test("JSON.parse で元のデータに戻る文字列を返す", () => {
  const save: SaveData = {
    version: 1,
    zukan: {
      ramuneFish: {
        firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
        birthCount: 3,
      },
    },
    satiety: 2,
  };
  expect(JSON.parse(serializeSave(save))).toEqual(save);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/save/serialize-save.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/save/serialize-save.ts` を新規作成:

```typescript
import type { SaveData } from "../types";

/** セーブデータを localStorage 保存用の JSON 文字列にする */
export function serializeSave(save: SaveData): string {
  return JSON.stringify(save);
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/save/serialize-save.test.ts`
Expected: 1 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/save/serialize-save.ts src/save/serialize-save.test.ts
git commit -m "feat: セーブのシリアライズ serializeSave を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: parseSave（検証つきデシリアライズ）

**Files:**
- Create: `src/save/parse-save.ts`
- Test: `src/save/parse-save.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/save/parse-save.test.ts`:

```typescript
import { expect, test } from "bun:test";
import type { SaveData } from "../types";
import { createInitialSave } from "./create-initial-save";
import { parseSave } from "./parse-save";
import { serializeSave } from "./serialize-save";

const validSave: SaveData = {
  version: 1,
  zukan: {
    ramuneFish: {
      firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
      birthCount: 3,
    },
    taiyaki: {
      firstDiscoveredAt: "2026-07-06T11:30:00.000Z",
      birthCount: 1,
    },
  },
  satiety: 2,
};

test("シリアライズ⇔デシリアライズの往復で元に戻る", () => {
  expect(parseSave(serializeSave(validSave))).toEqual(validSave);
});

test("null（セーブなし）は初期セーブになる", () => {
  expect(parseSave(null)).toEqual(createInitialSave());
});

test("壊れた JSON は初期セーブになる", () => {
  expect(parseSave("{oops")).toEqual(createInitialSave());
});

test("オブジェクトでない JSON（配列・数値）は初期セーブになる", () => {
  expect(parseSave("[]")).toEqual(createInitialSave());
  expect(parseSave("42")).toEqual(createInitialSave());
});

test("version が 1 でなければ初期セーブになる", () => {
  expect(parseSave(JSON.stringify({ ...validSave, version: 2 }))).toEqual(
    createInitialSave(),
  );
});

test("version 欠損は初期セーブになる", () => {
  expect(parseSave(JSON.stringify({ zukan: {}, satiety: 0 }))).toEqual(
    createInitialSave(),
  );
});

test("satiety が不正（範囲外・非整数・型違い）なら初期セーブになる", () => {
  // SATIETY_MAX(5) 以上は不正（stepWorld は誕生時に必ず減算するため保存値は 0〜4）
  expect(parseSave(JSON.stringify({ ...validSave, satiety: 5 }))).toEqual(
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

test("zukan 欠損・未知の種キー・不正エントリは初期セーブになる", () => {
  expect(parseSave(JSON.stringify({ version: 1, satiety: 0 }))).toEqual(
    createInitialSave(),
  );
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: {
          unknownFish: { firstDiscoveredAt: "2026-07-06", birthCount: 1 },
        },
      }),
    ),
  ).toEqual(createInitialSave());
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: { ramuneFish: { birthCount: 1 } },
      }),
    ),
  ).toEqual(createInitialSave());
  // 図鑑に載っている＝1 回以上生まれているので birthCount 0 は不正
  expect(
    parseSave(
      JSON.stringify({
        version: 1,
        satiety: 0,
        zukan: {
          ramuneFish: {
            firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
            birthCount: 0,
          },
        },
      }),
    ),
  ).toEqual(createInitialSave());
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/save/parse-save.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/save/parse-save.ts` を新規作成:

```typescript
import { SPECIES_IDS } from "../data/species-ids";
import { SATIETY_MAX } from "../data/world-constants";
import type { SaveData, SpeciesId, Zukan } from "../types";
import { createInitialSave } from "./create-initial-save";

/**
 * セーブ文字列を検証つきで読み取る。壊れた JSON・欠損フィールド・不正値は
 * すべて初期セーブへフォールバックする（クラッシュさせない・部分修復はしない）
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

  const satiety = record.satiety;
  if (
    typeof satiety !== "number" ||
    !Number.isInteger(satiety) ||
    satiety < 0 ||
    satiety >= SATIETY_MAX
  ) {
    return createInitialSave();
  }

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
    if (typeof value !== "object" || value === null) {
      return createInitialSave();
    }
    const entry = value as Record<string, unknown>;
    if (typeof entry.firstDiscoveredAt !== "string") {
      return createInitialSave();
    }
    if (
      typeof entry.birthCount !== "number" ||
      !Number.isInteger(entry.birthCount) ||
      entry.birthCount < 1
    ) {
      return createInitialSave();
    }
    zukan[key as SpeciesId] = {
      firstDiscoveredAt: entry.firstDiscoveredAt,
      birthCount: entry.birthCount,
    };
  }
  return { version: 1, zukan, satiety };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/save/parse-save.test.ts`
Expected: 8 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/save/parse-save.ts src/save/parse-save.test.ts
git commit -m "feat: 検証つきデシリアライズ parseSave を追加（不正セーブは初期状態へフォールバック）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: updateZukan（図鑑更新）

**Files:**
- Create: `src/save/update-zukan.ts`
- Test: `src/save/update-zukan.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/save/update-zukan.test.ts`:

```typescript
import { expect, test } from "bun:test";
import type { Zukan } from "../types";
import { updateZukan } from "./update-zukan";

test("初発見の種は発見日時つきで誕生数 1 で登録される", () => {
  const next = updateZukan({}, "ramuneFish", "2026-07-06T10:00:00.000Z");
  expect(next).toEqual({
    ramuneFish: {
      firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
      birthCount: 1,
    },
  });
});

test("発見済みの種は誕生数だけ +1 され、初発見日時は変わらない", () => {
  const zukan: Zukan = {
    ramuneFish: {
      firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
      birthCount: 2,
    },
  };
  const next = updateZukan(zukan, "ramuneFish", "2026-07-07T09:00:00.000Z");
  expect(next.ramuneFish).toEqual({
    firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
    birthCount: 3,
  });
});

test("元の図鑑オブジェクトは破壊しない", () => {
  const zukan: Zukan = {
    ramuneFish: {
      firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
      birthCount: 1,
    },
  };
  updateZukan(zukan, "ramuneFish", "2026-07-07T09:00:00.000Z");
  expect(zukan.ramuneFish?.birthCount).toBe(1);
});

test("他の種の記録は保持される", () => {
  const zukan: Zukan = {
    taiyaki: {
      firstDiscoveredAt: "2026-07-05T08:00:00.000Z",
      birthCount: 4,
    },
  };
  const next = updateZukan(zukan, "strawberryJelly", "2026-07-06T10:00:00.000Z");
  expect(next.taiyaki).toEqual({
    firstDiscoveredAt: "2026-07-05T08:00:00.000Z",
    birthCount: 4,
  });
  expect(next.strawberryJelly?.birthCount).toBe(1);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/save/update-zukan.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/save/update-zukan.ts` を新規作成:

```typescript
import type { SpeciesId, Zukan } from "../types";

/**
 * 誕生 1 回ぶんを図鑑に反映する（純粋・非破壊）。
 * 初発見なら発見日時つきで登録、発見済みなら誕生数だけ +1 する。
 * discoveredAtIso は境界層（main.ts）が new Date().toISOString() で渡す
 */
export function updateZukan(
  zukan: Zukan,
  species: SpeciesId,
  discoveredAtIso: string,
): Zukan {
  const existing = zukan[species];
  if (existing) {
    return {
      ...zukan,
      [species]: { ...existing, birthCount: existing.birthCount + 1 },
    };
  }
  return {
    ...zukan,
    [species]: { firstDiscoveredAt: discoveredAtIso, birthCount: 1 },
  };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/save/update-zukan.test.ts`
Expected: 4 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/save/update-zukan.ts src/save/update-zukan.test.ts
git commit -m "feat: 図鑑更新 updateZukan を追加（初発見の記録と誕生数の加算）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: pickStartingResidents（起動時の海の抽選）

**Files:**
- Modify: `src/data/world-constants.ts`（末尾に追記）
- Create: `src/systems/pick-starting-residents.ts`
- Test: `src/systems/pick-starting-residents.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/pick-starting-residents.test.ts`:

```typescript
import { expect, test } from "bun:test";
import type { ZukanEntry } from "../types";
import { pickStartingResidents } from "./pick-starting-residents";

const fixedRandom = () => 0.5;
const entry: ZukanEntry = {
  firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
  birthCount: 1,
};

test("図鑑が空なら誰も泳がない", () => {
  expect(pickStartingResidents({}, fixedRandom)).toEqual([]);
});

test("1 種だけ発見済みなら 1 体だけ泳ぐ", () => {
  const residents = pickStartingResidents({ taiyaki: entry }, fixedRandom);
  expect(residents.length).toBe(1);
  expect(residents[0].species).toBe("taiyaki");
});

test("3 種発見済みなら 3 体・種の重複なし", () => {
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  const residents = pickStartingResidents(zukan, fixedRandom);
  expect(residents.length).toBe(3);
  expect(new Set(residents.map((r) => r.species)).size).toBe(3);
});

test("random=0.5 の抽選順は [strawberryJelly, taiyaki, ramuneFish]", () => {
  // pool [ramuneFish, strawberryJelly, taiyaki] から floor(0.5*3)=1 → strawberryJelly
  // pool [ramuneFish, taiyaki] から floor(0.5*2)=1 → taiyaki
  // pool [ramuneFish] から floor(0.5*1)=0 → ramuneFish
  const zukan = { ramuneFish: entry, strawberryJelly: entry, taiyaki: entry };
  const species = pickStartingResidents(zukan, fixedRandom).map(
    (r) => r.species,
  );
  expect(species).toEqual(["strawberryJelly", "taiyaki", "ramuneFish"]);
});

test("生成された住民は帯内の位置・誕生演出なしの bornAtMs を持つ", () => {
  const resident = pickStartingResidents({ ramuneFish: entry }, fixedRandom)[0];
  expect(resident.baseY).toBe(71); // 24 + 0.5 * (118 - 24)
  expect(resident.y).toBe(71);
  expect(resident.x).toBe(240); // 0.5 * 480
  expect(resident.dir).toBe(1); // 0.5 < 0.5 は false
  expect(resident.phase).toBe(3); // 0.5 * 6
  expect(resident.bornAtMs).toBe(-10000);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/pick-starting-residents.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 定数と関数を実装する**

`src/data/world-constants.ts` の末尾に追記:

```typescript
/** 起動時に図鑑（発見済みの種）から泳がせる住民の最大数 */
export const STARTING_RESIDENT_MAX = 3;
```

`src/systems/pick-starting-residents.ts` を新規作成:

```typescript
import { SPECIES_IDS } from "../data/species-ids";
import {
  RESIDENT_MAX_BASE_Y,
  RESIDENT_MIN_BASE_Y,
  STARTING_RESIDENT_MAX,
  WORLD_WIDTH,
} from "../data/world-constants";
import type { Resident, Zukan } from "../types";

/**
 * 起動時の海の抽選。発見済みの種からランダムに最大 STARTING_RESIDENT_MAX 体
 * （種の重複なし）を生成する。乱数は注入（テスト決定性）。
 * bornAtMs は十分過去の値（-10000）にして誕生演出を再生しない。
 * 将来の滞在スケジューラはこの関数の置き換えで実現する
 */
export function pickStartingResidents(
  zukan: Zukan,
  random: () => number,
): Resident[] {
  const pool = SPECIES_IDS.filter((id) => zukan[id] !== undefined);
  const count = Math.min(STARTING_RESIDENT_MAX, pool.length);
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
      bornAtMs: -10000,
    });
  }
  return residents;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/systems/pick-starting-residents.test.ts`
Expected: 5 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/data/world-constants.ts src/systems/pick-starting-residents.ts src/systems/pick-starting-residents.test.ts
git commit -m "feat: 起動時の海の抽選 pickStartingResidents を追加（発見済みの種から最大3体）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: restoreStateFromSave（セーブ → 起動時状態）

**Files:**
- Create: `src/systems/restore-state-from-save.ts`
- Test: `src/systems/restore-state-from-save.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/systems/restore-state-from-save.test.ts`:

```typescript
import { expect, test } from "bun:test";
import type { SaveData } from "../types";
import { restoreStateFromSave } from "./restore-state-from-save";

const fixedRandom = () => 0.5;

test("満腹ゲージがセーブから復元される", () => {
  const save: SaveData = { version: 1, zukan: {}, satiety: 3 };
  expect(restoreStateFromSave(save, fixedRandom).satiety).toBe(3);
});

test("発見済みの種が residents として泳ぎ出す", () => {
  const save: SaveData = {
    version: 1,
    zukan: {
      taiyaki: {
        firstDiscoveredAt: "2026-07-06T10:00:00.000Z",
        birthCount: 2,
      },
    },
    satiety: 0,
  };
  const state = restoreStateFromSave(save, fixedRandom);
  expect(state.residents.length).toBe(1);
  expect(state.residents[0].species).toBe("taiyaki");
});

test("餌・主人公・経過時間は初期状態と同じ", () => {
  const save: SaveData = { version: 1, zukan: {}, satiety: 0 };
  const state = restoreStateFromSave(save, fixedRandom);
  expect(state.baits.length).toBe(3);
  expect(state.hero).toEqual({ x: 80, y: 60, vx: 0, vy: 0, facing: -1 });
  expect(state.elapsedMs).toBe(0);
  expect(state.path).toEqual([]);
  expect(state.flashes).toEqual([]);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/systems/restore-state-from-save.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/systems/restore-state-from-save.ts` を新規作成:

```typescript
import type { GameState, SaveData } from "../types";
import { createInitialState } from "./create-initial-state";
import { pickStartingResidents } from "./pick-starting-residents";

/**
 * セーブから起動時のゲーム状態を作る。顔ぶれ・位置は保存せず
 * 図鑑（発見済みの種）から抽選し、満腹ゲージだけ復元する（確定仕様）
 */
export function restoreStateFromSave(
  save: SaveData,
  random: () => number,
): GameState {
  const base = createInitialState(random);
  return {
    ...base,
    residents: pickStartingResidents(save.zukan, random),
    satiety: save.satiety,
  };
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/systems/restore-state-from-save.test.ts`
Expected: 3 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/systems/restore-state-from-save.ts src/systems/restore-state-from-save.test.ts
git commit -m "feat: セーブからの起動時状態復元 restoreStateFromSave を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: shadowPalette（未発見シルエット用パレット）

**Files:**
- Create: `src/render/shadow-palette.ts`
- Test: `src/render/shadow-palette.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/render/shadow-palette.test.ts`:

```typescript
import { expect, test } from "bun:test";
import { BIRTH_FX_SILHOUETTE_COLOR } from "../data/birth-fx-constants";
import { shadowPalette } from "./shadow-palette";

test("全キーを保持したまま全色が影色になる", () => {
  const palette = { H: "#EAF8FF", L: "#C2E7F8", O: "#22333D" };
  const shadow = shadowPalette(palette);
  expect(Object.keys(shadow)).toEqual(["H", "L", "O"]);
  for (const color of Object.values(shadow)) {
    expect(color).toBe(BIRTH_FX_SILHOUETTE_COLOR); // #0F1E27
  }
});

test("元のパレットは破壊しない", () => {
  const palette = { H: "#EAF8FF" };
  shadowPalette(palette);
  expect(palette.H).toBe("#EAF8FF");
});

test("空パレットは空のまま", () => {
  expect(shadowPalette({})).toEqual({});
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `bun test src/render/shadow-palette.test.ts`
Expected: FAIL（モジュール解決エラー）

- [ ] **Step 3: 実装する**

`src/render/shadow-palette.ts` を新規作成:

```typescript
import { BIRTH_FX_SILHOUETTE_COLOR } from "../data/birth-fx-constants";

/**
 * 図鑑の未発見表示用に、パレットの全色を影色に置き換える（非破壊）。
 * 誕生演出のシルエット（#0F1E27）と同じ色を使い世界観を揃える。
 * "."（透明）はもともとパレットにないので影にならない＝輪郭だけ残る
 */
export function shadowPalette(
  palette: Record<string, string>,
): Record<string, string> {
  const shadow: Record<string, string> = {};
  for (const key of Object.keys(palette)) {
    shadow[key] = BIRTH_FX_SILHOUETTE_COLOR;
  }
  return shadow;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `bun test src/render/shadow-palette.test.ts`
Expected: 3 pass / 0 fail

- [ ] **Step 5: 全テスト・lint・型チェックを確認してコミット**

Run: `bun test && bun run lint && bunx tsc --noEmit`
Expected: 180 pass / 0 fail、lint・tsc エラーなし

```bash
git add src/render/shadow-palette.ts src/render/shadow-palette.test.ts
git commit -m "feat: 未発見シルエット用の shadowPalette を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: localStorage 境界層（キー定数・読み込み・書き込み）

DOM/ストレージ境界層のためユニットテストなし（リポジトリ規約）。検証ロジックは Task 4 の `parseSave` が担っており、この層は薄い配線のみ。

**Files:**
- Create: `src/save/save-storage-key.ts`
- Create: `src/save/load-save.ts`
- Create: `src/save/store-save.ts`

- [ ] **Step 1: キー定数を作る**

`src/save/save-storage-key.ts` を新規作成:

```typescript
/** localStorage のセーブキー。スキーマ番号はキーではなく value 内の version で管理する */
export const SAVE_STORAGE_KEY = "hakoniwa-aquarium-save";
```

- [ ] **Step 2: 読み込み境界層を作る**

`src/save/load-save.ts` を新規作成:

```typescript
import type { SaveData } from "../types";
import { parseSave } from "./parse-save";
import { SAVE_STORAGE_KEY } from "./save-storage-key";

/** localStorage からセーブを読む境界層。検証・フォールバックは parseSave が担う */
export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(SAVE_STORAGE_KEY));
  } catch {
    // localStorage 自体が使えない環境（プライベートモード等）でも起動は続ける
    return parseSave(null);
  }
}
```

- [ ] **Step 3: 書き込み境界層を作る**

`src/save/store-save.ts` を新規作成:

```typescript
import type { SaveData } from "../types";
import { SAVE_STORAGE_KEY } from "./save-storage-key";
import { serializeSave } from "./serialize-save";

/** localStorage へ保存する境界層。容量超過等で失敗してもゲームは止めない */
export function storeSave(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, serializeSave(save));
  } catch {
    // 保存失敗は無視する（次の保存機会で再試行される）。クラッシュさせない
  }
}
```

- [ ] **Step 4: lint・型チェック・全テストを確認する**

Run: `bun run lint && bunx tsc --noEmit && bun test`
Expected: エラーなし、180 pass / 0 fail

- [ ] **Step 5: コミット**

```bash
git add src/save/save-storage-key.ts src/save/load-save.ts src/save/store-save.ts
git commit -m "feat: localStorage 境界層（loadSave / storeSave）を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: 図鑑 UI（DOM オーバーレイ）

DOM 描画のためユニットテストなし（リポジトリ規約）。実機確認は Task 12。

**Files:**
- Modify: `index.html`
- Create: `src/ui/render-zukan-panel.ts`
- Create: `src/ui/attach-zukan-ui.ts`

- [ ] **Step 1: index.html に CSS を追加する**

`index.html` の `<style>` 内、`#game { ... }` ブロックの後（`</style>` の前）に追記:

```css
      #zukan-button {
        position: fixed;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 20px;
        border: 1px solid #3e7ea6;
        border-radius: 6px;
        background: rgba(9, 22, 33, 0.7);
        color: #eaf8ff;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        cursor: pointer;
      }
      #zukan-panel {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(9, 22, 33, 0.6);
      }
      #zukan-panel[hidden] {
        display: none;
      }
      #zukan-window {
        background: rgba(18, 39, 51, 0.92);
        border: 1px solid #3e7ea6;
        border-radius: 8px;
        padding: 16px;
        color: #eaf8ff;
        font-family: system-ui, sans-serif;
        text-align: center;
      }
      #zukan-cards {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }
      .zukan-card {
        width: 96px;
        padding: 8px;
        border: 1px solid rgba(194, 231, 248, 0.3);
        border-radius: 6px;
      }
      .zukan-sprite {
        width: 64px;
        height: 64px;
        image-rendering: pixelated;
      }
      .zukan-name {
        font-size: 12px;
        margin-top: 4px;
      }
      .zukan-meta {
        font-size: 10px;
        margin-top: 4px;
        color: #c2e7f8;
        white-space: pre-line;
        min-height: 26px;
      }
      #zukan-close {
        padding: 6px 16px;
        border: 1px solid #3e7ea6;
        border-radius: 6px;
        background: transparent;
        color: #eaf8ff;
        font-family: system-ui, sans-serif;
        font-size: 12px;
        cursor: pointer;
      }
```

- [ ] **Step 2: index.html に DOM を追加する**

`index.html` の `<canvas ...></canvas>` の直後・`<script>` の前に追記:

```html
    <button id="zukan-button" type="button">ずかん</button>
    <div id="zukan-panel" hidden>
      <div id="zukan-window">
        <div id="zukan-cards"></div>
        <button id="zukan-close" type="button">とじる</button>
      </div>
    </div>
```

- [ ] **Step 3: カード描画を実装する**

`src/ui/render-zukan-panel.ts` を新規作成:

```typescript
import { RESIDENT_SPRITES } from "../data/resident-sprites";
import { SPECIES_IDS } from "../data/species-ids";
import { SPECIES_NAMES } from "../data/species-names";
import { drawGrid } from "../render/draw-grid";
import { shadowPalette } from "../render/shadow-palette";
import type { Zukan } from "../types";

/**
 * 図鑑パネルの中身（カード一覧）を描き直す。開くたびに全カードを作り直す。
 * スプライトは既存グリッドデータを小 canvas に描く（画像ファイル不要・pixelated）。
 * 未発見は影パレット＋「？」で表示する
 */
export function renderZukanPanel(container: HTMLElement, zukan: Zukan): void {
  container.replaceChildren();
  for (const speciesId of SPECIES_IDS) {
    const entry = zukan[speciesId];
    const sprite = RESIDENT_SPRITES[speciesId];

    const canvas = document.createElement("canvas");
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    canvas.className = "zukan-sprite";
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const palette = entry ? sprite.palette : shadowPalette(sprite.palette);
      drawGrid(ctx, sprite.frames[0], palette, 0, 0, false);
    }

    const name = document.createElement("div");
    name.className = "zukan-name";
    name.textContent = entry ? SPECIES_NAMES[speciesId] : "？";

    const meta = document.createElement("div");
    meta.className = "zukan-meta";
    meta.textContent = entry
      ? `はじめて: ${new Date(entry.firstDiscoveredAt).toLocaleDateString("ja-JP")}\nうまれた数: ${entry.birthCount}`
      : "";

    const card = document.createElement("div");
    card.className = "zukan-card";
    card.append(canvas, name, meta);
    container.append(card);
  }
}
```

- [ ] **Step 4: 開閉の配線を実装する**

`src/ui/attach-zukan-ui.ts` を新規作成:

```typescript
import type { Zukan } from "../types";
import { renderZukanPanel } from "./render-zukan-panel";

/**
 * 「ずかん」ボタンとパネルの開閉を配線する。開いてもゲームは止めない。
 * 図鑑は開くたびに getZukan() で最新を取り直して描く
 */
export function attachZukanUi(getZukan: () => Zukan): void {
  const button = document.querySelector<HTMLButtonElement>("#zukan-button");
  const panel = document.querySelector<HTMLElement>("#zukan-panel");
  const cards = document.querySelector<HTMLElement>("#zukan-cards");
  const close = document.querySelector<HTMLButtonElement>("#zukan-close");
  if (!button || !panel || !cards || !close) {
    throw new Error("図鑑 UI の要素が見つからない");
  }
  button.addEventListener("click", () => {
    renderZukanPanel(cards, getZukan());
    panel.hidden = false;
  });
  close.addEventListener("click", () => {
    panel.hidden = true;
  });
  panel.addEventListener("click", (event) => {
    // 背景（パネル自身）のクリックでも閉じる。カード上のクリックは閉じない
    if (event.target === panel) panel.hidden = true;
  });
}
```

- [ ] **Step 5: lint・型チェック・全テストを確認してコミット**

Run: `bun run lint && bunx tsc --noEmit && bun test`
Expected: エラーなし、180 pass / 0 fail
（注: この時点で attachZukanUi は未使用のため、Biome が未使用エクスポートを警告しないことを確認。エクスポート関数は対象外なので警告は出ない想定）

```bash
git add index.html src/ui/render-zukan-panel.ts src/ui/attach-zukan-ui.ts
git commit -m "feat: 図鑑 UI（ずかんボタン・半透明パネル・カード描画）を追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: main.ts 統合（起動復元・誕生検知・自動保存・UI 接続）

**Files:**
- Modify: `src/main.ts`（全面書き換え）

- [ ] **Step 1: main.ts を書き換える**

`src/main.ts` の全文を以下に置き換える:

```typescript
import { MAX_TICKS_PER_FRAME, TICK_MS } from "./data/world-constants";
import { attachPointerInput } from "./engine/attach-pointer-input";
import { cameraPosition } from "./engine/camera-position";
import { createFixedTimestep } from "./engine/create-fixed-timestep";
import { shouldAddWaypoint } from "./engine/should-add-waypoint";
import { applyCanvasScale } from "./render/apply-canvas-scale";
import { drawScene } from "./render/draw-scene";
import { loadSave } from "./save/load-save";
import { storeSave } from "./save/store-save";
import { updateZukan } from "./save/update-zukan";
import { restoreStateFromSave } from "./systems/restore-state-from-save";
import { stepWorld } from "./systems/step-world";
import { attachZukanUi } from "./ui/attach-zukan-ui";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("canvas #game が見つからない");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D コンテキストを取得できない");

// セーブ読込 → 発見済みの種から抽選した海で開始（顔ぶれは保存しない確定仕様）
const save = loadSave();
let zukan = save.zukan;
let state = restoreStateFromSave(save, Math.random);

attachZukanUi(() => zukan);

const getCamera = () => cameraPosition(state.hero.x, state.hero.y);

attachPointerInput(canvas, getCamera, (point, isStart) => {
  if (isStart) {
    state = { ...state, path: [point] };
  } else if (shouldAddWaypoint(state.path, point)) {
    state = { ...state, path: [...state.path, point] };
  }
});

const advance = createFixedTimestep(TICK_MS, MAX_TICKS_PER_FRAME, () => {
  const prev = state;
  state = stepWorld(state, Math.random);
  // 誕生検知: 住民は増えるだけ（退出なし）なので length 増加 = 誕生。
  // 1 tick で複数誕生は構造的に不可能（step-world の繰り越しコメント参照）
  if (state.residents.length > prev.residents.length) {
    const born = state.residents[state.residents.length - 1];
    // 現実時刻の取得は境界層のここでだけ行う（純粋関数には ISO 文字列で渡す）
    zukan = updateZukan(zukan, born.species, new Date().toISOString());
    storeSave({ version: 1, zukan, satiety: state.satiety });
  } else if (state.satiety !== prev.satiety) {
    // 捕食（満腹変化）でも自動保存。変化のない tick では書き込まない
    storeSave({ version: 1, zukan, satiety: state.satiety });
  }
});

const resize = () =>
  applyCanvasScale(canvas, window.innerWidth, window.innerHeight);
window.addEventListener("resize", resize);
resize();

const frame = (now: number) => {
  advance(now);
  const { camX, camY } = getCamera();
  drawScene(ctx, state, camX, camY);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
```

（変更点: `createInitialState` の import と呼び出しを `loadSave` + `restoreStateFromSave` に差し替え、`attachZukanUi` 接続と tick 内の誕生検知・自動保存を追加。それ以外は既存のまま）

- [ ] **Step 2: lint・型チェック・全テストを確認する**

Run: `bun run lint && bunx tsc --noEmit && bun test`
Expected: エラーなし、180 pass / 0 fail（main.ts はテスト対象外の境界層）

- [ ] **Step 3: ビルドを確認する**

Run: `bun run build`
Expected: vite build が成功する

- [ ] **Step 4: コミット**

```bash
git add src/main.ts
git commit -m "feat: 起動時のセーブ復元・誕生検知による図鑑更新と自動保存を main に統合

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: 全体検証と実機確認

**Files:** なし（検証のみ）

- [ ] **Step 1: 全チェックを一括実行する**

Run: `bun run lint && bunx tsc --noEmit && bun test && bun run build`
Expected: すべて成功。テストは 180 pass / 0 fail（既存 152 + 新規 28。既存テストの変更なし）

- [ ] **Step 2: 開発サーバーを起動する**

Run: ポート 3000 の重複プロセスを確認してから `bun run dev`
Expected: vite dev server が起動し URL が表示される

- [ ] **Step 3: Chrome で実機確認する（初回起動と図鑑の開閉）**

1. Chrome で dev server の URL を開く前に、DevTools → Application → Local Storage で `hakoniwa-aquarium-save` を削除しておく（クリーンな初回起動を再現）
2. ページを開き、画面下に「ずかん」ボタンが表示されることを確認する
3. 「ずかん」を押す → 半透明パネルが開き、3 種すべてが影（#0F1E27 のシルエット）＋「？」で表示されることを確認する
4. パネルが開いている間も背後でゲームが進行している（餌が泳ぎ続けている）ことを確認する
5. 「とじる」ボタンと背景クリックの両方でパネルが閉じることを確認する

- [ ] **Step 4: 実機確認（誕生 → 図鑑登録 → 自動保存）**

1. 線を描いて影の魚を 5 匹食べ、ラムネ魚を誕生させる
2. 「ずかん」を開き、ラムネ魚のカードが本来の色・名前「ラムネ魚」・今日の日付・「うまれた数: 1」になっていることを確認する（他 2 種は影＋「？」のまま）
3. DevTools → Application → Local Storage で `hakoniwa-aquarium-save` に `{"version":1,"zukan":{"ramuneFish":{...}},"satiety":...}` が保存されていることを確認する

- [ ] **Step 5: 実機確認（セーブ → リロード → 復元）**

1. 餌をさらに 2 匹食べて満腹ゲージを進めた状態でページをリロードする
2. ラムネ魚が最初から泳いでいる（発見済みの種だけが登場する）ことを確認する
3. 満腹ピップがリロード前の値で復元されていることを確認する
4. もう一度リロードしても同様に復元されることを確認する

- [ ] **Step 6: 実機確認（壊れたセーブへの耐性）**

1. DevTools のコンソールで `localStorage.setItem("hakoniwa-aquarium-save", "{broken")` を実行してリロードする → クラッシュせず初期状態（住民 0・満腹 0・図鑑全部「？」）で起動することを確認する
2. `localStorage.setItem("hakoniwa-aquarium-save", JSON.stringify({ version: 99 }))` でも同様に初期状態で起動することを確認する
3. 確認後は `localStorage.removeItem("hakoniwa-aquarium-save")` でリセットするか、そのまま遊び直す

- [ ] **Step 7: 開発サーバーを停止する**

Run: dev server のプロセスを終了する（Ctrl+C 相当）
Expected: ポート 3000 が解放される
