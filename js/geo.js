// =============================================================================
// geo.js — 位置情報を使わない「近い順」エンジン（住所・地名・駅の手入力で解決）
// なぜ自前ガゼッタか: Geocoding API へ通信せず確実・無料・オフラインで解決できる。
//  - GAZETTEER: 愛媛の市区・町名・主要駅 → 代表座標（概略・エリア/地区単位）。
//  - geocodeAddress(): 店舗住所を“最も具体的な地名トークン”で座標化（松山は地区まで分散）。
//  - GEO_STORES: stores-real.js の重複ダミー座標を上書きした補正版（地図・近い順の単一の真実源）。
//  - haversineKm / nearestStores: ハバーサインで距離(km)を出し近い順に並べる。
// ⚠️ 座標は概略（エリア/地区単位）。実運用は Geocoding API で精緻化する前提（UIにも明示）。
// =============================================================================
import { REAL_STORES } from "./stores-real.js";
import { STORE_GEO } from "./data.js";
import { getPrefs } from "./ui.js";

/* ---- ガゼッタ：地名・駅 → 代表座標（ユーザー入力の解決にも使う） ----------
   キーは住所/入力に“含まれていれば一致”。長いキーを優先（最具体マッチ）。 */
export const GAZETTEER = {
  // --- 松山市内の地区（市内でも分散させるため細かく） ---
  "大街道":      { lat: 33.8447, lng: 132.7679, label: "松山・大街道" },
  "一番町":      { lat: 33.8430, lng: 132.7672, label: "松山・一番町" },
  "二番町":      { lat: 33.8419, lng: 132.7676, label: "松山・二番町" },
  "三番町":      { lat: 33.8403, lng: 132.7669, label: "松山・三番町" },
  "湊町":        { lat: 33.8389, lng: 132.7660, label: "松山・湊町（銀天街）" },
  "銀天街":      { lat: 33.8395, lng: 132.7665, label: "松山・銀天街" },
  "千舟町":      { lat: 33.8370, lng: 132.7563, label: "松山・千舟町" },
  "永代町":      { lat: 33.8380, lng: 132.7690, label: "松山・市駅南" },
  "歩行町":      { lat: 33.8410, lng: 132.7720, label: "松山・歩行町" },
  "平和通":      { lat: 33.8470, lng: 132.7720, label: "松山・平和通（愛大）" },
  "清水町":      { lat: 33.8540, lng: 132.7760, label: "松山・清水町（松大前）" },
  "樋又":        { lat: 33.8490, lng: 132.7770, label: "松山・愛大前" },
  "道後北代":    { lat: 33.8540, lng: 132.7900, label: "松山・道後北代" },
  "道後":        { lat: 33.8520, lng: 132.7860, label: "松山・道後" },
  "祝谷":        { lat: 33.8560, lng: 132.7900, label: "松山・祝谷" },
  "南江戸":      { lat: 33.8392, lng: 132.7530, label: "松山・JR松山駅" },
  "本町":        { lat: 33.8430, lng: 132.7620, label: "松山・本町" },
  "湯渡":        { lat: 33.8420, lng: 132.7740, label: "松山・湯渡" },
  "土橋":        { lat: 33.8330, lng: 132.7560, label: "松山・土橋" },
  "土居田":      { lat: 33.8340, lng: 132.7480, label: "松山・土居田" },
  "中央":        { lat: 33.8340, lng: 132.7520, label: "松山・中央" },
  "保免":        { lat: 33.8290, lng: 132.7470, label: "松山・保免" },
  "南斎院":      { lat: 33.8330, lng: 132.7350, label: "松山・南斎院" },
  "須賀町":      { lat: 33.8660, lng: 132.7170, label: "松山・三津" },
  "三津":        { lat: 33.8660, lng: 132.7170, label: "松山・三津" },
  "高浜":        { lat: 33.8830, lng: 132.7110, label: "松山・高浜（観光港）" },
  "北条辻":      { lat: 33.9760, lng: 132.7720, label: "松山・北条" },
  "北条":        { lat: 33.9700, lng: 132.7740, label: "松山・北条" },
  "柳原":        { lat: 33.9550, lng: 132.7790, label: "松山・柳原" },
  "浅海":        { lat: 34.0080, lng: 132.7860, label: "松山・浅海" },
  "久万ノ台":    { lat: 33.8540, lng: 132.7460, label: "松山・久万ノ台" },
  "姫原":        { lat: 33.8580, lng: 132.7610, label: "松山・姫原" },
  "馬木":        { lat: 33.8650, lng: 132.8010, label: "松山・馬木" },
  "東石井":      { lat: 33.8160, lng: 132.7560, label: "松山・東石井" },
  "小坂":        { lat: 33.8330, lng: 132.7780, label: "松山・小坂" },
  "鷹子":        { lat: 33.8290, lng: 132.8120, label: "松山・鷹子（久米）" },
  "久米":        { lat: 33.8290, lng: 132.8120, label: "松山・久米" },
  "桑原":        { lat: 33.8420, lng: 132.8000, label: "松山・桑原" },
  "東野":        { lat: 33.8470, lng: 132.8100, label: "松山・東野" },
  "北吉田":      { lat: 33.8130, lng: 132.7300, label: "松山・北吉田" },
  "三町":        { lat: 33.8020, lng: 132.7440, label: "松山・三町" },
  "夏目":        { lat: 33.8280, lng: 132.8260, label: "松山・夏目" },
  "空港通":      { lat: 33.8230, lng: 132.7300, label: "松山・空港通り" },
  "久米窪田":    { lat: 33.8270, lng: 132.8190, label: "松山・久米" },
  // --- 松山の駅・ランドマーク（入力補助） ---
  "松山市駅":    { lat: 33.8417, lng: 132.7660, label: "松山市駅" },
  "市駅":        { lat: 33.8417, lng: 132.7660, label: "松山市駅" },
  "松山駅":      { lat: 33.8392, lng: 132.7530, label: "JR松山駅" },
  "道後温泉":    { lat: 33.8520, lng: 132.7860, label: "道後温泉" },
  "松山":        { lat: 33.8392, lng: 132.7657, label: "松山市中心" },
  // --- 愛媛 県内 他エリア ---
  "東温":        { lat: 33.7909, lng: 132.8719, label: "東温市" },
  "横河原":      { lat: 33.7920, lng: 132.8930, label: "東温・横河原" },
  "見奈良":      { lat: 33.7860, lng: 132.8650, label: "東温・見奈良" },
  "砥部":        { lat: 33.7490, lng: 132.7900, label: "砥部町" },
  "伊予郡松前":  { lat: 33.7906, lng: 132.7142, label: "松前町" },
  "松前":        { lat: 33.7906, lng: 132.7142, label: "松前町（エミフル）" },
  "エミフル":    { lat: 33.7906, lng: 132.7142, label: "エミフルMASAKI" },
  "伊予市":      { lat: 33.7579, lng: 132.7039, label: "伊予市" },
  "伊予":        { lat: 33.7579, lng: 132.7039, label: "伊予市・郡中" },
  "郡中":        { lat: 33.7560, lng: 132.7010, label: "伊予・郡中" },
  "西条":        { lat: 33.9194, lng: 133.1813, label: "西条市" },
  "壬生川":      { lat: 33.9300, lng: 133.1600, label: "西条・東予（壬生川）" },
  "東予":        { lat: 33.9300, lng: 133.1600, label: "西条・東予" },
  "新居浜":      { lat: 33.9603, lng: 133.2836, label: "新居浜市" },
  "今治":        { lat: 34.0658, lng: 132.9977, label: "今治市" },
  "しまなみ":    { lat: 34.0658, lng: 132.9977, label: "今治・しまなみ" },
  "宇和島":      { lat: 33.2232, lng: 132.5607, label: "宇和島市" },
  "北宇和島":    { lat: 33.2380, lng: 132.5640, label: "宇和島・北宇和島" },
  "大洲":        { lat: 33.5065, lng: 132.5447, label: "大洲市" },
  "内子":        { lat: 33.5398, lng: 132.6540, label: "内子町" },
  // --- 県外（参考） ---
  "半田":        { lat: 34.8938, lng: 136.9370, label: "愛知・半田市" },
  "知多半田":    { lat: 34.8950, lng: 136.9290, label: "愛知・知多半田" },
  "旭川":        { lat: 43.7706, lng: 142.3650, label: "北海道・旭川市" },
};

