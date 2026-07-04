import type { Sprite } from "../../types";

export const shadowFishSprite: Sprite = {
  width: 16,
  height: 5,
  frames: [
    [
      "...XXXX.........",
      "..XXXXXX.X......",
      "..XXXXXXXX......",
      "..XXXXXX.X......",
      "...XXXX.........",
    ],
  ],
  palette: {
    X: "#0F1E27",
  },
  frameIntervalMs: 0,
};
