// =============================================================================
// ui.js — 共有UI（ヘッダ/フッタ/タブバー注入・テーマ・アイコン・PWA・補助関数）
// Notion原則: DRYな共有部品 + アクセシビリティ(aria/skip/44px) + キャッシュ意識。
// =============================================================================
import { BRAND, levelOf } from "./config.js";
import { accountButtonHTML, wireAccount, showLogin, shouldWelcome } from "./auth.js";
import { startOnboarding, isOnboarded } from "./onboard.js";

/* ---- ナビ定義（単一の真実の源） -------------------------------------
   重要: 顧客アプリ(group:"app") と 経営AIエージェント/提案(group:"biz") を切り分ける。
   顧客が見るのは app。biz は管理者・事業提案レイヤー。 */
export const NAV = [
  { href: "app.html",      label: "ホーム",             short: "ホーム", icon: "home",   key: "home",     group: "app" },
  { href: "area.html",     label: "店舗・空き",         short: "空き",   icon: "pulse",  key: "live",     group: "app" },
  { href: "me.html",       label: "マイページ",         short: "マイ",   icon: "user",   key: "me",       group: "app" },
  { href: "growth.html",   label: "経営AIエージェント", short: "経営AI", icon: "growth", key: "growth",   group: "biz" },
  { href: "data.html",     label: "データ戦略・都市知能", short: "データ", icon: "data",  key: "data",     group: "biz" },
  { href: "machimiru.html",label: "マチミル（地元企業向け）", short: "マチミル", icon: "growth", key: "machimiru", group: "biz" },
  { href: "critique.html", label: "この提案について",   short: "提案",   icon: "spark",  key: "critique", group: "biz" },
  { href: "brief.html",    label: "経営層への説明",     short: "説明",   icon: "sparkles", key: "brief",  group: "biz" },
];
const TAB_KEYS = ["home", "live", "me"]; // モバイル下部タブ＝顧客のみ（経営AI/提案は除外）

/* ---- インラインSVGアイコン（量産感を避けつつ軽量） ------------------ */
const ICONS = {
  // ゾーン
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />',
  weight: '<path d="M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10" />',
  run: '<path d="M13 4.5a1.4 1.4 0 1 0 0-.1Z" /><path d="M9 20l2.5-5 2-2 1 4 3 2M6 11l3-2 3 .5 2 3" />',
  yoga: '<circle cx="12" cy="4.6" r="1.7"/><path d="M12 8v5m0 0-5 6m5-6 5 6M6 11h12" />',
  sauna: '<path d="M4 20h16M5 20v-7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v7M9 6c0-1 1-1 1-2M13 6c0-1 1-1 1-2" />',
  cup: '<path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8ZM16 9h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2" />',
  desk: '<path d="M3 8h18M5 8v11M19 8v11M4 13h16M9 19v2M15 19v2" />',
  drop: '<path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z" />',
  // ナビ
  home: '<path d="M4 11 12 4l8 7M6 9.5V20h12V9.5" />',
  pulse: '<path d="M3 12h4l2-6 4 13 2.5-7H21" />',
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0" />',
  growth: '<path d="M4 19h16M6 16l4-5 3 3 5-7M18 7h-3M18 7v3" />',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />',
  // UI
  shield: '<path d="M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z" /><path d="M9.5 12l1.8 1.8 3.2-3.6" />',
  bolt: '<path d="M13 3 5 13h5l-1 8 8-11h-5l1-7Z" />',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2" />',
  fire: '<path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 1-1 1-2 2 2 2 3.5 2 5a5 5 0 0 1-10 0c0-3.5 3-4 5-10Z" />',
  share: '<circle cx="6" cy="12" r="2.2"/><circle cx="17" cy="6" r="2.2"/><circle cx="17" cy="18" r="2.2"/><path d="M8 11l7-4M8 13l7 4" />',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0" />',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />',
  check: '<path d="M5 12.5 10 17l9-10" />',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" />',
  download: '<path d="M12 3v12M7 11l5 5 5-5M5 20h14" />',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h4a1.6 1.6 0 0 1 0 3.2H10a1.6 1.6 0 0 0 0 3.2h4" />',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14h4" />',
  cap: '<path d="M3 9l9-4 9 4-9 4-9-4ZM7 11v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4M21 9v4" />',
  women: '<circle cx="12" cy="8" r="4.2"/><path d="M12 12.2V20M9 17h6" />',
  camera: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.2"/><path d="M8 7l1.5-2h5L16 7" />',
  warn: '<path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17.5v.5" />',
  data: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />',
  sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />',
};