// エリア(area フィールド) → 代表中心（地区が取れない時のフォールバック）
const AREA_CENTER = {
  "松山":     { lat: 33.8392, lng: 132.7657 },
  "東温":     { lat: 33.7909, lng: 132.8719 },
  "砥部":     { lat: 33.7490, lng: 132.7900 },
  "伊予":     { lat: 33.7579, lng: 132.7039 },
  "松前":     { lat: 33.7906, lng: 132.7142 },
  "西条":     { lat: 33.9194, lng: 133.1813 },
  "新居浜":   { lat: 33.9603, lng: 133.2836 },
  "しまなみ": { lat: 34.0658, lng: 132.9977 },
  "南予":     { lat: 33.3700, lng: 132.5900 },
  "愛知":     { lat: 34.8938, lng: 136.9370 },
  "北海道":   { lat: 43.7706, lng: 142.3650 },
};

// 松山の旧フォールバック点（ここに固まっている＝要・地区分散）
function isFallback(lat, lng) {
  return Math.abs(lat - 33.839519) < 0.01 && Math.abs(lng - 132.765352) < 0.01;
}

/* ---- 決定論的な微小オフセット（同点重なりを避ける・店名シード） -------- */
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function jitter(seed, amp) {
  const a = (seed % 1000) / 1000 - 0.5;
  const b = (((seed / 1000) | 0) % 1000) / 1000 - 0.5;
  return { dLat: a * amp, dLng: b * amp * 1.15 };
}

