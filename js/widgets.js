// =============================================================================
// widgets.js — 再利用ウィジェット
//  - イベント/広告ティッカー（右→左）
//  - 空き状況マップ：実在81店舗（pspo.jp/area/ 由来＋Nominatim座標）を
//    Google Maps（キー設定時）でクラスタリング表示。タップでボトムシート。
//    UI/UXは Google Maps / Uber / Airbnb / Yelp の定番（クラスタ＋ボトムカード＋
//    現在地FAB＋fitBounds＋ミュートした地図ベース）を踏襲。キー無し/失敗時はリスト。
//  - 店舗検索（実在店舗を名前・エリアで絞り込み）
// occupancyは本デモのダミー（位置は実在）。非PII。
// =============================================================================
import { icon } from "./ui.js";
import { EVENTS } from "./insights.js";
import { levelOf, GOOGLE_MAPS } from "./config.js";
// 地図・検索は geo.js の補正済み座標（GEO_STORES）を単一の真実源にする。
// stores-real.js の生座標は多くがダミー同点のため、geo.js で住所→地区座標に補正する。
import { GEO_STORES as REAL_STORES, homeView, haversineKm } from "./geo.js";

/* ---- 疑似占有率（実測ではない・店舗名＋時刻で決定論的） -------------- */
const HOUR_CURVE = [.15,.12,.1,.1,.12,.2,.4,.62,.55,.5,.45,.42,.48,.44,.4,.45,.55,.68,.82,.86,.8,.62,.45,.3];
function hashName(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }
export function simRatio(store){
  const base = HOUR_CURVE[new Date().getHours()];
  const jitter = ((hashName(store.name) % 1000) / 1000 - 0.5) * 0.34;
  return Math.max(0.05, Math.min(0.98, base + jitter));
}
export const STORE_AREAS = ["すべて", ...Array.from(new Set(REAL_STORES.map((s) => s.area)))];
function dirUrl(s){ return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.addr || (s.lat+","+s.lng))}`; }

/* ---- イベント/広告ティッカー -------------------------------------- */
export function renderEventTicker(el) {
  const row = EVENTS.map((e) => `<span class="c-events__item"><span class="c-events__tag">${e.tag}</span>${e.text}</span>`).join("");
  el.innerHTML = `<div class="c-events" role="region" aria-label="お知らせ">
      <span class="c-events__pin">${icon("bell", { size: 14 })}</span>
      <div class="c-events__viewport"><div class="c-events__track">${row}${row}${row}</div></div></div>`;
}

/* ---- マップ：Googleマップ（キー有）/ リスト（フォールバック） ------- */
export function renderMap(el, opts = {}) {
  if (GOOGLE_MAPS.apiKey && !el.__noGoogle) renderGoogleMap(el, opts);
  else renderListFallback(el, opts);
}

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
let gmapsPromise = null;
function loadGoogleMaps() {
  if (window.google && window.google.maps) return Promise.resolve();
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise((resolve, reject) => {
    window.__sukimaGmapsReady = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS.apiKey)}&callback=__sukimaGmapsReady&loading=async`;
    s.async = true; s.defer = true; s.onerror = reject; document.head.appendChild(s);
  });
  return gmapsPromise;
}
// 地図ベースを淡く（色付きピンを目立たせる＝地図UXの定石）
const MAP_STYLE = [
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "water", stylers: [{ color: "#bfe6f4" }] },
  { featureType: "landscape", stylers: [{ color: "#fbf5ec" }] },
];
function pinIcon(g, color){ return { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }; }