export function icon(name, { size = 20, cls = "" } = {}) {
  const p = ICONS[name] || ICONS.spark;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${p}</svg>`;
}

/* ---- 整形ヘルパ ------------------------------------------------------ */
export const fmtInt = (n) => Math.round(n).toLocaleString("ja-JP");
export const fmtPct = (r) => `${Math.round(r * 100)}`;
export function fmtClock(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
export function relTime(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "たった今";
  if (s < 60) return `${s}秒前`;
  return `${Math.round(s / 60)}分前`;
}
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---- レベル → ピルHTML ---------------------------------------------- */
export function levelPill(ratio, { showPct = false } = {}) {
  const lv = levelOf(ratio);
  return `<span class="c-level" data-level="${lv.id}"><span class="c-dot c-dot--pulse"></span>${lv.label}${showPct ? ` <span class="mono">${fmtPct(ratio)}%</span>` : ""}</span>`;
}

/* ---- テーマ ---------------------------------------------------------- */
const THEME_KEY = "sukima-theme";
export function getTheme() { return localStorage.getItem(THEME_KEY) || "light"; }
export function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  const btn = document.getElementById("themeBtn");
  if (btn) btn.innerHTML = icon(t === "dark" ? "sun" : "moon");
}
export function toggleTheme() { applyTheme(getTheme() === "dark" ? "light" : "dark"); }

/* ---- ペルソナ（パーソナライズのデモ用切替） ------------------------- */
const PROFILE_KEY = "sukima-profile";
export function getProfile() { return localStorage.getItem(PROFILE_KEY) || "student_night"; }
export function setProfile(p) { localStorage.setItem(PROFILE_KEY, p); }

/* ---- オンボーディングで選んだ嗜好（用途・ホーム店舗・時間帯） -------- */
const PREFS_KEY = "sukima-prefs";
export function getPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "null"); } catch (e) { return null; } }
export function setPrefs(p) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {} }

/* ---- ヘッダ / フッタ / タブバー 注入 -------------------------------- */
function navLinks(active) {
  let html = ""; let sepDone = false;
  NAV.forEach((n) => {
    if (n.group === "biz" && !sepDone) { html += `<span class="site-nav__sep" aria-hidden="true"></span>`; sepDone = true; }
    const cur = n.key === active ? 'aria-current="page"' : "";
    html += `<a href="${n.href}" ${cur} class="${n.group === "biz" ? "is-biz" : ""}">${n.label}</a>`;
  });
  return html;
}
function tabLinks(active) {
  return NAV.filter((n) => TAB_KEYS.includes(n.key)).map((n) => {
    const cur = n.key === active ? 'aria-current="page"' : "";
    return `<a href="${n.href}" ${cur} class="c-tabbar__item">${icon(n.icon, { size: 22 })}<span>${n.short || n.label}</span></a>`;
  }).join("");
}

/* ---- フッタ（initChrome / initLanding 共通） ------------------------ */
function mountFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container site-footer__inner">
      <div class="site-footer__top">
        <div style="max-width:340px">
          <div class="brand" style="margin-bottom:10px"><span class="brand__logo" role="img" aria-label="${BRAND.name}"></span></div>
          <p class="t-muted" style="font-size:.86rem">${BRAND.subtitle}</p>
          <p class="t-faint" style="font-size:.78rem;margin-top:10px">これは P・SPO（三福HD）の公式サービスではなく、改善提案のための非営利デモです。写真・データはすべてダミー。</p>
        </div>
        <div class="site-footer__cols">
          <div><h4>プロダクト</h4>
            <a href="index.html">はじめての方（ダウンロード）</a>
            ${NAV.filter((n) => n.group === "app").map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
            <a href="price.html">料金まるわかり</a>
            <a href="guide.html">はじめ方ガイド</a>
            ${NAV.filter((n) => n.group === "biz").map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
          </div>
          <div><h4>公式 P・SPO</h4>
            <a href="https://pspo.jp/beginner/" target="_blank" rel="noopener">見学・体験</a>
            <a href="https://pspo.jp/join/" target="_blank" rel="noopener">ご入会</a>
            <a href="https://pspo.jp/planforcompany/" target="_blank" rel="noopener">法人企業様</a>
            <a href="https://pspo.jp/area/" target="_blank" rel="noopener">店舗検索</a>
            <a href="https://pspo.jp/" target="_blank" rel="noopener">公式サイト</a>
          </div>
          <div><h4>設計思想</h4>
            <a href="critique.html#playbook">Notionプレイブック準拠</a>
            <a href="critique.html#privacy">プライバシー（非PII）</a>
            <a href="critique.html#tech">技術選定</a>
          </div>
        </div>
      </div>
      <div class="site-footer__legal">© <span id="yr"></span> ${BRAND.name} concept demo — built build-less (vanilla HTML/CSS/JS). 「${BRAND.tagline}」</div>
    </div>`;
  document.body.appendChild(footer);
  const yr = footer.querySelector("#yr"); if (yr) yr.textContent = new Date().getFullYear();
}

/* ---- ランディング(index.html)用の軽量クローム（タブバー/ログインboot無し） ---
   集客の公開トップ。ロゴ＋「アプリを開く」＋テーマのみ。新規ユーザーをApp Store/アプリへ。 */
