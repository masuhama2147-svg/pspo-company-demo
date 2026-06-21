// sw.js — 最小サービスワーカー（アプリシェルのオフライン化）
// 「ホーム画面に追加 → ネイティブ風に起動」を成立させ、アプリ→Chrome遷移問題を解消。
// 開発中の取り回しを優先し、HTML/CSS/JS は network-first（=直したらすぐ反映）。
const VERSION = "sukima-v4";
const SHELL = [
  "index.html", "area.html", "live.html", "me.html", "growth.html", "critique.html",
  "css/base.css", "css/layout.css", "css/components.css", "css/pages.css", "css/motion.css",
  "js/config.js", "js/data.js", "js/live.js", "js/ui.js", "js/insights.js", "js/member.js", "js/widgets.js", "js/stores-real.js",
  "assets/logo.svg", "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 外部（フォント等）はそのまま

  const isShell = /\.(html|css|js)$/.test(url.pathname) || url.pathname.endsWith("/");
  if (isShell) {
    // network-first（最新を優先、落ちたらキャッシュ）
    e.respondWith(
      fetch(request).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(request, copy)); return res; })
        .catch(() => caches.match(request).then((r) => r || caches.match("index.html")))
    );
  } else {
    // assets は cache-first
    e.respondWith(caches.match(request).then((r) => r || fetch(request).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(request, copy)); return res; })));
  }
});
