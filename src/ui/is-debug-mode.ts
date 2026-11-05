/** URL に ?debug があれば動作確認用パネルを出す（例: http://localhost:5173/?debug） */
export function isDebugMode(search: string): boolean {
  return new URLSearchParams(search).has("debug");
}
