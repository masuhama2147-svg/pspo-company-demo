// =============================================================================
// viz.js — SVG データビジュアライズ部品（純関数・文字列返し・レスポンシブ）
// 経営AI/データ戦略ページのチャートを“本物の計算結果”から描く。
// すべて viewBox ベース＝width:100% で PC/スマホ両対応。色は CSS 変数を使用。
// =============================================================================

const fmtInt = (n) => Math.round(n).toLocaleString("ja-JP");
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* ---- 生存曲線（複数コホート・継続率） -------------------------------- */
export function survivalChart(series, { w = 600, h = 300, maxT = 24 } = {}) {
  const pad = { l: 42, r: 14, t: 14, b: 34 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const x = (t) => pad.l + (t / maxT) * iw;
  const y = (s) => pad.t + (1 - s) * ih;
  const grid = [0, .25, .5, .75, 1].map((g) =>
    `<line x1="${pad.l}" y1="${y(g)}" x2="${w - pad.r}" y2="${y(g)}" class="viz-grid"/><text x="${pad.l - 8}" y="${y(g) + 4}" class="viz-axis" text-anchor="end">${g * 100}%</text>`).join("");
  const xticks = [0, 6, 12, 18, 24].filter((t) => t <= maxT).map((t) =>
    `<text x="${x(t)}" y="${h - 12}" class="viz-axis" text-anchor="middle">${t}</text>`).join("");
  const lines = series.map((sr) => {
    const d = sr.curve.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.s).toFixed(1)}`).join(" ");
    const med = `<line x1="${x(sr.median)}" y1="${pad.t}" x2="${x(sr.median)}" y2="${pad.t + ih}" stroke="${sr.color}" stroke-opacity=".35" stroke-dasharray="2 3"/>`;
    return `${med}<path d="${d}" fill="none" stroke="${sr.color}" stroke-width="2.5" ${sr.dashed ? 'stroke-dasharray="5 4"' : ""} stroke-linecap="round"/>`;
  }).join("");
  return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="継続率の生存曲線">
    <text x="${pad.l}" y="11" class="viz-axislbl">継続率</text>
    <text x="${w - pad.r}" y="${h - 12}" class="viz-axis" text-anchor="end">月→</text>
    ${grid}${xticks}${lines}</svg>`;
}

/* ---- 需要平準化（現状 vs オフピーク誘導後・24h） --------------------- */
export function demandChart(now, smoothed, { w = 600, h = 240 } = {}) {
  const pad = { l: 30, r: 12, t: 12, b: 26 }, n = now.length;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const bw = iw / n;
  const bars = now.map((v, i) => {
    const sx = pad.l + i * bw, sv = smoothed[i];
    const yNow = pad.t + (1 - v) * ih, ySm = pad.t + (1 - sv) * ih;
    const nowH = (pad.t + ih) - yNow, smH = (pad.t + ih) - ySm;
    return `<rect x="${sx + bw * .15}" y="${yNow}" width="${bw * .7}" height="${Math.max(0, nowH)}" class="viz-bar-now" rx="1.5"/>
            <rect x="${sx + bw * .15}" y="${ySm}" width="${bw * .7}" height="${Math.max(0, smH)}" class="viz-bar-smooth" rx="1.5"/>`;
  }).join("");
  const ticks = [0, 6, 12, 18].map((hh) => `<text x="${pad.l + hh * bw + bw / 2}" y="${h - 8}" class="viz-axis" text-anchor="middle">${hh}時</text>`).join("");
  return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="需要平準化">${bars}${ticks}</svg>`;
}

/* ---- 横棒（人流inflow・出店スコア・分布） ---------------------------- */
export function barChart(items, { w = 600, max = null, unit = "", color = "var(--accent)", hot = null } = {}) {
  const m = max ?? Math.max(...items.map((d) => d.value), 1);
  const rowH = 34, h = items.length * rowH + 8, lblW = 132, barX = lblW + 8, barW = w - barX - 64;
  const rows = items.map((d, i) => {
    const yy = i * rowH + 8, len = (d.value / m) * barW;
    const c = d.color || (hot && i === 0 ? hot : color);
    return `<text x="${lblW}" y="${yy + 14}" class="viz-rowlbl" text-anchor="end">${esc(d.label)}</text>
      <rect x="${barX}" y="${yy + 4}" width="${Math.max(2, len)}" height="16" rx="4" fill="${c}"/>
      <text x="${barX + Math.max(2, len) + 6}" y="${yy + 17}" class="viz-rowval">${fmtInt(d.value)}${unit}</text>`;
  }).join("");
  return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="棒グラフ">${rows}</svg>`;
}

/* ---- 人流ヒートグリッド（エリア×時間 or 値の濃淡） ------------------- */
export function heatGrid(cells, { cols = 6, levels = 5 } = {}) {
  const max = Math.max(...cells.map((c) => c.value), 1);
  return `<div class="viz-heat" style="--cols:${cols}">${cells.map((c) => {
    const lvl = Math.min(levels - 1, Math.floor((c.value / max) * levels));
    return `<div class="viz-heat__cell" data-lvl="${lvl}" title="${esc(c.label)}: ${fmtInt(c.value)}"><span>${esc(c.label)}</span><b>${fmtInt(c.value)}</b></div>`;
  }).join("")}</div>`;
}

/* ---- 凡例 ------------------------------------------------------------ */
export function legend(items) {
  return `<div class="viz-legend">${items.map((i) =>
    `<span class="viz-legend__item"><span class="viz-legend__sw" style="background:${i.color}${i.dashed ? ";border:1px dashed " + i.color + ";background:transparent" : ""}"></span>${esc(i.label)}${i.note ? `<small>${esc(i.note)}</small>` : ""}</span>`).join("")}</div>`;
}
