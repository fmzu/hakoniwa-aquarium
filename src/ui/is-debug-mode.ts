/** URL に ?debug があるか。開発サーバー（例: http://localhost:5173/?debug）でだけ動作確認用パネルを出すのに使う */
export function isDebugMode(search: string): boolean {
  return new URLSearchParams(search).has("debug");
}