// 住所内の“最も具体的な地名”（最長一致）を探す
function bestPlace(addr) {
  let best = null, bestLen = 0;
  for (const key in GAZETTEER) {
    if (key.length > bestLen && addr.includes(key)) { best = GAZETTEER[key]; bestLen = key.length; }
  }
  return best;
}

/* ---- 住所 → 座標（概略・地区単位）。重複を避けて分散させる ------------- */
export function geocodeAddress(addr = "", area = "", existing = null) {
  const place = bestPlace(addr);
  const seed = hashStr(addr || area);
  if (place) {
    const j = jitter(seed, 0.006); // 地区一致は小さめに散らす(~300-600m)
    return { lat: place.lat + j.dLat, lng: place.lng + j.dLng, approx: true };
  }
  // 既存座標がフォールバックでなければ尊重（既に概略でも実在ベース）
  if (existing && !isFallback(existing.lat, existing.lng)) {
    const j = jitter(seed, 0.004);
    return { lat: existing.lat + j.dLat, lng: existing.lng + j.dLng, approx: true };
  }
  // エリア中心 + 大きめジッター（市内に広く散らす）
  const c = AREA_CENTER[area] || AREA_CENTER["松山"];
  const j = jitter(seed, 0.018);
  return { lat: c.lat + j.dLat, lng: c.lng + j.dLng, approx: true };
}

/* ---- 補正済み店舗（地図・近い順の単一の真実源） ---------------------- */
export const GEO_STORES = REAL_STORES.map((s) => {
  const g = geocodeAddress(s.addr, s.area, { lat: s.lat, lng: s.lng });
  return { ...s, lat: g.lat, lng: g.lng, approx: g.approx };
});

/* ---- ハバーサイン距離(km) ------------------------------------------- */
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
export function fmtKm(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/* ---- ユーザー入力（住所・地名・駅）→ 座標。位置情報は使わない -------- */
export function geocodeQuery(text = "") {
  const q = text.trim();
  if (!q) return null;
  let best = null, bestLen = 0;
  for (const key in GAZETTEER) {
    if (key.length > bestLen && q.includes(key)) { best = GAZETTEER[key]; bestLen = key.length; }
  }
  // 「愛媛県」「市」などノイズしか無い時は松山中心へ寄せず null（呼び出し側で案内）
  return best ? { lat: best.lat, lng: best.lng, label: best.label, matched: true } : null;
}

/* ---- 登録エリア基準の地図デフォルト表示（松山登録→松山ズーム 等） ----
   オンボで選んだホーム店舗(prefs.homeStoreId)の座標へ寄せる。未設定なら null（＝愛媛全体）。 */
export function homeView() {
  const prefs = getPrefs();
  if (prefs && prefs.homeStoreId && STORE_GEO[prefs.homeStoreId]) {
    const g = STORE_GEO[prefs.homeStoreId];
    return { center: { lat: g.lat, lng: g.lng }, zoom: 13, storeId: prefs.homeStoreId };
  }
  return null;
}

/* ---- 近い順（距離km付き）。query は文字列 or {lat,lng} ----------------- */
export function nearestStores(query, stores = GEO_STORES) {
  const origin = typeof query === "string" ? geocodeQuery(query) : query;
  if (!origin) return null;
  return {
    origin,
    list: stores
      .map((s) => ({ ...s, distKm: haversineKm(origin, s) }))
      .sort((a, b) => a.distKm - b.distKm),
  };
}
