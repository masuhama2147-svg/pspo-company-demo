// =============================================================================
// auth.js — ワンタップ・ログイン（擬似）＋ PWA完結（外部ブラウザへ遷移しない）
// 現行PSPOの痛み: マイページが別SaaS(hacomono)で“外部ブラウザに蹴り出される”。
// ここでは「アプリ内で1タップ完結」を実証する。すべてローカル(localStorage)・PII無し。
// 人間工学: 主要ボタンは下部・56px(Fitts)、選択肢は最小(Hick)、押下に即時反応(Doherty)。
// =============================================================================
import { icon, toast, escapeHtml } from "./ui.js";

const AUTH_KEY = "sukima-auth";
const SKIP_KEY = "sukima-auth-skipped"; // セッション中のみ（次回起動でまた歓迎する）
let _menuCloser = null; // アカウントメニューの外側クリック・リスナー（多重登録を防ぐ）

export function getAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch (e) { return null; }
}
export function setAuth(a) { try { localStorage.setItem(AUTH_KEY, JSON.stringify(a)); } catch (e) {} }
export function logout() { try { localStorage.removeItem(AUTH_KEY); } catch (e) {} }
function skippedThisSession() { try { return sessionStorage.getItem(SKIP_KEY) === "1"; } catch (e) { return false; } }
function markSkipped() { try { sessionStorage.setItem(SKIP_KEY, "1"); } catch (e) {} }

/* ---- ヘッダのアカウント・ボタン ------------------------------------- */
export function accountButtonHTML() {
  const a = getAuth();
  if (a) {
    const initial = escapeHtml((a.name || a.phone || "U").trim().slice(-1) || "あ");
    return `<button id="acctBtn" class="acct-btn is-in" aria-label="アカウント"><span class="acct-av">${initial}</span></button>`;
  }
  return `<button id="acctBtn" class="acct-btn" aria-label="ログイン">${icon("user", { size: 18 })}<span>ログイン</span></button>`;
}
export function wireAccount({ onChange } = {}) {
  const btn = document.getElementById("acctBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const a = getAuth();
    if (!a) { showLogin({ onSuccess: onChange }); return; }
    // ログイン済み → 簡易メニュー（ログアウト）
    openAccountMenu(btn, onChange);
  });
}

function openAccountMenu(anchor, onChange) {
  if (_menuCloser) { document.removeEventListener("click", _menuCloser); _menuCloser = null; }
  document.querySelector(".acct-menu")?.remove();
  const a = getAuth();
  const menu = document.createElement("div");
  menu.className = "acct-menu c-card c-card--tight";
  menu.innerHTML = `
    <div class="acct-menu__id">${icon("user", { size: 16 })} <b>${escapeHtml(a.name || a.phone || "会員")}</b></div>
    <a class="c-btn c-btn--ghost c-btn--sm c-btn--block" href="me.html">マイページ</a>
    <button class="c-btn c-btn--subtle c-btn--sm c-btn--block" id="acctLogout">ログアウト</button>`;
  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = `${r.bottom + 8}px`;
  menu.style.right = `${Math.max(12, window.innerWidth - r.right)}px`;
  const close = (e) => { if (!menu.contains(e.target) && e.target !== anchor) { menu.remove(); document.removeEventListener("click", close); _menuCloser = null; } };
  _menuCloser = close;
  setTimeout(() => document.addEventListener("click", close), 0);
  menu.querySelector("#acctLogout").addEventListener("click", () => {
    logout(); menu.remove(); document.removeEventListener("click", close); _menuCloser = null; toast("ログアウトしました"); onChange && onChange();
  });
}

/* ---- ログイン・オーバーレイ（ワンタップ・歓迎画面） ----------------- */
export function showLogin({ onSuccess, allowSkip = true } = {}) {
  if (document.querySelector(".auth-overlay")) return;
  const ov = document.createElement("div");
  ov.className = "auth-overlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "ログイン");
  ov.innerHTML = `
    <div class="auth-card">
      ${allowSkip ? `<button class="auth-skip" data-skip type="button">ゲストで見る ›</button>` : ""}
      <div class="auth-brand"><span class="brand__logo brand__logo--lg" role="img" aria-label="P・SPO"></span></div>
      <h2 class="auth-title">ようこそ。<br><span class="text-accent">1タップ</span>で、はじめる。</h2>
      <p class="auth-sub">${icon("shield", { size: 15 })} アプリ内で完結。<b>外部ブラウザには移動しません。</b></p>
      <label class="auth-field">
        <span class="auth-field__label">電話番号</span>
        <input id="authPhone" class="auth-input" type="tel" inputmode="numeric" autocomplete="tel" placeholder="090 1234 5678" aria-label="電話番号" />
      </label>
      <button class="c-btn c-btn--primary c-btn--block c-btn--xl" id="authLogin" type="button">ログイン</button>
      <div class="auth-or"><span>または</span></div>
      <button class="c-btn c-btn--block c-btn--xl" id="authPasskey" type="button">${icon("shield", { size: 18 })} パスキーで続ける</button>
      <p class="auth-note">デモ用の擬似ログインです（実際の認証・通信は行いません）。</p>
    </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("show"));
  document.documentElement.style.overflow = "hidden";

  const close = () => { ov.setAttribute("aria-hidden", "true"); ov.classList.remove("show"); document.documentElement.style.overflow = ""; setTimeout(() => ov.remove(), 280); };
  const succeed = (auth) => { setAuth(auth); close(); toast("ログインしました", { icon: "check" }); onSuccess && onSuccess(); };

  const phoneEl = ov.querySelector("#authPhone");
  ov.querySelector("#authLogin").addEventListener("click", () => {
    const phone = (phoneEl.value || "").trim();
    succeed({ phone: phone || "ゲスト会員", method: "phone", at: Date.now() });
  });
  ov.querySelector("#authPasskey").addEventListener("click", () => succeed({ name: "あなた", method: "passkey", at: Date.now() }));
  phoneEl.addEventListener("keydown", (e) => { if (e.key === "Enter") ov.querySelector("#authLogin").click(); });
  const skipBtn = ov.querySelector("[data-skip]");
  if (skipBtn) skipBtn.addEventListener("click", () => { markSkipped(); close(); onSuccess && onSuccess(); });
  // Esc=スキップ可能時のみ（ゲスト継続）／ Tab はオーバーレイ内に閉じ込める（focus trap）
  ov.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && skipBtn) { skipBtn.click(); return; }
    if (e.key === "Tab") {
      const f = ov.querySelectorAll('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  setTimeout(() => phoneEl.focus(), 320);
}

// 初回ブート時の判定: 未ログイン＆本セッションでスキップしていなければ歓迎する
export function shouldWelcome() { return !getAuth() && !skippedThisSession(); }
