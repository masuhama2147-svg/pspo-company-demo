// =============================================================================
// facilities.js — PSPO近隣の施設レコメンド（位置情報はオプトイン）
// 既定はホーム店舗周辺で近隣施設を提案（GPS不要）。同意があればGPSで精度UP。
// これが匿名・同意ベースの“人流”素材（経営AIへ）。実位置は粗粒度・常時追跡しない。
// =============================================================================
import { haversineKm, fmtKm } from "./geo.js";
import { STORE_GEO } from "./data.js";
import { getPrefs } from "./ui.js";

// 松山中心の近隣施設（実在の地名ベース・概略座標）。カテゴリ＝絵文字＋ラベル。
export const FACILITIES = [
  { name: "伊予鉄 大街道電停", cat: "🚉 電停", lat: 33.8443, lng: 132.7686 },
  { name: "松山市駅", cat: "🚉 駅", lat: 33.8417, lng: 132.7660 },
  { name: "JR松山駅", cat: "🚉 駅", lat: 33.8392, lng: 132.7530 },
  { name: "道後温泉駅", cat: "🚉 駅", lat: 33.8520, lng: 132.7860 },
  { name: "城山公園（堀之内）", cat: "🌳 公園", lat: 33.8455, lng: 132.7650 },
  { name: "松山中央公園", cat: "🌳 公園", lat: 33.8200, lng: 132.7350 },
  { name: "県立図書館", cat: "📚 学習", lat: 33.8398, lng: 132.7665 },
  { name: "ジュンク堂 三越松山", cat: "📖 書店", lat: 33.8430, lng: 132.7672 },
  { name: "大街道アーケード", cat: "🛍️ 商業", lat: 33.8447, lng: 132.7679 },
  { name: "銀天街アーケード", cat: "🛍️ 商業", lat: 33.8395, lng: 132.7665 },
  { name: "コンビニ（中央通り）", cat: "🏪 コンビニ", lat: 33.8350, lng: 132.7560 },
  { name: "カフェ（一番町）", cat: "☕ カフェ", lat: 33.8425, lng: 132.7676 },
  { name: "鍋焼きうどん店（湊町）", cat: "🍜 飲食", lat: 33.8388, lng: 132.7662 },
  { name: "松山空港", cat: "✈️ 空港", lat: 33.8273, lng: 132.6997 },
  { name: "三津浜港", cat: "⛴️ 港", lat: 33.8665, lng: 132.7170 },
  { name: "松山観光港", cat: "⛴️ 港", lat: 33.8830, lng: 132.7110 },
  { name: "愛媛大学（城北）", cat: "🎓 大学", lat: 33.8490, lng: 132.7700 },
  { name: "松山大学（文京）", cat: "🎓 大学", lat: 33.8540, lng: 132.7760 },
  { name: "久米駅（伊予鉄）", cat: "🚉 駅", lat: 33.8290, lng: 132.8120 },
  { name: "北条スポーツセンター", cat: "🏟️ 運動", lat: 33.9760, lng: 132.7720 },
  { name: "砥部動物園(とべZOO)", cat: "🦁 観光", lat: 33.7430, lng: 132.7880 },
  { name: "エミフルMASAKI", cat: "🛍️ 商業", lat: 33.7906, lng: 132.7142 },
];

// 近い順（距離km付き）。origin {lat,lng}
export function nearbyFacilities(origin, n = 8) {
  if (!origin) return [];
  return FACILITIES.map((f) => ({ ...f, distKm: haversineKm(origin, f) })).sort((a, b) => a.distKm - b.distKm).slice(0, n);
}

// ホーム店舗周辺（GPS不要の既定原点）
export function homeOrigin() {
  const p = getPrefs();
  if (p && p.homeStoreId && STORE_GEO[p.homeStoreId]) {
    const g = STORE_GEO[p.homeStoreId];
    return { lat: g.lat, lng: g.lng, label: "ホーム店舗の周辺", source: "home" };
  }
  return { lat: 33.8392, lng: 132.7657, label: "松山中心", source: "default" };
}

// GPS（同意・許可がある場合のみ）。失敗/拒否は null。
export function requestGeolocation() {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, label: "現在地", source: "gps" }),
      () => res(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export { fmtKm };
