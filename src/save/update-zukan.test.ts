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
  const next = updateZukan(
    zukan,
    "strawberryJelly",
    "2026-07-06T10:00:00.000Z",
  );
  expect(next.taiyaki).toEqual({
    firstDiscoveredAt: "2026-07-05T08:00:00.000Z",
    birthCount: 4,
  });
  expect(next.strawberryJelly?.birthCount).toBe(1);
});
