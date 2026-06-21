// =============================================================================
// reels.js — 公式Instagram（@pspo.ehime）のリールを自己ホストし、
//            antigravity流の「無重力リールショーケース」で再生する。
//
// 方針（一次情報整合・no-build・軽量）:
//  - 動画は権利者（P・SPOカンパニー）許諾済みのリールを 540p・無音・faststart に
//    最適化して assets/reels/web/ に自己ホスト（IGのCDN URLは署名付きで失効するため）。
//  - 自動再生は muted + playsinline のみ（ブラウザ規約準拠）。視野に入った時だけ
//    再生し、外れたら一時停止（電池・通信の節約 / Doherty）。
//  - prefers-reduced-motion / Save-Data では自動再生せず poster 静止にフォールバック。
//  - 焼き込み字幕を持つ縦動画ゆえ、背景敷きではなく 9:16 タイルとして“見せる”。
// =============================================================================

const BASE = "assets/reels/web/";

// リール定義（pillar/note は焼き込み字幕・公式プロフィールと整合。誇張しない）。
export const REELS = [
  { id: "DVYEVb1ERVf", pillar: "ジム・自習室・ボルダリング", note: "30種類以上が、月額一本で。", tone: "active" },
  { id: "DG5jIdtzjOe", pillar: "この街を、日本一のテーマパークに", note: "構想とワクワクを、リールで公開中。", tone: "brand" },
  { id: "DZ1LulDhzM8", pillar: "セルフマシンピラティス", note: "初心者でも安心。無料で使い放題。", tone: "wellness" },
];

export const REEL_IG_URL = "https://www.instagram.com/pspo.ehime/";

const prefersReduced = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wantsLessData = () =>
  navigator.connection && navigator.connection.saveData === true;

/**
 * リールショーケースを描画する。
 * @param {HTMLElement} el  マウント先
 * @param {{reels?: typeof REELS, igUrl?: string}} [opts]
 */
export function mountReelShowcase(el, { reels = REELS, igUrl = REEL_IG_URL } = {}) {
  if (!el) return;
  const still = prefersReduced() || wantsLessData(); // 静止フォールバック

  el.innerHTML = `
    <div class="reel-stage" role="list">
      ${reels.map((r, i) => tileHtml(r, i)).join("")}
    </div>
    <p class="reel-foot">
      <a class="link-accent" href="${igUrl}" target="_blank" rel="noopener">公式Instagram @pspo.ehime でもっと見る</a>
    </p>`;

  el.querySelectorAll(".reel-tile").forEach((tileEl) => {
    const v = tileEl.querySelector("video");
    const btn = tileEl.querySelector(".reel-tile__toggle");
    if (!v || !btn) return;

    const sync = () => {
      const playing = !v.paused && !v.ended;
      btn.setAttribute("aria-label", playing ? "リールを一時停止" : "リールを再生");
      tileEl.classList.toggle("is-playing", playing);
    };
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);

    // クリック/タップで再生・停止（ユーザー制御＝アクセシビリティ）
    btn.addEventListener("click", () => {
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    });

    if (still) { sync(); return; } // 自動再生しない（poster静止）

    // 視野に入ったら再生・外れたら一時停止
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }),
        { threshold: 0.55 }
      );
      io.observe(tileEl);
    } else {
      v.play().catch(() => {});
    }
    sync();
  });
}

function tileHtml(r, i) {
  const src = `${BASE}${r.id}-loop.mp4`;
  const poster = `${BASE}${r.id}-poster.jpg`;
  // 外側 .io = スクロール出現 / 内側 .reel-tile__frame .levitate = 無重力浮遊（責務分離）
  return `
  <figure class="reel-tile io" role="listitem" data-tone="${r.tone}" style="--i:${i}">
    <div class="reel-tile__frame levitate">
      <video class="reel-tile__media" muted loop playsinline preload="none"
             poster="${poster}" aria-label="P・SPO公式リール：${r.pillar}">
        <source src="${src}" type="video/mp4" />
      </video>
      <span class="reel-tile__badge" aria-hidden="true">▶ REEL</span>
      <button class="reel-tile__toggle" type="button" aria-label="リールを再生"></button>
    </div>
    <figcaption class="reel-tile__cap">
      <b>${r.pillar}</b>
      <span>${r.note}</span>
    </figcaption>
  </figure>`;
}
