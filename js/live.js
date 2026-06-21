// =============================================================================
// live.js — 疑似ライブエンジン
// 「状態が変わった時だけ描画」を意識しつつ、デモのため一定間隔で軽く揺らす。
// 現在時刻の forecast に向かって各ゾーン/設備を“引き寄せ”、自然な増減を演出する。
// 本番なら：センサ(人数カウンタ/IoT)→ Functions で availability コレクションへ射影、を想定。
// =============================================================================
import { STORES, storeRatio } from "./data.js";
import { REFRESH_MS } from "./config.js";

let timer = null;
let lastTick = 0;

// 目標値へ少しずつ寄せる（過度に飛ばない）
function approach(current, target, max, jitter = 1) {
  const step = Math.sign(target - current) * (Math.random() < 0.6 ? 1 : 0);
  const noise = Math.random() < 0.35 ? (Math.random() < 0.5 ? -1 : 1) * jitter : 0;
  let next = current + step + noise;
  return Math.max(0, Math.min(max, Math.round(next)));
}

function tickStore(store, hour) {
  const targetRatio = store.forecast[hour];
  store.zones.forEach((z) => {
    const target = Math.round(z.capacity * targetRatio);
    z.occupied = approach(z.occupied, target, z.capacity, 1);
  });
  store.equipment.forEach((g) => {
    // 設備の空きは占有率の裏返し。目標 free = total * (1 - targetRatio) を中心に揺らす
    const targetFree = Math.round(g.total * (1 - targetRatio));
    g.free = approach(g.free, targetFree, g.total, 1);
  });
}

export function tickAll() {
  const hour = new Date().getHours();
  STORES.forEach((s) => tickStore(s, hour));
  lastTick = Date.now();
  window.dispatchEvent(new CustomEvent("sukima:update", { detail: { at: lastTick } }));
}

export function startLive() {
  if (timer) return;
  // 初回は即時に1回（“今”を見せる）
  tickAll();
  timer = setInterval(tickAll, REFRESH_MS);
  // タブが非表示の間は止める（無駄な実行＝コスト、を抑える: Notion原則 #3）
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(timer);
      timer = null;
    } else if (!timer) {
      tickAll();
      timer = setInterval(tickAll, REFRESH_MS);
    }
  });
}

export function lastUpdated() {
  return lastTick || Date.now();
}

// 「今いちばん空いている店舗」を返す（ホームのレコメンドに使用）
export function emptiestStore() {
  return [...STORES].sort((a, b) => storeRatio(a) - storeRatio(b))[0];
}
