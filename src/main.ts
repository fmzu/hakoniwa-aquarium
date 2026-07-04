const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("canvas #game が見つからない");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D コンテキストを取得できない");
ctx.fillStyle = "#122733";
ctx.fillRect(0, 0, canvas.width, canvas.height);
