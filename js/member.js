// =============================================================================
// member.js — 会員パーソナライズ＆“顔認証データ還元”ロジック（全クライアント）
// 現行PSPOは顔認証で来館データを取得しているのに会員へ還元していない。
// ここでは「同じ来館データから価値を返す」ことを実証: ランク/連続/利用連動割引/目標/推薦。
// すべて localStorage。バックエンド・PII無し（Notion原則: 非PII射影）。
// =============================================================================
import { PERSONAS } from "./insights.js";
import { getProfile, getPrefs } from "./ui.js";
import { getStore, storeRatio, STORES } from "./data.js";
import { levelOf } from "./config.js";

// オンボーディングで選んだホーム店舗を優先（無ければペルソナ既定）
function resolveHomeStoreId(persona) {
  const prefs = getPrefs();
  if (prefs && prefs.homeStoreId && STORES.some((s) => s.id === prefs.homeStoreId)) return prefs.homeStoreId;
  return persona.homeStore;
}

export const RANKS = [
  { id: "bronze",   label: "ブロンズ",         min: 0,     col: "#cd7f4d", emoji: "🥉", perk: "基本特典" },
  { id: "silver",   label: "シルバー",         min: 1200,  col: "#c7d0d8", emoji: "🥈", perk: "ドリンク割引" },
  { id: "gold",     label: "ゴールド",         min: 3000,  col: "#ffcf5c", emoji: "🥇", perk: "自習室の優先予約" },
  { id: "platinum", label: "プラチナ",         min: 6000,  col: "#9fe6ff", emoji: "💠", perk: "ドリンク無料＋月割引UP" },
  { id: "metal",    label: "メタル（特製カード）", min: 10000, col: "#e9eff4", emoji: "🔱", perk: "金属製会員証＋全特典" },
];

// 各ペルソナの“週の通いパターン”（曜日 0=日…6=土）— 決定論的シードに使う
const PATTERN = {
  student_night: [2, 4, 6, 0],     // 火木土日
  morning:       [1, 2, 3, 4, 5],  // 平日
  woman_safety:  [1, 3, 5],        // 月水金
  worker_night:  [1, 2, 4, 5],     // 月火木金
};
const SEED_DAYS = 35;
const JOIN_MONTHS = { student_night: 9, morning: 16, woman_safety: 5, worker_night: 22 };

export function currentPersona() {
  return PERSONAS.find((p) => p.id === getProfile()) || PERSONAS[0];
}

