// =============================================================================
// typing.js — Smooth Typing（AIライクな変速タイピング）。先輩の実装指示書に準拠。
//
//  - レイアウト崩れ防止: 透過ゴースト(全文)で領域を先に確保し、その上に実表示の
//    actor を絶対配置で重ねる（中央揃えでも折返し・高さがブレない）。
//  - 変速リズム: 通常30〜45ms / 区切り(空白)+60〜90ms / 節目(、。,.等)+200〜300ms。
//  - Caret: タイピング中は常時点灯、完了0.3s後に滑らかな点滅へ（CSS）。
//  - a11y: 要素に完成テキストを aria-label + role=text（読み上げは一文として）。
//  - reduced-motion: 即時フル表示。IntersectionObserverで視界に入ってから開始可。
//  - 依存ゼロ・no-build・ES module。onChar フックで Caret 座標を通知（パーティクル誘発用）。
// =============================================================================

const reduce = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 1文字ごとの変速ディレイ（人間/AIらしい揺らぎ）
function delayFor(ch) {
  if (/[、。，．,.！？!?…—]/.test(ch)) return 200 + Math.random() * 100; // 節目＝思考の間
  if (/[\s　・「」（）()]/.test(ch)) return 60 + Math.random() * 30;       // 区切り
  return 30 + Math.random() * 15;                                        // 通常（高速）
}

/**
 * 要素のテキストを Smooth Typing で表示する。
 * @param {HTMLElement} el  対象（textContent をターゲット文に使う）
 * @param {{startOnView?:boolean, startDelay?:number, onChar?:(rect:DOMRect)=>void}} [opts]
 */
export function smoothType(el, opts = {}) {
  if (!el || el.dataset.typed) return;
  const full = (el.textContent || "").replace(/\s+/g, " ").trim();
  if (!full) return;
  el.dataset.typed = "1";
  el.setAttribute("aria-label", full);
  el.setAttribute("role", "text");
  el.classList.add("type-host");
  // ゴースト(領域確保) + actor(実表示・絶対配置)
  el.innerHTML =
    `<span class="type-ghost" aria-hidden="true">${esc(full)}</span>` +
    `<span class="type-actor" aria-hidden="true"></span>`;
  const actor = el.querySelector(".type-actor");

  // reduced-motion: 即フル表示（Caretのみ完了状態）
  if (reduce()) {
    actor.innerHTML = `${esc(full)}<i class="type-caret type-caret--done" aria-hidden="true"></i>`;
    return;
  }

  const { startDelay = 320, startOnView = true, onChar } = opts;
  let i = 0;
  function render(done) {
    const caretCls = done ? "type-caret type-caret--done" : "type-caret";
    actor.innerHTML = `${esc(full.slice(0, i))}<i class="${caretCls}" aria-hidden="true"></i>`;
  }
  function step() {
    if (i >= full.length) { render(true); return; }
    i++;
    render(false);
    if (onChar) {
      const c = actor.querySelector(".type-caret");
      if (c) onChar(c.getBoundingClientRect());
    }
    setTimeout(step, delayFor(full[i - 1]));
  }
  render(false);                 // 開始時にCaretだけ表示
  const begin = () => setTimeout(step, startDelay);

  if (startOnView && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((ents) => {
      if (ents[0].isIntersecting) { io.disconnect(); begin(); }
    }, { threshold: 0.55 });
    io.observe(el);
  } else {
    begin();
  }
}

/** 複数要素へ順に適用（headings 等） */
export function smoothTypeAll(els, opts = {}) {
  els.forEach((el) => smoothType(el, opts));
}
