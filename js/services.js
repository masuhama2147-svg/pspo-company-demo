// =============================================================================
// services.js — 「月額一本で、これ全部」の各サービスを“実店舗数＋詳細”に接続。
// サービス・タブをタップ → 何店舗で使えるか／どの店か（実在81店舗から判定）を表示。
// 業態は店名キーワードから推定（非PII・実在ベース）。ランディングとアプリで共用。
// =============================================================================
import { GEO_STORES } from "./geo.js";
import { icon } from "./ui.js";
import { SERVICE_GROUPS } from "./pspo-info.js";
import { SERVICE_VISUALS } from "./visuals.js";

// 店名 → 提供サービス集合（キーワード推定）
export function servicesOf(name) {
  const set = new Set();
  const has = (re) => re.test(name);
  if (has(/Cafe|カフェ|Pig/i)) set.add("cafe");
  if (has(/STUDY|Study|スタディ|自習/i)) set.add("study");
  if (has(/SAUNA|サウナ/i)) set.add("sauna");
  if (has(/SPA|温泉|湯|Relax/i)) set.add("spa");
  if (has(/カラオケ/)) set.add("music");
  if (has(/WORKS|ワーク/i)) set.add("work");
  if (has(/LAUNDRY|ランドリー/i)) set.add("raundly");
  if (has(/酒場/)) set.add("sakaba");
  if (has(/うどん|砲麺|食堂|フード|Pig/i)) set.add("food");
  // ジム：専門業態でない“素の P・SPO / MEGA / mini / ダイノ”をジムとみなす
  const specialized = /Cafe|カフェ|STUDY|Study|スタディ|SAUNA|サウナ|SPA|温泉|湯|カラオケ|WORKS|ワーク|LAUNDRY|ランドリー|酒場|うどん|砲麺|食堂|BEAUTY|ビューティー|epi|アイケア|AGE-LAB|GALLERY|古着|ビリヤード|ダーツ|Lounge|Pig|Relax|NATURAL/i;
  if (/MEGA|mini|ダイノ/i.test(name) || !specialized.test(name)) set.add("gym");
  return set;
}

// 12サービス（index の SVCS と対応）。kind: stores=店舗数を出す / all=全店 / amenity=件数非表示
export const SERVICE_DEFS = [
  { id: "gym",     emoji: "🏋️", label: "ジム",       kind: "stores",  desc: "24時間ジム。30種以上のマシンが使い放題。" },
  { id: "study",   emoji: "📚", label: "自習室",     kind: "stores",  desc: "集中できる自習・スタディスペース。" },
  { id: "cafe",    emoji: "☕", label: "カフェ",     kind: "stores",  desc: "会員カフェ。作業も休憩も。" },
  { id: "sakaba",  emoji: "🍺", label: "居酒屋",     kind: "stores",  desc: "セルフ居酒屋・酒場。" },
  { id: "sauna",   emoji: "🧖", label: "サウナ",     kind: "stores",  desc: "サウナ・整い。" },
  { id: "work",    emoji: "💻", label: "ワーク",     kind: "stores",  desc: "コワーキング／電源・Wi-Fi。" },
  { id: "music",   emoji: "🎤", label: "カラオケ",   kind: "stores",  desc: "無人・無料カラオケも。" },
  { id: "spa",     emoji: "♨️", label: "SPA",        kind: "stores",  desc: "温泉・SPA。" },
  { id: "raundly", emoji: "🧺", label: "ランドリー", kind: "stores",  desc: "コインランドリー。" },
  { id: "kids",    emoji: "🧒", label: "キッズ",     kind: "amenity", desc: "キッズ対応エリア（順次拡大）。" },
  { id: "food",    emoji: "🍴", label: "フード",     kind: "stores",  desc: "うどん『砲麺』などフード業態。" },
  { id: "web",     emoji: "📱", label: "WEB入会",    kind: "all",     desc: "全店オンラインで入会・手続きまで完結。" },
];

export function defOf(id) { return SERVICE_DEFS.find((d) => d.id === id); }
export function storesForService(id) {
  if (id === "web") return GEO_STORES;
  return GEO_STORES.filter((s) => servicesOf(s.name).has(id));
}
// 件数（amenity は null＝件数を出さない）
export function serviceCount(id) {
  const d = defOf(id);
  if (!d) return 0;
  if (d.kind === "all") return GEO_STORES.length;
  if (d.kind === "amenity") return null;
  return storesForService(id).length;
}

