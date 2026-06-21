/* ring-particles.js — CSS Houdini PaintWorklet
   antigravity.google 流のリングパーティクル。background: paint(ringParticles) で使う。
   対応ブラウザ(Chrome系)のみ登録され、無対応環境では CSS の @supports で読み込まれない。
   配色は --ring-color（既定: P・SPO オレンジ）。決定的乱数で再描画時もちらつかない。 */
registerPaint(
  "ringParticles",
  class {
    static get inputProperties() {
      return ["--ring-color"];
    }
    paint(ctx, size, props) {
      const color = (props.get("--ring-color") || "").toString().trim() || "rgba(255,149,80,0.5)";
      let seed = 20260621;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      const n = Math.max(12, Math.min(56, Math.floor((size.width * size.height) / 24000)));
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const x = rnd() * size.width;
        const y = rnd() * size.height;
        const r = 5 + rnd() * 42;
        ctx.globalAlpha = 0.05 + rnd() * 0.18;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        if (rnd() > 0.7) {
          ctx.globalAlpha = 0.25 + rnd() * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
);
