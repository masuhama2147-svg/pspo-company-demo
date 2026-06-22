// =============================================================================
// hero-particles.js — Antigravity流の物理パーティクルシステム（HTML5 Canvas）
//
// 仕様（先輩の実装指示書に準拠）:
//  - 反重力: ゆっくり上方向へ浮遊。値ノイズ(Perlin代替)で風のような横揺らぎ。
//  - 画面上端で消えたら下端から異なる速度・サイズ・色でリスポーン。
//  - カーソル斥力: 一定距離(既定150px)内で滑らかに反発、通過後は慣性で元の浮遊軌道へ。
//    friction 0.96 / ease 0.04 / force は距離に反比例。
//  - 60fps: requestAnimationFrame。Retina: devicePixelRatio対応。resizeはdebounce。
//  - 視界外・タブ非表示・prefers-reduced-motion では停止/静止画にフォールバック。
//  - 依存ゼロ・no-build・ES module。表示内容/配置は変えず“背景の演出”として動く。
// =============================================================================

// 軽量2D値ノイズ（風の揺らぎ用。外部ライブラリ無しで滑らかな流れ場を生成）
function makeNoise() {
  const perm = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = base[i]; base[i] = base[j]; base[j] = t; }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const grad = (h, x, y) => ((h & 1) ? x : -x) + ((h & 2) ? y : -y);
  return (x, y) => {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];
    return lerp(lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
                lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v);
  };
}

// P・SPOブランド寄りの多色パレット（白地で視認可・Antigravityの“カラフルな粒子”を踏襲）
// ※先輩指示のGoogleブランドカラーに寄せたい場合は下を差し替え可。
const PALETTE = ["#2f6bd0", "#ef7a2e", "#2fae9b", "#f3a712", "#e0563b", "#5b6b9c"];

const prefersReduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * ヒーローにパーティクルを描画する。
 * @param {HTMLCanvasElement} canvas
 * @param {{count?:number, repel?:number}} [opts]
 * @returns {() => void} 破棄関数
 */
export function mountHeroParticles(canvas, opts = {}) {
  if (!canvas || !canvas.getContext) return () => {};
  const ctx = canvas.getContext("2d");
  const noise = makeNoise();
  let W = 0, H = 0, dpr = 1;
  let particles = [];
  let raf = 0, running = false, t = 0;
  const mouse = { x: -9999, y: -9999, active: false };
  const REPEL = opts.repel || 150;        // 斥力の影響半径(px)
  const FRICTION = 0.96, EASE = 0.04;

  function targetCount() {
    if (opts.count) return opts.count;
    const area = W * H;
    // 画面積に応じて 150〜250、低performance/小画面は抑制
    const n = Math.round(area / 9000);
    const cap = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? 160 : 250;
    return Math.max(120, Math.min(cap, n));
  }

  function makeParticle(fromBottom) {
    return {
      x: Math.random() * W,
      y: fromBottom ? H + Math.random() * 60 : Math.random() * H,
      r: 1.5 + Math.random() * 2,                 // 1.5〜3.5px
      rise: 0.18 + Math.random() * 0.5,           // 上昇速度
      drift: (Math.random() - 0.5) * 0.3,         // 個体ごとの横ドリフト
      phase: Math.random() * 1000,                // ノイズ位相
      vx: 0, vy: 0,                               // カーソル斥力による速度(慣性)
      alpha: 0.3 + Math.random() * 0.5,           // 0.3〜0.8
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2); // Retina対応(2倍まで)
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const want = targetCount();
    if (particles.length === 0) particles = Array.from({ length: want }, () => makeParticle(false));
    else if (want > particles.length) for (let i = particles.length; i < want; i++) particles.push(makeParticle(true));
    else particles.length = want;
  }

  function drawStatic() { // reduced-motion: 静止フレームを1枚だけ
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.globalAlpha = p.alpha * 0.7; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function step() {
    if (!running) return;
    t += 0.004;
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      // 反重力: 上昇 ＋ 値ノイズによる横揺らぎ（風）
      const n = noise((p.x * 0.0016) + p.phase, (p.y * 0.0016) - t);
      const swayX = n * 0.6 + p.drift;
      // カーソル斥力（距離の二乗に反比例・近いほど強く弾く）
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL * REPEL) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / REPEL) * (1 - d / REPEL) * 4; // 近いほど強い
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
      }
      // 慣性＋摩擦で減衰（通過後は元の浮遊軌道へ戻る）
      p.vx *= FRICTION; p.vy *= FRICTION;
      if (Math.abs(p.vx) < 0.001) p.vx = 0;
      if (Math.abs(p.vy) < 0.001) p.vy = 0;
      p.x += swayX + p.vx;
      p.y += -p.rise + p.vy;
      // 端の処理: 上に消えたら下からリスポーン、左右はラップ
      if (p.y < -p.r - 4) Object.assign(p, makeParticle(true));
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      // 描画
      ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(step);
  }

  function start() { if (running || prefersReduced()) return; running = true; raf = requestAnimationFrame(step); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  // 入力: pointer（fine のみ反応・タッチでは斥力なし）
  const onMove = (e) => { mouse.x = e.clientX - canvas.getBoundingClientRect().left; mouse.y = e.clientY - canvas.getBoundingClientRect().top; mouse.active = true; };
  const onLeave = () => { mouse.active = false; mouse.x = mouse.y = -9999; };

  // debounceリサイズ
  let rzTimer = 0;
  const onResize = () => { clearTimeout(rzTimer); rzTimer = setTimeout(() => { resize(); if (prefersReduced()) drawStatic(); }, 150); };

  // 視界外・タブ非表示で停止（省電力・60fps維持）
  let io = null;
  const onVis = () => { if (document.hidden) stop(); else if (inView) start(); };
  let inView = true;

  resize();
  if (prefersReduced()) { drawStatic(); }
  else {
    if (matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onLeave, { passive: true });
    }
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((ents) => { inView = ents[0].isIntersecting; if (inView && !document.hidden) start(); else stop(); }, { threshold: 0 });
      io.observe(canvas);
    } else start();
  }

  // タイピングのCaret座標から粒子を上方へ“誘発”（既存粒子を再利用＝リークなし）
  function spawnBurst(clientX, clientY, n = 2) {
    if (!particles.length || prefersReduced()) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    if (x < 0 || y < 0 || x > W || y > H) return;
    for (let k = 0; k < n; k++) {
      const p = particles[(Math.random() * particles.length) | 0];
      p.x = x + (Math.random() - 0.5) * 12;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vy = -(0.6 + Math.random() * 0.9);   // 反重力方向のキック
      p.vx = (Math.random() - 0.5) * 0.6;
      p.alpha = 0.5 + Math.random() * 0.3;
      p.r = 1.2 + Math.random() * 1.4;
    }
  }
  function destroy() {
    stop();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerout", onLeave);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    if (io) io.disconnect();
  }
  return { destroy, spawnBurst };
}
