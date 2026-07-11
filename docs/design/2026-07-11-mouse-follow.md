# マウスのカーソル追従操作

承認済み設計。

## 課題

タッチ操作（線描き）は快適だが、PCマウスで線を引く操作は大きく手を動かす必要があり使いづらい。

## 解決策

`event.pointerType === "mouse"` のとき、線を描く代わりに**押している間カーソルを追従**させる。

- `pointerdown` / `pointermove`（押下中）ともに `onStroke(point, isStart=true)` を呼ぶ
- 呼び出し側（main.ts）は `isStart=true` で `path = [point]` に置き換えるため、カーソル現在地が常に唯一のウェイポイントになる
- `pointerup` 後も path をクリアしない → 最後のカーソル位置へ向かって漂う（タップと同じ挙動）

## 実装方針

変更ファイル: `src/engine/attach-pointer-input.ts` のみ。

`pointerdown` / `pointermove` の既存ハンドラ内で `event.pointerType` を参照し、`"mouse"` のときは `isStart=true` を送る。`isPrimary` ガード・`setPointerCapture`・`pointercancel` の既存処理は維持する。

## スコープ外

- **キーボード操作は不採用** — 操縦ゲー化を避ける
- **タッチ・ペンは現状維持** — 線描きが快適に機能しているため変更しない
- `main.ts`、systems 層は無変更
