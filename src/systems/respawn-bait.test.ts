import { expect, test } from "bun:test";
import type { Bait } from "../types";
import { respawnBait } from "./respawn-bait";

test("主人公の反対側（torus の対蹠点）に置き直す", () => {
  const bait: Bait = { x: 88, baseY: 54, y: 54, dir: 1, phase: 0 };
  const respawned = respawnBait(bait, 100, 74);
  expect(respawned.x).toBe(340); // mod(100 + 240, 480)
  expect(respawned.baseY).toBe(74);
  expect(respawned.dir).toBe(1); // 進行方向は保つ
});
