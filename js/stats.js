// =============================================================================
// stats.js — 経営AIの“意思決定材料を計算する”統計エンジン（在ブラウザ・決定論的）
// 学術的に妥当な手法を素のJSで実装。一次資料(CHURN)＋概略人口/座標に接地。
//  - 生存時間分析（指数モデルを観測平均在籍に整合）／需要平準化／Huff出店モデル
//  - 重力モデルの人流OD／k-匿名性・差分プライバシー(Laplace)
// ※ 実バックエンドML学習は範囲外。本モジュールは“計算で示す”実証。数値は概略・出典つき。
// =============================================================================
import { CHURN } from "./insights.js";

const LN2 = Math.LN2;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/* ---- 距離（ハバーサイン km） ---------------------------------------- */
export function haversineKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/* ============================================================================
   1) 生存時間分析（退会＝イベント）
   観測平均在籍(月) μ に整合する指数生存 S(t)=exp(-t/μ)。中央生存 = μ·ln2。
   一次資料：会員平均在籍 13.99、学生(退会者)平均 7.18、18歳 7.05、理想 10.6。
   ========================================================================== */
export function survivalCurve(meanMonths, maxT = 24, step = 1) {
  const pts = [];
  for (let t = 0; t <= maxT; t += step) pts.push({ t, s: Math.exp(-t / meanMonths) });
  return pts;
}
export function medianSurvival(meanMonths) { return meanMonths * LN2; }
export function retentionAt(meanMonths, months) { return clamp01(Math.exp(-months / meanMonths)); }

// 比較コホート（一次資料の平均在籍に整合した生存モデル）
export const COHORTS = [
  { id: "all",     label: "全会員",        mean: CHURN.totals.membersAvgTenure, color: "var(--accent-2)" },
  { id: "ideal",   label: "理想（PSPO）",  mean: CHURN.totals.idealTenure,      color: "var(--lv-free)", dashed: true },
  { id: "student", label: "学生(18-21)",   mean: CHURN.churnedTotal.mo,         color: "var(--hot)" },
  { id: "age18",   label: "18歳",          mean: CHURN.churned[0].mo,           color: "var(--lv-full)" },
];
export function cohortCurves(maxT = 24) {
  return COHORTS.map((c) => ({ ...c, curve: survivalCurve(c.mean, maxT), median: medianSurvival(c.mean), r12: retentionAt(c.mean, 12) }));
}

/* ============================================================================
   2) 需要平準化（ピークを削り谷を埋める）
   forecast(0..1, 24h) に上限cap・下限fillで誘導。実効キャパ向上を定量化。
   ========================================================================== */
export function levelDemand(forecast, { cap = 0.72, fill = 0.5, lift = 0.16 } = {}) {
  const smoothed = forecast.map((v) => (v > cap ? cap : v < fill ? Math.min(fill, v + lift) : v));
  const peakBefore = Math.max(...forecast), peakAfter = Math.max(...smoothed);
  const shavedPct = peakBefore > 0 ? Math.round(((peakBefore - peakAfter) / peakBefore) * 100) : 0;
  // 谷へ移せた来館割合（ピーク超過分の総量 / 全体）
  const overflow = forecast.reduce((s, v) => s + Math.max(0, v - cap), 0);
  const total = forecast.reduce((s, v) => s + v, 0);
  const movedPct = total > 0 ? Math.round((overflow / total) * 100) : 0;
  // 同一会員数での実効受入余地（谷の埋め可能量）
  const headroom = forecast.reduce((s, v) => s + Math.max(0, fill - v), 0);
  const capacityUpliftPct = total > 0 ? Math.round((headroom / total) * 100) : 0;
  return { now: forecast, smoothed, peakBefore, peakAfter, shavedPct, movedPct, capacityUpliftPct };
}

/* ============================================================================
   3) Huff 出店モデル
   候補地 j の来店確率 P_ij = (A_j / D_ij^β) / Σ_k(A_k / D_ik^β)
   期待捕捉人口 = Σ_i pop_i · P_ij（A=魅力度, D=距離, β=距離抵抗）
   ========================================================================== */
export function huffCapture(candidate, competitors, origins, beta = 2.0) {
  const all = [{ ...candidate, __cand: true }, ...competitors];
  let captured = 0;
  const byOrigin = origins.map((o) => {
    const utils = all.map((s) => s.attr / Math.pow(Math.max(0.4, haversineKm(o, s)), beta));
    const sum = utils.reduce((a, b) => a + b, 0);
    const p = sum > 0 ? utils[0] / sum : 0; // index0 = candidate
    captured += o.pop * p;
    return { name: o.name, p };
  });
  return { capturedPop: Math.round(captured), byOrigin };
}
// 候補地リストを採点（捕捉人口の降順）
export function rankSites(candidates, competitors, origins, beta = 2.0) {
  return candidates
    .map((c) => ({ ...c, ...huffCapture(c, competitors.filter((x) => x !== c), origins, beta) }))
    .sort((a, b) => b.capturedPop - a.capturedPop);
}

