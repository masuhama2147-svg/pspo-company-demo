// =============================================================================
// config.js — 単一の真実の源 (single source of truth)
// Notion プレイブック原則 #5「業務定数は単一の真実の源に」を踏襲。
// しきい値・色・更新間隔・ブランド文言をここに集約する。
// =============================================================================

export const BRAND = {
  name: "P・SPO",
  nameJa: "ピースポ",
  // 顧客には“機能”を訴求（計測方法は出さない）。— 本プロダクトの一行コンセプト
  tagline: "リアルタイム空き × あなたの最適時間。",
  subtitle: "今いちばん空いてる店・時間が、あなた仕様でひと目に。P・SPO をもっと使いやすく。",
  // ローカル既定ポート（被らない値を選定。serve.js が使用中なら自動で +1 する）
  defaultPort: 8731,
};

// 更新間隔（疑似ライブ）。PSPO 現行は「約10分ごと」。本実装は体感リアルタイム。
export const REFRESH_MS = 4000;

// 混雑レベルの定義（占有率 → レベル）。色は CSS 変数と完全同期させる。
//  ⚠️ css/base.css の --lv-* と必ず一致させること（config が正、CSS にコメントで明記）。
export const LEVELS = [
  { id: "free",     label: "空いてる", short: "空", max: 0.40, color: "#46d39a", advice: "今が狙い目" },
  { id: "moderate", label: "ほどよい", short: "適", max: 0.70, color: "#ffc24b", advice: "快適に使えます" },
  { id: "busy",     label: "混みあい", short: "混", max: 0.88, color: "#ff8a5c", advice: "待ちが出るかも" },
  { id: "full",     label: "満員ちかい", short: "満", max: 1.01, color: "#ff5d73", advice: "時間をずらすのが吉" },
];

// 占有率 (0..1) からレベル定義を引く
export function levelOf(ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  return LEVELS.find((l) => r < l.max) || LEVELS[LEVELS.length - 1];
}

// ゾーン種別（フロアの意味づけ）。アイコンは inline SVG パスのキー。
export const ZONE_KIND = {
  machine:   { label: "マシンエリア",     glyph: "dumbbell" },
  free:      { label: "フリーウェイト",   glyph: "weight" },
  cardio:    { label: "有酸素",           glyph: "run" },
  studio:    { label: "スタジオ",         glyph: "yoga" },
  sauna:     { label: "サウナ／整い",     glyph: "sauna" },
  cafe:      { label: "カフェ",           glyph: "cup" },
  works:     { label: "ワークスペース",   glyph: "desk" },
  shower:    { label: "シャワー",         glyph: "drop" },
};

// 営業情報（全店共通の見せ方）
export const HOURS_LABEL = "24時間営業";

// アクセシビリティ／UX 定数（Notion: タップ44px, 入力16px）
export const A11Y = { tapMin: 44, inputFont: 16 };

// Googleマップ連携。apiKey を入れると実地図に切替、空なら SVG 模式図にフォールバック。
//  取得: Google Cloud → Maps JavaScript API を有効化 → APIキー作成 → 下に貼る。
//  （請求の都合上キーは各自で。リポジトリにはコミットしないこと＝Notion原則「秘密はコードに置かない」）
// 🔑 APIキーはコードに置かない（Notion原則「秘密はコードに置かない」）。
//   ローカルは gitignore 済みの `js/config.local.js` が window.__SUKIMA_GMAPS_KEY を設定する。
//   未設定なら apiKey="" → 地図は破綻せずエリア別リストへフォールバックする。
//   発行時は Google Cloud で「HTTPリファラ制限(localhost＋自社ドメイン)」「Maps JavaScript API のみ許可」必須。
export const GOOGLE_MAPS = {
  apiKey: (typeof globalThis !== "undefined" && globalThis.__SUKIMA_GMAPS_KEY) || "",
  center: { lat: 33.95, lng: 132.95 }, // 愛媛中央（全店が収まる初期表示）
  zoom: 9,
};

