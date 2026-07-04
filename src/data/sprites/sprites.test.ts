import { describe, expect, test } from "bun:test";
import type { Sprite } from "../../types";
import { nessieSprite } from "./nessie";
import { ramuneFishSprite } from "./ramune-fish";
import { shadowFishSprite } from "./shadow-fish";
import { strawberryJellySprite } from "./strawberry-jelly";

const sprites: ReadonlyArray<[string, Sprite]> = [
  ["nessie", nessieSprite],
  ["shadowFish", shadowFishSprite],
  ["ramuneFish", ramuneFishSprite],
  ["strawberryJelly", strawberryJellySprite],
];

describe("スプライト整合性", () => {
  for (const [name, sprite] of sprites) {
    test(`${name}: 全フレームが width×height と一致する`, () => {
      for (const frame of sprite.frames) {
        expect(frame.length).toBe(sprite.height);
        for (const row of frame) {
          expect(row.length).toBe(sprite.width);
        }
      }
    });

    test(`${name}: 使用文字がすべて自分のパレットに定義されている`, () => {
      for (const frame of sprite.frames) {
        for (const row of frame) {
          for (const ch of row) {
            if (ch !== ".") {
              expect(sprite.palette[ch]).toBeDefined();
            }
          }
        }
      }
    });
  }
});

test("主人公・ラムネ魚・クラゲは 2 フレーム", () => {
  expect(nessieSprite.frames.length).toBe(2);
  expect(ramuneFishSprite.frames.length).toBe(2);
  expect(strawberryJellySprite.frames.length).toBe(2);
});

test("影の魚は 1 色シルエット 1 フレーム", () => {
  expect(shadowFishSprite.frames.length).toBe(1);
  expect(Object.keys(shadowFishSprite.palette)).toEqual(["X"]);
});