/* ---- サービス詳細モーダル（タップで店舗数＋一覧） -------------------- */
export function openServiceDetail(id) {
  const d = defOf(id);
  if (!d || document.querySelector(".svc-overlay")) return;
  const stores = d.kind === "amenity" ? [] : storesForService(id);
  const count = serviceCount(id);
  const ov = document.createElement("div");
  ov.className = "svc-overlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", `${d.label}の詳細`);
  ov.innerHTML = `
    <div class="svc-card">
      <button class="svc-close" type="button" aria-label="閉じる">×</button>
      ${SERVICE_VISUALS[id] ? `<figure class="svc-visual" aria-hidden="true"><img src="${SERVICE_VISUALS[id]}" alt="" loading="lazy" /></figure>` : ""}
      <div class="svc-head">
        <span class="svc-emoji">${d.emoji}</span>
        <div><h3 class="svc-title">${d.label}</h3>
          <p class="svc-meta">${count != null ? `<b>${count}</b>店舗で利用可` : "対応店舗あり"} ・ ${d.desc}</p></div>
      </div>
      ${stores.length ? `<div class="svc-list">${stores.map((s) => `
        <a class="svc-row" href="area.html">
          <span class="svc-row__name">${s.name}</span>
          <span class="svc-row__area">${s.area}</span>
          <span class="svc-row__go">${icon("arrow", { size: 15 })}</span>
        </a>`).join("")}</div>`
        : `<p class="svc-empty">${d.desc} 対応店舗は順次拡大中です。</p>`}
      <a class="c-btn c-btn--primary c-btn--block" href="area.html">店舗・空きを地図で見る</a>
    </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("show"));
  document.documentElement.style.overflow = "hidden";
  const close = () => { ov.setAttribute("aria-hidden", "true"); ov.classList.remove("show"); document.documentElement.style.overflow = ""; setTimeout(() => ov.remove(), 260); };
  ov.querySelector(".svc-close").addEventListener("click", close);
  ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
  ov.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  setTimeout(() => ov.querySelector(".svc-close")?.focus(), 280);
}

/* ---- サービス・カタログ（公式の散らばった業態を“整理”して表示） -----
   6グループ × 各サービスに〈何が・どこで(店舗数)・予約要否・条件〉。 */
const RESV = { "不要": ["予約不要", "ok"], "推奨": ["予約推奨", "mod"], "要": ["要予約", "req"], "確認": ["要確認", "mod"] };
function reserveBadge(r) { const [t, k] = RESV[r] || ["", "mod"]; return `<span class="cat-resv cat-resv--${k}">${t}</span>`; }

export function renderServiceCatalog(el) {
  el.innerHTML = SERVICE_GROUPS.map((g) => `
    <section class="cat-group">
      <h3 class="cat-group__h"><span class="cat-group__emoji">${g.emoji}</span>${g.label}</h3>
      <div class="cat-list">
        ${g.services.map((s) => {
          const cnt = s.match ? storesForService(s.match).length : null;
          return `<div class="cat-row">
            <div class="cat-row__main">
              <div class="cat-row__name">${s.label}${cnt != null ? `<span class="cat-row__cnt">${cnt}店舗</span>` : ""}</div>
              <div class="cat-row__what">${s.what}</div>
              ${s.note ? `<div class="cat-row__note">${icon("warn", { size: 12 })}<span>${s.note}</span></div>` : ""}
            </div>
            ${reserveBadge(s.reserve)}
          </div>`;
        }).join("")}
      </div>
    </section>`).join("");
}

// サービス・グリッドを描画（公式アイコン or 絵文字＋件数バッジ）。タップで詳細。
export function renderServiceGrid(el, officialIcons = {}) {
  el.innerHTML = SERVICE_DEFS.map((d) => {
    const url = officialIcons[d.id];
    const ic = url ? `<img src="${url}" alt="" width="30" height="30" loading="lazy" onerror="this.replaceWith(document.createTextNode('${d.emoji}'))" />` : d.emoji;
    const c = serviceCount(d.id);
    const badge = c != null ? `<span class="c-svc__count">${c}店舗</span>` : "";
    return `<button class="c-svc c-svc--tap" data-svc="${d.id}" type="button" aria-label="${d.label}の詳細（${c != null ? c + "店舗" : "対応店舗あり"}）">
      ${SERVICE_VISUALS[d.id] ? `<span class="c-svc__media" aria-hidden="true"><img src="${SERVICE_VISUALS[d.id]}" alt="" loading="lazy" /></span>` : ""}
      <div class="c-svc__ic">${ic}</div><div class="c-svc__t">${d.label}</div>${badge}</button>`;
  }).join("");
  el.querySelectorAll("[data-svc]").forEach((b) => b.addEventListener("click", () => openServiceDetail(b.dataset.svc)));
}
