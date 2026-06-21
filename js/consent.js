// =============================================================================
// consent.js — データ共有の“同意”管理（高い倫理＝オプトイン＋いつでもオプトアウト）
// 位置情報・匿名集計の利用を、目的を明示して本人が選ぶ。拒否でも全機能が使える。
// 透明性：何のために・どう匿名化されるかを示し、data.html(倫理憲章)へ繋ぐ。すべてローカル。
// =============================================================================
import { icon, toast } from "./ui.js";

const KEY = "sukima-consent";
export function getConsent() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } }
export function setConsent(patch) { const c = { ...getConsent(), ...patch, at: Date.now() }; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} return c; }
export function hasLocationConsent() { return !!getConsent().location; }
export function hasAnalyticsConsent() { return !!getConsent().analytics; }

// 同意シート（目的明示・2トグル・オプトアウト）
export function showConsentSheet({ onChange, focus = "location" } = {}) {
  if (document.querySelector(".consent-overlay")) return;
  const c = getConsent();
  const ov = document.createElement("div");
  ov.className = "consent-overlay";
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "データ共有の同意");
  ov.innerHTML = `
    <div class="consent-card">
      <button class="svc-close" type="button" aria-label="閉じる">×</button>
      <div class="consent-head"><span class="consent-ic">${icon("shield", { size: 26 })}</span>
        <div><h3 class="svc-title">データの共有（任意）</h3>
          <p class="svc-meta">あなたが選べます。<b>拒否しても、アプリの全機能は使えます。</b>いつでも変更できます。</p></div></div>

      <div class="consent-row">
        <div class="consent-row__txt"><b>📍 位置情報を共有</b>
          <p>PSPO近くの施設レコメンドに使います。<b>本人同意時のみ・粗い粒度・常時追跡なし</b>。</p></div>
        <button class="c-switch" id="cLoc" role="switch" aria-checked="${!!c.location}" aria-label="位置情報を共有"><span class="c-switch__track"><span class="c-switch__thumb"></span></span></button>
      </div>
      <div class="consent-row">
        <div class="consent-row__txt"><b>📊 匿名・集計での活用</b>
          <p>個人を特定しない集計（人数・人流）として、松山のまちづくり(EBPM)に役立てます。<b>k-匿名化・差分プライバシー</b>で再識別を防止。</p></div>
        <button class="c-switch" id="cAna" role="switch" aria-checked="${!!c.analytics}" aria-label="匿名集計での活用"><span class="c-switch__track"><span class="c-switch__thumb"></span></span></button>
      </div>

      <div class="c-callout c-callout--ok" style="margin-top:14px"><span class="c-callout__icon">${icon("check", { size: 16 })}</span><div class="c-callout__body" style="font-size:.82rem">顧客画面に出るのは常に<b>集計だけ（非PII）</b>。顔・個票は持ちません。<a href="data.html" style="color:var(--accent)">データの使われ方・倫理憲章</a></div></div>

      <div class="consent-foot">
        <button class="c-btn c-btn--subtle c-btn--block" id="cLater" type="button">あとで</button>
        <button class="c-btn c-btn--primary c-btn--block c-btn--xl" id="cSave" type="button">この設定で続ける</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("show"));
  document.documentElement.style.overflow = "hidden";
  // 初期トグルは“保存済みの値”を反映（既定はオフ）。明示的な肯定操作でのみオンにする（APPI＝affirmative consent）。
  const state = { location: !!c.location, analytics: !!c.analytics };
  const sync = () => {
    ov.querySelector("#cLoc").setAttribute("aria-checked", state.location);
    ov.querySelector("#cAna").setAttribute("aria-checked", state.analytics);
  };
  sync();
  ov.querySelector("#cLoc").addEventListener("click", () => { state.location = !state.location; sync(); });
  ov.querySelector("#cAna").addEventListener("click", () => { state.analytics = !state.analytics; sync(); });
  const close = () => { ov.setAttribute("aria-hidden", "true"); ov.classList.remove("show"); document.documentElement.style.overflow = ""; setTimeout(() => ov.remove(), 260); };
  ov.querySelector(".svc-close").addEventListener("click", close);
  ov.querySelector("#cLater").addEventListener("click", close);
  ov.querySelector("#cSave").addEventListener("click", () => {
    setConsent({ location: state.location, analytics: state.analytics });
    close(); toast(state.location ? "位置情報をオンにしました（いつでも変更可）" : "設定を保存しました", { icon: "check" });
    onChange && onChange(getConsent());
  });
  ov.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Tab") { // フォーカストラップ（モーダル外へ出さない）
      const f = ov.querySelectorAll('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  setTimeout(() => ov.querySelector("#cSave")?.focus(), 280);
}
