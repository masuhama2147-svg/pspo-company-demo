#!/usr/bin/env node
/* =============================================================================
 * serve.js — 依存ゼロの静的サーバ（Node標準モジュールのみ）
 * Notion原則: ビルド無し＝「書いたJS＝動くJS」。デプロイは実質ファイル転送。
 *
 * 使い方:   node serve.js            （既定ポート 8731）
 *           PORT=9000 node serve.js   （ポート指定）
 * ポートが使用中なら自動で +1 して空きを探す（最大 +30）。被らない。
 * HTML/CSS/JS は no-cache（直したら即反映: Notion原則「キャッシュは意図的に」）。
 * ========================================================================== */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const START_PORT = parseInt(process.env.PORT || "8731", 10);
const MAX_TRIES = 30;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const NO_CACHE = new Set([".html", ".js", ".mjs", ".css", ".webmanifest"]);

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
    // パストラバーサル防止
    const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(ROOT, safe);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("403"); }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(`<meta charset=utf-8><body style="font-family:sans-serif;background:#0a0e13;color:#eaf0f4;padding:40px"><h1>404</h1><p>${safe} は見つかりません。<a style="color:#22d3c0" href="/">トップへ</a></p>`);
      }
      const ext = path.extname(filePath).toLowerCase();
      const headers = { "Content-Type": MIME[ext] || "application/octet-stream" };
      if (NO_CACHE.has(ext)) headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      else headers["Cache-Control"] = "public, max-age=3600";
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500); res.end("500");
  }
});

function listen(port, tries) {
  // STRICT_PORT=1（E2E等）では占有時に +1 せず即終了し、固定ポート期待との不整合を防ぐ
  const strict = process.env.STRICT_PORT === "1";
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && !strict && tries < MAX_TRIES) {
      console.log(`⚠️  ポート ${port} は使用中 → ${port + 1} を試します`);
      listen(port + 1, tries + 1);
    } else {
      console.error("サーバ起動エラー:", err.message);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    console.log("\n  ╭────────────────────────────────────────────────╮");
    console.log("  │  P・SPO 改修提案デモ (concept)                  │");
    console.log(`  │  ▶  http://localhost:${String(port).padEnd(5)}                      │`);
    console.log("  │  Ctrl+C で停止                                    │");
    console.log("  ╰────────────────────────────────────────────────╯\n");
  });
}
listen(START_PORT, 0);
