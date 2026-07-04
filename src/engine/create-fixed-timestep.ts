/**
 * 固定タイムステップ駆動。requestAnimationFrame のタイムスタンプを渡すと、
 * 蓄積時間が tickMs を超えたぶんだけ onTick を呼ぶ。
 * 1 フレームの tick 数は maxTicksPerFrame で頭打ちし、超過分は捨てる（スパイラル防止）
 */
export function createFixedTimestep(
  tickMs: number,
  maxTicksPerFrame: number,
  onTick: () => void,
): (frameTimeMs: number) => void {
  let lastTimeMs: number | null = null;
  let accumulatorMs = 0;
  return (frameTimeMs) => {
    if (lastTimeMs === null) lastTimeMs = frameTimeMs;
    accumulatorMs += frameTimeMs - lastTimeMs;
    lastTimeMs = frameTimeMs;
    let ticks = 0;
    while (accumulatorMs >= tickMs && ticks < maxTicksPerFrame) {
      onTick();
      accumulatorMs -= tickMs;
      ticks += 1;
    }
    if (ticks === maxTicksPerFrame) accumulatorMs = 0;
  };
}