/* ============================================================================
   4) 重力モデルの人流（OD）
   T_ij = pop_i · attr_j / D_ij^β を行で正規化（Σ_j P_ij = 1）。
   inflow_j = Σ_i pop_i · P_ij（店舗/エリア別の来店人流）。
   ========================================================================== */
export function gravityFlow(origins, dests, beta = 1.8) {
  const od = []; const inflow = dests.map(() => 0);
  origins.forEach((o) => {
    const utils = dests.map((d) => d.attr / Math.pow(Math.max(0.5, haversineKm(o, d)), beta));
    const sum = utils.reduce((a, b) => a + b, 0) || 1;
    dests.forEach((d, j) => {
      const p = utils[j] / sum;
      const flow = o.pop * p;
      inflow[j] += flow;
      od.push({ from: o.name, to: d.name, p, flow: Math.round(flow) });
    });
  });
  const dInflow = dests.map((d, j) => ({ name: d.name, inflow: Math.round(inflow[j]) }));
  const topOD = od.sort((a, b) => b.flow - a.flow).slice(0, 8);
  return { inflow: dInflow.sort((a, b) => b.inflow - a.inflow), topOD };
}

/* ============================================================================
   5) 匿名加工：k-匿名性 と 差分プライバシー(Laplace)
   ========================================================================== */
// records: [{...}], quasi: 準識別子キー配列 → 最小グループサイズ k と再識別リスク群数
export function kAnonymity(records, quasi, kThreshold = 5) {
  const groups = {};
  records.forEach((r) => { const key = quasi.map((q) => r[q]).join("|"); groups[key] = (groups[key] || 0) + 1; });
  const sizes = Object.values(groups);
  const k = sizes.length ? Math.min(...sizes) : 0;
  const riskyGroups = sizes.filter((s) => s < kThreshold).length;
  const riskyRecords = sizes.filter((s) => s < kThreshold).reduce((a, b) => a + b, 0);
  return { k, groups: sizes.length, riskyGroups, riskyRecords, total: records.length };
}
// 決定論的擬似乱数（mulberry32）＝デモの再現性のため
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Laplace ノイズ（感度 sensitivity / プライバシー予算 epsilon）
export function laplace(rng, scale) { const u = rng() - 0.5; return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u)); }
export function dpCount(trueValue, epsilon, sensitivity = 1, seed = 42) {
  const rng = mulberry32(seed + Math.round(trueValue));
  const noised = trueValue + laplace(rng, sensitivity / epsilon);
  return Math.max(0, Math.round(noised));
}

/* ============================================================================
   6) 概略の人口/座標（人流・Huff用。出典：各市の概数。デモの近似）
   ========================================================================== */
export const CITY_POP = [
  { name: "松山市",   lat: 33.8392, lng: 132.7657, pop: 506000 },
  { name: "今治市",   lat: 34.0658, lng: 132.9977, pop: 148000 },
  { name: "新居浜市", lat: 33.9603, lng: 133.2836, pop: 113000 },
  { name: "西条市",   lat: 33.9194, lng: 133.1813, pop: 104000 },
  { name: "宇和島市", lat: 33.2232, lng: 132.5607, pop: 70000 },
  { name: "大洲市",   lat: 33.5065, lng: 132.5447, pop: 41000 },
  { name: "東温市",   lat: 33.7909, lng: 132.8719, pop: 33000 },
  { name: "伊予市",   lat: 33.7579, lng: 132.7039, pop: 35000 },
];
// 松山市内の通学/居住の代表メッシュ（人流デモの origins）
export const MATSUYAMA_MESH = [
  { name: "城北(大学)", lat: 33.8490, lng: 132.7700, pop: 42000 },
  { name: "中心部",     lat: 33.8410, lng: 132.7660, pop: 38000 },
  { name: "西部(空港)", lat: 33.8230, lng: 132.7300, pop: 46000 },
  { name: "東部(久米)", lat: 33.8290, lng: 132.8120, pop: 52000 },
  { name: "北条",       lat: 33.9760, lng: 132.7720, pop: 18000 },
  { name: "南部",       lat: 33.7600, lng: 132.7400, pop: 40000 },
];