function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function isoWeekKey(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-W${week}`;
}

function seedCheckins(personaId) {
  const pattern = PATTERN[personaId] || PATTERN.student_night;
  const out = [];
  const now = new Date();
  for (let i = SEED_DAYS; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    if (pattern.includes(d.getDay())) out.push(ymd(d));
  }
  return out;
}

function storeKey(personaId) { return `sukima-member-${personaId}`; }

function load(personaId) {
  try {
    const raw = localStorage.getItem(storeKey(personaId));
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const seeded = { checkins: seedCheckins(personaId), bonusPoints: 0, goalOverride: null };
  try { localStorage.setItem(storeKey(personaId), JSON.stringify(seeded)); } catch (e) {}
  return seeded;
}
function save(personaId, data) { try { localStorage.setItem(storeKey(personaId), JSON.stringify(data)); } catch (e) {} }

function rankOf(points) {
  let cur = RANKS[0];
  for (const r of RANKS) if (points >= r.min) cur = r;
  const next = RANKS[RANKS.indexOf(cur) + 1] || null;
  const progress = next ? Math.round(((points - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { rank: cur, next, progress };
}

function weeksStreak(checkins) {
  if (!checkins.length) return 0;
  const weeks = new Set(checkins.map((s) => isoWeekKey(new Date(s))));
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(cur); d.setDate(cur.getDate() - i * 7);
    if (weeks.has(isoWeekKey(d))) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function getMember() {
  const persona = currentPersona();
  const data = load(persona.id);
  const checkins = data.checkins.slice().sort();
  const now = new Date();

  // 直近30日の来館
  const cutoff = new Date(now); cutoff.setDate(now.getDate() - 30);
  const monthVisits = checkins.filter((s) => new Date(s) >= cutoff).length;

  // 時間・累計（決定論的な見積り）
  const trainMin = monthVisits * 48;
  const studyMin = persona.study ? monthVisits * 72 : 0;
  const joinMonths = JOIN_MONTHS[persona.id] || 8;
  const lifetimeVisits = Math.round(monthVisits * joinMonths * 0.92);
  const points = Math.round(lifetimeVisits * 22 + studyMin * 0.18 + trainMin * 0.12) + (data.bonusPoints || 0);
  const { rank, next, progress } = rankOf(points);

  // 利用連動割引（顔認証データの還元）— 来館数 × 単価、上限あり
  const offPeakVisits = Math.round(monthVisits * 0.4);
  const discountYen = Math.min(1800, monthVisits * 80 + offPeakVisits * 40);

  // 直近14日のドット（ストリーク可視化）
  const set = new Set(checkins);
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    last14.push({ date: d, on: set.has(ymd(d)), peak: persona.hours && d.getDay() === (PATTERN[persona.id] || [])[0] });
  }

  // バッジ
  const badges = [];
  if (weeksStreak(checkins) >= 4) badges.push({ emoji: "🔥", label: `${weeksStreak(checkins)}週連続` });
  if (studyMin >= 600) badges.push({ emoji: "📚", label: "スタディ10h+" });
  if (trainMin >= 300) badges.push({ emoji: "🏋️", label: "トレ5h+" });
  if (offPeakVisits >= 4) badges.push({ emoji: "🌙", label: "オフピーク常連" });
  if (rank.id === "metal" || rank.id === "platinum") badges.push({ emoji: rank.emoji, label: rank.label });

  // 目標
  const goal = data.goalOverride ? { ...persona.goal, target: data.goalOverride } : persona.goal;
  const goalCurrent = goal.kind === "study" ? Math.round(studyMin / 4)
    : goal.kind === "train" ? Math.round(trainMin / 4)
    : Math.round(monthVisits / 4.3);
  const goalPct = Math.min(100, Math.round((goalCurrent / goal.target) * 100));

  return {
    persona, name: persona.label + "の会員", homeStore: getStore(resolveHomeStoreId(persona)),
    checkins, monthVisits, lifetimeVisits, trainMin, studyMin, joinMonths,
    points, rank, next, rankProgress: progress,
    discountYen, offPeakVisits, weeksStreak: weeksStreak(checkins),
    last14, badges, goal, goalCurrent, goalPct,
  };
}

export function checkInNow() {
  const persona = currentPersona();
  const data = load(persona.id);
  const today = ymd(new Date());
  let added = false;
  if (!data.checkins.includes(today)) { data.checkins.push(today); data.bonusPoints = (data.bonusPoints || 0) + 30; added = true; }
  save(persona.id, data);
  return { added, member: getMember() };
}

export function setGoal(target) {
  const persona = currentPersona();
  const data = load(persona.id);
  data.goalOverride = Math.max(1, Number(target) || persona.goal.target);
  save(persona.id, data);
  return getMember();
}

// ペルソナ＋ライブ混雑＋現在時刻から“今のあなたへの一言”を生成
export function personalRecommendation() {
  const persona = currentPersona();
  const store = getStore(resolveHomeStoreId(persona));
  const ratio = storeRatio(store);
  const lv = levelOf(ratio);
  const hour = new Date().getHours();
  const isTypical = (persona.hours || []).includes(hour);
  let line;
  if (lv.id === "free") line = `いま${store.name}は<b>空いています</b>。${persona.favZones?.length ? "お気に入りのゾーンも狙い目。" : ""}`;
  else if (lv.id === "moderate") line = `${store.name}は<b>ほどよい</b>混み具合。${isTypical ? "いつもの時間ですね。" : ""}`;
  else line = `${store.name}は<b>${lv.label}</b>。${store.forecast ? bestHourHint(store) : ""}`;
  return { line, store, ratio, lv, persona };
}

function bestHourHint(store) {
  // forecast から今後で最も空く時間帯を提案
  const hour = new Date().getHours();
  let best = hour, bestV = 1;
  for (let h = hour + 1; h < hour + 7; h++) { const hh = h % 24; if (store.forecast[hh] < bestV) { bestV = store.forecast[hh]; best = hh; } }
  return `${best}時頃が狙い目です。`;
}