export function initLanding() {
  applyTheme(getTheme());
  const header = document.createElement("header");
  header.className = "site-header site-header--landing";
  header.innerHTML = `
    <div class="site-header__inner">
      <a class="brand" href="index.html" aria-label="${BRAND.name}">
        <span class="brand__logo" role="img" aria-label="${BRAND.name}"></span>
      </a>
      <div class="cluster" style="margin-left:auto;gap:8px;flex-wrap:nowrap">
        <a class="c-btn c-btn--ghost c-btn--sm landing-open-app" href="app.html"><span class="full">アプリを開く</span><span class="short">開く</span></a>
        <a class="c-btn c-btn--primary c-btn--sm" href="price.html" aria-label="会員になる（料金まるわかりへ）">会員になる</a>
        <button id="themeBtn" class="icon-btn" aria-label="テーマ切替" title="テーマ切替">${icon("sun")}</button>
      </div>
    </div>`;
  document.body.prepend(header);
  const skip = document.createElement("a");
  skip.className = "skip-link"; skip.href = "#main"; skip.textContent = "本文へスキップ";
  document.body.prepend(skip);
  document.getElementById("themeBtn").addEventListener("click", toggleTheme);
  // モバイルのサムゾーンに常設の入会CTAバー（いつでもタッチで契約へ）
  const ctaBar = document.createElement("div");
  ctaBar.className = "landing-cta-bar";
  ctaBar.innerHTML = `
    <a class="c-btn c-btn--ghost" href="https://pspo.jp/beginner/" target="_blank" rel="noopener">無料体験</a>
    <a class="c-btn c-btn--primary" href="price.html">会員になる</a>`;
  document.body.appendChild(ctaBar);
  mountFooter();
  const onScroll = () => header.classList.toggle("condensed", window.scrollY > 16);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  setupInstall();
  observeReveal();
}

export function initChrome({ active = "" } = {}) {
  applyTheme(getTheme());

  // ヘッダ
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="site-header__inner">
      <a class="brand" href="app.html" aria-label="${BRAND.name} ホーム">
        <span class="brand__logo" role="img" aria-label="${BRAND.name}"></span>
      </a>
      <nav class="site-nav" aria-label="メイン">${navLinks(active)}</nav>
      ${accountButtonHTML()}
      <button id="themeBtn" class="icon-btn" aria-label="テーマ切替" title="テーマ切替">${icon("sun")}</button>
    </div>`;
  document.body.prepend(header);
  // スキップリンク
  const skip = document.createElement("a");
  skip.className = "skip-link"; skip.href = "#main"; skip.textContent = "本文へスキップ";
  document.body.prepend(skip);

  document.getElementById("themeBtn").addEventListener("click", toggleTheme);

  // アカウント（ログイン状態）。ログイン/ログアウトで再描画する。
  function refreshAccount() {
    const cur = header.querySelector("#acctBtn");
    if (cur) cur.outerHTML = accountButtonHTML();
    wireAccount({ onChange: refreshAccount });
  }
  wireAccount({ onChange: refreshAccount });

  // フッタ（ランディングと共通）
  mountFooter();

  // モバイル下部タブバー（アプリ感＝Web→Chrome遷移問題への回答）
  const tabbar = document.createElement("nav");
  tabbar.className = "c-tabbar"; tabbar.setAttribute("aria-label", "下部ナビ");
  tabbar.innerHTML = tabLinks(active);
  document.body.appendChild(tabbar);

  // ヘッダをスクロールで凝縮（GAFA系の挙動）
  const onScroll = () => header.classList.toggle("condensed", window.scrollY > 16);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  setupInstall();
  observeReveal();

  // 初回ブート（顧客アプリのみ）: 歓迎ログイン(1タップ) → オンボーディング(用途/店舗/時間帯)。
  // すべて1回だけ。経営AI/批評(biz)には出さない。
  if (["home", "live", "me"].includes(active)) {
    const profileUpdated = () => { refreshAccount(); window.dispatchEvent(new CustomEvent("sukima:profile-updated")); };
    const runOnboard = () => { if (!isOnboarded()) startOnboarding({ onDone: profileUpdated }); };
    if (shouldWelcome()) showLogin({ onSuccess: () => { profileUpdated(); runOnboard(); } });
    else runOnboard();
  }
}

/* ---- スクロール出現 -------------------------------------------------- */
export function observeReveal() {
  const els = document.querySelectorAll(".io");
  if (!("IntersectionObserver" in window) || !els.length) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

/* ---- トースト -------------------------------------------------------- */
export function toast(msg, { icon: ic = "check" } = {}) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  const t = document.createElement("div");
  t.className = "toast c-card c-card--tight";
  t.innerHTML = `<div class="cluster" style="gap:10px;flex-wrap:nowrap">${icon(ic, { size: 18, cls: "accent-ic" })}<span>${escapeHtml(msg)}</span></div>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---- PWA: install + service worker ---------------------------------- */
let deferredPrompt = null;
function setupInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferredPrompt = e;
    document.querySelectorAll("[data-install]").forEach((b) => { b.hidden = false; });
  });
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-install]");
    if (!btn) return;
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
    else { toast("ブラウザのメニュー →「ホーム画面に追加」でアプリになります", { icon: "download" }); }
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
}

/* ---- カウントアップ -------------------------------------------------- */
export function countUp(el, to, { dur = 900, fmt = fmtInt } = {}) {
  const from = 0; const start = performance.now();
  function step(t) {
    const k = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * eased);
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