function renderGoogleMap(el, { onPick } = {}) {
  if (el.__built) { if (el.__refresh) el.__refresh(); return; }
  el.__built = true;
  el.classList.add("c-map");
  el.innerHTML = `<div class="c-gmap"></div>${LEGEND_HTML}
    <button class="c-map__fab" type="button" aria-label="現在地へ">${icon("target",{size:20})}</button>
    <div class="c-map__sheet" id="${el.id||'map'}-sheet" hidden></div>`;
  loadGoogleMaps().then(() => loadScript("https://unpkg.com/@googlemaps/markerclusterer@2.5.3/dist/index.min.js").catch(()=>{}))
    .then(() => buildGoogleMap(el, onPick))
    .catch(() => { el.__built = false; el.__noGoogle = true; renderListFallback(el, { onPick }); });
}
function buildGoogleMap(el, onPick) {
  const g = window.google;
  const map = new g.maps.Map(el.querySelector(".c-gmap"), {
    center: GOOGLE_MAPS.center, zoom: GOOGLE_MAPS.zoom, styles: MAP_STYLE,
    mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false,
    gestureHandling: "greedy",
  });
  const sheet = el.querySelector(".c-map__sheet");
  const bounds = new g.maps.LatLngBounds();
  const markers = REAL_STORES.map((s) => {
    const lv = levelOf(simRatio(s));
    const m = new g.maps.Marker({ position: { lat: s.lat, lng: s.lng }, icon: pinIcon(g, lv.color), title: s.name });
    m.__store = s;
    m.addListener("click", () => openSheet(sheet, s, () => map.panTo({ lat: s.lat, lng: s.lng })));
    // fitBounds は愛媛圏（大多数）に合わせる。北海道・愛知の遠隔店はズームアウトで到達。
    if (s.lng > 131 && s.lng < 134 && s.lat > 32 && s.lat < 35) bounds.extend(m.getPosition());
    return m;
  });
  if (window.markerClusterer) new window.markerClusterer.MarkerClusterer({ map, markers });
  else markers.forEach((m) => m.setMap(map));
  // 登録エリアがあればそこへズーム（松山登録→松山／今治記録→今治）。無ければ愛媛全体にフィット。
  const hv = homeView();
  if (hv) { map.setCenter(hv.center); map.setZoom(hv.zoom); }
  else if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
  else { map.setCenter(GOOGLE_MAPS.center); map.setZoom(GOOGLE_MAPS.zoom); }
  // 現在地FAB
  el.querySelector(".c-map__fab").addEventListener("click", () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      const ll = { lat: p.coords.latitude, lng: p.coords.longitude };
      new g.maps.Marker({ position: ll, map, icon: { path: g.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#2b6cff", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 } });
      map.panTo(ll); map.setZoom(13);
    }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
  });
  el.__refresh = () => markers.forEach((m) => m.setIcon(pinIcon(g, levelOf(simRatio(m.__store)).color)));
}
function openSheet(sheet, s, onShow) {
  const r = simRatio(s); const lv = levelOf(r);
  sheet.innerHTML = `
    <button class="c-map__sheet-x" aria-label="閉じる">×</button>
    <div class="c-map__sheet-lvl" data-level="${lv.id}"><span class="c-dot"></span>${lv.label}・${Math.round(r*100)}%</div>
    <div class="c-map__sheet-name">${s.name}</div>
    <div class="c-map__sheet-addr">${s.area}｜${s.addr}</div>
    <div class="c-map__sheet-cta">
      <a class="c-btn c-btn--primary c-btn--sm" href="${dirUrl(s)}" target="_blank" rel="noopener">${icon('arrow',{size:16})} 経路</a>
      <a class="c-btn c-btn--ghost c-btn--sm" href="live.html">空き状況デモ</a>
    </div>`;
  sheet.hidden = false; sheet.classList.add("show");
  sheet.querySelector(".c-map__sheet-x").addEventListener("click", () => { sheet.classList.remove("show"); sheet.hidden = true; });
  if (onShow) onShow();
}
const LEGEND_HTML = `<div class="c-map__legend">
  <span data-level="free"><span class="c-dot"></span>空き</span>
  <span data-level="moderate"><span class="c-dot"></span>適</span>
  <span data-level="busy"><span class="c-dot"></span>混</span>
  <span data-level="full"><span class="c-dot"></span>満</span></div>`;

// キー無し/失敗時：エリア別の店舗リスト（破綻しない素朴なフォールバック）
function renderListFallback(el) {
  const byArea = {};
  REAL_STORES.forEach((s) => { (byArea[s.area] ||= []).push(s); });
  // 登録エリアを先頭へ（ホーム中心に近いエリア順）。
  const hv = homeView();
  let areas = Object.keys(byArea);
  if (hv) areas.sort((a, b) => haversineKm(hv.center, byArea[a][0]) - haversineKm(hv.center, byArea[b][0]));
  el.classList.add("c-maplist");
  el.innerHTML = `<div class="c-callout c-callout--privacy" style="margin-bottom:12px"><span class="c-callout__icon">${icon("data",{size:18})}</span><div class="c-callout__body">${hv ? "あなたの登録エリアを上に表示しています。" : `実在${REAL_STORES.length}店舗の一覧（位置は実在）。`}</div></div>` +
    areas.map((area) => { const list = byArea[area]; return `<div class="c-maplist__group"><h4 class="c-maplist__area">${area}（${list.length}）</h4>${list.map(storeRow).join("")}</div>`; }).join("");
}
function storeRow(s){ const r=simRatio(s); const lv=levelOf(r);
  return `<a class="c-srow" href="${dirUrl(s)}" target="_blank" rel="noopener"><span class="c-dot" data-level="${lv.id}" style="--lv:var(--lv-${lv.id})"></span><span class="c-srow__name">${s.name}</span><span class="c-srow__area">${s.area}</span><span class="c-srow__go">${icon('arrow',{size:15})}</span></a>`;
}

/* ---- 店舗検索（実在店舗を名前・エリアで絞り込み） ------------------- */
export function renderStoreSearch(el, { onChange } = {}) {
  el.innerHTML = `<div class="c-search"><span class="c-search__ic">${icon("pulse", { size: 18 })}</span>
      <input id="storeQuery" class="c-search__input" type="search" inputmode="search" placeholder="店名・住所・エリアで検索（例: 大街道 / サウナ / 西条）" aria-label="店舗を検索" /></div>
    <div class="c-tag-row" id="areaChips" role="group" aria-label="エリアで絞り込み" style="margin-top:10px">
      ${STORE_AREAS.map((a, i) => `<button class="c-chip ${i===0?"is-active":""}" data-area="${a}" aria-pressed="${i===0}">${a}</button>`).join("")}</div>`;
  const state = { q: "", area: "すべて" };
  const fire = () => onChange && onChange(filterStores(state));
  el.querySelector("#storeQuery").addEventListener("input", (e) => { state.q = e.target.value.trim(); fire(); });
  el.querySelectorAll("[data-area]").forEach((c) => c.addEventListener("click", () => {
    state.area = c.dataset.area;
    el.querySelectorAll("[data-area]").forEach((x) => { x.classList.toggle("is-active", x === c); x.setAttribute("aria-pressed", x === c); });
    fire();
  }));
  return state;
}
export function filterStores({ q = "", area = "すべて" } = {}) {
  const needle = q.toLowerCase();
  return REAL_STORES.filter((s) => {
    const areaOk = area === "すべて" || s.area === area;
    const text = `${s.name} ${s.area} ${s.addr}`.toLowerCase();
    return areaOk && (!needle || text.includes(needle));
  });
}
// 店舗リスト1行（検索結果用・空きレベル付き）
export function storeListRow(s) { return storeRow(s); }
