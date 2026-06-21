// =============================================================================
// data.js — ダミーデータ（店舗 / ゾーン / 設備 / 時間帯予報）
// すべて架空。写真もダミー(SVG)。Notion 原則 #4「公開データは非PII射影」を踏襲し、
// ここには“人の顔”や個人を特定する情報は一切持たない（=カメラ映像を置かない設計）。
// =============================================================================
import { ZONE_KIND } from "./config.js";

// 1日(24h)の典型的な混雑カーブ(0..1)。朝と夜にピーク（ジムの実態に近い二峰性）。
// 店舗ごとに微妙に味付けする。
function curve({ morning = 0.62, midday = 0.34, evening = 0.86, night = 0.2 } = {}) {
  // index = 時刻(0-23)
  const base = [
    night, night, night, night, 0.12, 0.22,        // 0-5
    0.40, morning, morning - 0.05, 0.5, midday + 0.06, midday, // 6-11
    midday + 0.1, midday + 0.04, 0.38, 0.42,        // 12-15
    0.5, 0.64, evening - 0.08, evening, evening, evening - 0.12, // 16-21
    0.5, 0.32,                                       // 22-23
  ];
  return base.map((v) => Math.max(0.05, Math.min(0.98, v)));
}

// ゾーン生成ヘルパ
let _zid = 0;
function zone(kind, capacity, fillRatio) {
  _zid += 1;
  return {
    id: `z${_zid}`,
    kind,
    label: ZONE_KIND[kind].label,
    capacity,
    occupied: Math.round(capacity * fillRatio),
  };
}

// 設備生成ヘルパ（“あと何台空いてるか”を答える、現行PSPOに無い粒度）
function gear(name, total, free) {
  return { name, total, free: Math.max(0, Math.min(total, free)) };
}

