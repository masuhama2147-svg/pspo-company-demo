// cine.js — シネマティック面(Tier A)の演出を有効化する最小JS。
// (1) Houdini PaintWorklet（リング粒子）の登録（対応時のみ）
// (2) カーソル追従光: マウス位置を CSS 変数 --mx/--my に同期（rAF スロットル）
// すべて非対応・タッチ・reduced-motion で安全に無効化される。no-build / ES module。

if (typeof CSS !== "undefined" && CSS.paintWorklet && typeof CSS.paintWorklet.addModule === "function") {
  try { const p = CSS.paintWorklet.addModule("assets/ring-particles.js"); if (p && p.catch) p.catch(() => {}); } catch (_) { /* 非対応は無視 */ }
}

const mm = (q) => typeof matchMedia === "function" && matchMedia(q).matches;

if (mm("(pointer: fine)") && !mm("(prefers-reduced-motion: reduce)")) {
  let raf = 0;
  let mx = (typeof innerWidth === "number" ? innerWidth : 0) / 2;
  let my = 0;
  const apply = () => {
    raf = 0;
    document.body.style.setProperty("--mx", mx + "px");
    document.body.style.setProperty("--my", my + "px");
  };
  addEventListener(
    "pointermove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    },
    { passive: true }
  );
}