export const STORES = [
  {
    id: "okaido",
    name: "松山大街道店",
    area: "松山エリア",
    blurb: "アーケード直結。仕事帰りに寄れる旗艦店。",
    accent: "#22d3c0",
    photo: "assets/store-okaido.svg",
    forecast: curve({ morning: 0.55, evening: 0.9, midday: 0.4 }),
    zones: [
      zone("machine", 28, 0.5),
      zone("free", 12, 0.66),
      zone("cardio", 16, 0.43),
      zone("studio", 30, 0.2),
      zone("sauna", 8, 0.75),
      zone("works", 18, 0.61),
      zone("cafe", 24, 0.33),
    ],
    equipment: [
      gear("ランニングマシン", 8, 4),
      gear("バイク", 6, 3),
      gear("ベンチプレス", 3, 1),
      gear("スミスマシン", 2, 0),
      gear("ケーブルマシン", 4, 2),
      gear("パワーラック", 3, 1),
      gear("ワーク席（電源）", 18, 7),
    ],
  },
  {
    id: "kuukou",
    name: "松山空港通り店",
    area: "松山エリア",
    blurb: "駐車場100台。朝活ユーザーが多い郊外型。",
    accent: "#7cc6ff",
    photo: "assets/store-kuukou.svg",
    forecast: curve({ morning: 0.78, evening: 0.7, midday: 0.3 }),
    zones: [
      zone("machine", 34, 0.32),
      zone("free", 14, 0.43),
      zone("cardio", 20, 0.55),
      zone("studio", 36, 0.15),
      zone("sauna", 10, 0.5),
      zone("works", 12, 0.25),
      zone("cafe", 20, 0.2),
    ],
    equipment: [
      gear("ランニングマシン", 10, 6),
      gear("バイク", 8, 5),
      gear("ベンチプレス", 4, 2),
      gear("スミスマシン", 3, 2),
      gear("ケーブルマシン", 5, 3),
      gear("パワーラック", 4, 2),
      gear("ワーク席（電源）", 12, 9),
    ],
  },
  {
    id: "saijo",
    name: "西条店",
    area: "東予エリア",
    blurb: "学生会員が多く、夜は活気。スタジオが広い。",
    accent: "#a6e35a",
    photo: "assets/store-saijo.svg",
    forecast: curve({ morning: 0.4, evening: 0.92, midday: 0.45 }),
    zones: [
      zone("machine", 24, 0.71),
      zone("free", 10, 0.8),
      zone("cardio", 14, 0.64),
      zone("studio", 40, 0.55),
      zone("sauna", 6, 0.83),
      zone("works", 8, 0.5),
      zone("cafe", 16, 0.44),
    ],
    equipment: [
      gear("ランニングマシン", 7, 1),
      gear("バイク", 5, 1),
      gear("ベンチプレス", 3, 0),
      gear("スミスマシン", 2, 0),
      gear("ケーブルマシン", 3, 1),
      gear("パワーラック", 2, 0),
      gear("ワーク席（電源）", 8, 3),
    ],
  },
  {
    id: "niihama",
    name: "新居浜店",
    area: "東予エリア",
    blurb: "ファミリー層に人気。日中も安定して空く。",
    accent: "#ffc24b",
    photo: "assets/store-niihama.svg",
    forecast: curve({ morning: 0.5, evening: 0.66, midday: 0.5 }),
    zones: [
      zone("machine", 26, 0.27),
      zone("free", 10, 0.3),
      zone("cardio", 14, 0.36),
      zone("studio", 28, 0.18),
      zone("sauna", 8, 0.38),
      zone("works", 10, 0.2),
      zone("cafe", 18, 0.28),
    ],
    equipment: [
      gear("ランニングマシン", 8, 6),
      gear("バイク", 6, 5),
      gear("ベンチプレス", 3, 2),
      gear("スミスマシン", 2, 1),
      gear("ケーブルマシン", 4, 3),
      gear("パワーラック", 3, 2),
      gear("ワーク席（電源）", 10, 8),
    ],
  },
  {
    id: "shimanami",
    name: "今治しまなみ店",
    area: "東予エリア",
    blurb: "サイクリスト御用達。サウナと整いが名物。",
    accent: "#ff8a5c",
    photo: "assets/store-shimanami.svg",
    forecast: curve({ morning: 0.7, evening: 0.78, midday: 0.55 }),
    zones: [
      zone("machine", 22, 0.55),
      zone("free", 8, 0.5),
      zone("cardio", 18, 0.61),
      zone("studio", 24, 0.3),
      zone("sauna", 12, 0.91),
      zone("works", 8, 0.38),
      zone("cafe", 20, 0.5),
    ],
    equipment: [
      gear("ランニングマシン", 6, 2),
      gear("バイク", 10, 4),
      gear("ベンチプレス", 2, 1),
      gear("スミスマシン", 2, 1),
      gear("ケーブルマシン", 3, 1),
      gear("パワーラック", 2, 1),
      gear("サウナ室", 12, 1),
    ],
  },
  {
    id: "uwajima",
    name: "宇和島店",
    area: "南予エリア",
    blurb: "南予唯一の24h。深夜帯はほぼ貸切。",
    accent: "#c08cff",
    photo: "assets/store-uwajima.svg",
    forecast: curve({ morning: 0.45, evening: 0.6, midday: 0.3, night: 0.1 }),
    zones: [
      zone("machine", 20, 0.2),
      zone("free", 8, 0.25),
      zone("cardio", 12, 0.25),
      zone("studio", 22, 0.1),
      zone("sauna", 6, 0.33),
      zone("works", 6, 0.16),
      zone("cafe", 14, 0.21),
    ],
    equipment: [
      gear("ランニングマシン", 6, 5),
      gear("バイク", 5, 4),
      gear("ベンチプレス", 2, 2),
      gear("スミスマシン", 1, 1),
      gear("ケーブルマシン", 3, 3),
      gear("パワーラック", 2, 2),
      gear("ワーク席（電源）", 6, 5),
    ],
  },
];

// --- 集計ヘルパ ---------------------------------------------------------------
export function storeCapacity(store) {
  return store.zones.reduce((s, z) => s + z.capacity, 0);
}
export function storeOccupied(store) {
  return store.zones.reduce((s, z) => s + z.occupied, 0);
}
export function storeRatio(store) {
  const cap = storeCapacity(store);
  return cap ? storeOccupied(store) / cap : 0;
}
export function getStore(id) {
  return STORES.find((s) => s.id === id) || STORES[0];
}

// マップ座標。x/y=SVG模式図用(%)、lat/lng=Googleマップ用(愛媛の概略・ダミー)。
export const STORE_GEO = {
  okaido:    { x: 44, y: 56, lat: 33.8416, lng: 132.7681 }, // 松山・大街道
  kuukou:    { x: 37, y: 63, lat: 33.8290, lng: 132.7220 }, // 松山・空港通り
  saijo:     { x: 68, y: 48, lat: 33.9190, lng: 133.1810 }, // 西条
  niihama:   { x: 78, y: 43, lat: 33.9603, lng: 133.2833 }, // 新居浜
  shimanami: { x: 59, y: 30, lat: 34.0660, lng: 132.9978 }, // 今治・しまなみ
  uwajima:   { x: 24, y: 84, lat: 33.2230, lng: 132.5606 }, // 宇和島
};

// 店舗写真：フリー画像(Unsplash)。読み込み失敗時は SVG ダミー(store.photo)へフォールバック。
export const STORE_PHOTOS = {
  okaido:    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=70",
  kuukou:    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=70",
  saijo:     "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=70",
  niihama:   "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=70",
  shimanami: "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?auto=format&fit=crop&w=800&q=70",
  uwajima:   "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=70",
};
