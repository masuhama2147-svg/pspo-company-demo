// =============================================================================
// onboard.js — 初回オンボーディング・ウィザード（人間工学で“自分仕様”にする）
// 用途 → ホーム店舗 → 時間帯 を選ぶと、ホーム/マイページ/レコメンドが即パーソナライズ。
// 人間工学: 1問1画面(段階的開示) / 選択肢は最小(Hick) / 標的56px・下部固定(Fitts・親指ゾーン)
//           / 選択に即時反応(Doherty) / 完了に“ご褒美”の山場(ピーク・エンドの法則)。
// 状態は localStorage（sukima-prefs / sukima-profile / sukima-onboarded）。PII無し。
// =============================================================================
import { icon, setProfile, setPrefs, toast } from "./ui.js";
import { STORES, STORE_GEO } from "./data.js";
import { geocodeQuery, haversineKm, fmtKm } from "./geo.js";

const ONBOARDED_KEY = "sukima-onboarded";
export function isOnboarded() { try { return localStorage.getItem(ONBOARDED_KEY) === "1"; } catch (e) { return true; } }
function markOnboarded() { try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch (e) {} }

// 用途（Hick: 5枠に厳選）
const PURPOSES = [
  { id: "train", emoji: "🏋️", label: "筋トレ・運動" },
  { id: "study", emoji: "📚", label: "自習・作業" },
  { id: "sauna", emoji: "🧖", label: "サウナで整う" },
  { id: "cafe",  emoji: "☕", label: "カフェ・居場所" },
  { id: "habit", emoji: "🌙", label: "ながら習慣化" },
];
const TIMES = [
  { id: "morning", emoji: "🌅", label: "朝", sub: "6〜10時" },
  { id: "day",     emoji: "☀️", label: "昼", sub: "11〜17時" },
  { id: "night",   emoji: "🌙", label: "夜", sub: "18〜26時" },
];

// 用途×時間帯 → 既存ペルソナへ自動マッピング（性別ラベルではなく“通い方”で最も近いもの）
function mapPersona({ purposes, time }) {
  const study = purposes.includes("study");
  if (time === "morning") return "morning";
  if (time === "night") return study ? "student_night" : "worker_night";
  if (time === "day") return study ? "student_night" : "woman_safety";
  return study ? "student_night" : "worker_night";
}

export function startOnboarding({ onDone } = {}) {
  if (document.querySelector(".ob-overlay")) return;
  const state = { step: 0, purposes: [], homeStoreId: null, time: null };

  const ov = document.createElement("div");
  ov.className = "ob-overlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "はじめの設定");
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("show"));
  document.documentElement.style.overflow = "hidden";

  const close = (done) => {
    ov.classList.remove("show");
    document.documentElement.style.overflow = "";
    setTimeout(() => ov.remove(), 300);
    markOnboarded();
    if (done) {
      const personaId = mapPersona(state);
      setProfile(personaId);
      setPrefs({ purposes: state.purposes, homeStoreId: state.homeStoreId, time: state.time });
    }
    onDone && onDone(done);
  };

  const STEPS = ["purpose", "store", "time", "done"];
  function go(n) {
    state.step = Math.max(0, Math.min(STEPS.length - 1, n));
    render();
    const t = ov.querySelector(".ob-title"); if (t) { t.setAttribute("tabindex", "-1"); t.focus(); } // 新ステップを読み上げ
  }

  function dots() {
    return `<div class="ob-dots" aria-hidden="true">${[0,1,2].map((i)=>`<span class="${i<=state.step && state.step<3 ? 'is-on':''} ${i===state.step?'is-cur':''}"></span>`).join("")}</div>`;
  }

  function render() {
    const s = STEPS[state.step];
    if (s === "purpose") return renderPurpose();
    if (s === "store") return renderStore();
    if (s === "time") return renderTime();
    return renderDone();
  }

  // --- Step 1: 用途（複数可） ---
  function renderPurpose() {
    ov.innerHTML = `
      <div class="ob-card">
        <button class="ob-skip" data-skip type="button">スキップ</button>
        ${dots()}
        <p class="ob-eyebrow">STEP 1 / 3</p>
        <h2 class="ob-title">何を目的に、通う？</h2>
        <p class="ob-sub">あてはまるものを選んでください（複数OK）。あなた仕様の画面に変わります。</p>
        <div class="ob-grid">
          ${PURPOSES.map((p)=>`<button class="ob-opt ${state.purposes.includes(p.id)?'is-sel':''}" data-purpose="${p.id}" type="button" aria-pressed="${state.purposes.includes(p.id)}">
            <span class="ob-opt__emoji">${p.emoji}</span><span class="ob-opt__label">${p.label}</span>
            <span class="ob-opt__check">${icon("check",{size:16})}</span></button>`).join("")}
        </div>
        <div class="ob-foot">
          <p class="ob-foot-hint" id="obFootHint" ${state.purposes.length?'hidden':''}>ひとつ以上えらぶと、次へ進めます。</p>
          <button class="c-btn c-btn--primary c-btn--block c-btn--xl" id="obNext" type="button" ${state.purposes.length?'':'disabled'}>次へ</button>
        </div>
      </div>`;
    ov.querySelectorAll("[data-purpose]").forEach((b)=>b.addEventListener("click",()=>{
      const id=b.dataset.purpose;
      const i=state.purposes.indexOf(id);
      if(i>=0) state.purposes.splice(i,1); else state.purposes.push(id);
      // 全再描画せず該当ボタンだけ更新＝フォーカスを失わない（a11y）
      const on=state.purposes.includes(id);
      b.classList.toggle("is-sel", on); b.setAttribute("aria-pressed", on);
      ov.querySelector("#obNext").disabled = !state.purposes.length;
      const fh=ov.querySelector("#obFootHint"); if(fh) fh.hidden = !!state.purposes.length;
    }));
    ov.querySelector("#obNext").addEventListener("click",()=>go(1));
    wireChrome();
  }

  // --- Step 2: ホーム店舗（住所→近い順・位置情報なし） ---
  function renderStore() {
    const buildList = (q) => {
      const origin = q ? geocodeQuery(q) : null;
      const items = STORES.map((st)=>{
        const geo = STORE_GEO[st.id];
        const d = origin && geo ? haversineKm(origin, geo) : null;
        return { st, d };
      });
      if (origin) items.sort((a,b)=>(a.d??1e9)-(b.d??1e9));
      return { origin, items };
    };
    const draw = (q="") => {
      const { origin, items } = buildList(q);
      ov.querySelector("#obHint").innerHTML = origin
        ? `${icon("check",{size:14})} <b>${origin.label}</b> から近い順`
        : `📍 位置情報は使いません。地名で近い順に。`;
      ov.querySelector("#obHint").className = "ob-hint" + (origin ? " ob-hint--ok" : "");
      ov.querySelector("#obStoreList").innerHTML = items.map(({st,d})=>`
        <button class="ob-store ${state.homeStoreId===st.id?'is-sel':''}" data-store="${st.id}" type="button" aria-pressed="${state.homeStoreId===st.id}">
          <span class="ob-store__main"><b>${st.name}</b><span class="ob-store__area">${st.area}</span></span>
          ${d!=null?`<span class="ob-store__km">${fmtKm(d)}</span>`:""}
          <span class="ob-store__check">${icon("check",{size:16})}</span>
        </button>`).join("");
      ov.querySelectorAll("[data-store]").forEach((b)=>b.addEventListener("click",()=>{
        state.homeStoreId=b.dataset.store; draw(ov.querySelector("#obPlace").value.trim());
        ov.querySelector("#obNext").disabled=false;
      }));
    };
    ov.innerHTML = `
      <div class="ob-card">
        <button class="ob-back" data-back type="button">${icon("arrow",{size:16})} 戻る</button>
        ${dots()}
        <p class="ob-eyebrow">STEP 2 / 3</p>
        <h2 class="ob-title">よく行く店舗は？</h2>
        <p class="ob-sub">住所・駅・地名を入れると、近い順に並びます。</p>
        <div class="c-search c-search--lg" style="margin-top:6px">
          <span class="c-search__ic">${icon("target",{size:20})}</span>
          <input id="obPlace" class="c-search__input" type="search" inputmode="search" autocomplete="off" placeholder="例: 大街道 / 西条 / 今治" aria-label="住所・駅・地名" />
        </div>
        <p class="ob-hint" id="obHint"></p>
        <div class="ob-store-list" id="obStoreList"></div>
        <div class="ob-foot">
          <button class="c-btn c-btn--subtle c-btn--block" id="obSkipStore" type="button">あとで決める</button>
          <button class="c-btn c-btn--primary c-btn--block c-btn--xl" id="obNext" type="button" ${state.homeStoreId?'':'disabled'}>次へ</button>
        </div>
      </div>`;
    draw("");
    let t=null;
    ov.querySelector("#obPlace").addEventListener("input",(e)=>{ clearTimeout(t); const v=e.target.value.trim(); t=setTimeout(()=>draw(v),200); });
    ov.querySelector("#obNext").addEventListener("click",()=>go(2));
    ov.querySelector("#obSkipStore").addEventListener("click",()=>{
      if(!state.homeStoreId){ state.homeStoreId="okaido"; toast("ホーム店舗は松山大街道店に仮設定しました（あとで変更できます）"); }
      go(2);
    });
    wireChrome();
  }

  // --- Step 3: 時間帯 ---
  function renderTime() {
    ov.innerHTML = `
      <div class="ob-card">
        <button class="ob-back" data-back type="button">${icon("arrow",{size:16})} 戻る</button>
        ${dots()}
        <p class="ob-eyebrow">STEP 3 / 3</p>
        <h2 class="ob-title">よく通う時間帯は？</h2>
        <p class="ob-sub">空いてる時間のおすすめを、その時間帯に合わせます。</p>
        <div class="ob-grid ob-grid--3">
          ${TIMES.map((tm)=>`<button class="ob-opt ob-opt--time ${state.time===tm.id?'is-sel':''}" data-time="${tm.id}" type="button" aria-pressed="${state.time===tm.id}">
            <span class="ob-opt__emoji">${tm.emoji}</span><span class="ob-opt__label">${tm.label}</span><span class="ob-opt__sub">${tm.sub}</span></button>`).join("")}
        </div>
        <div class="ob-foot">
          <p class="ob-foot-hint" id="obFootHint" ${state.time?'hidden':''}>時間帯をえらぶと、完了できます。</p>
          <button class="c-btn c-btn--primary c-btn--block c-btn--xl" id="obFinish" type="button" ${state.time?'':'disabled'}>完了して、はじめる</button>
        </div>
      </div>`;
    ov.querySelectorAll("[data-time]").forEach((b)=>b.addEventListener("click",()=>{
      state.time=b.dataset.time;
      ov.querySelectorAll("[data-time]").forEach((x)=>{ const on=x===b; x.classList.toggle("is-sel",on); x.setAttribute("aria-pressed",on); });
      ov.querySelector("#obFinish").disabled=false;
      const fh=ov.querySelector("#obFootHint"); if(fh) fh.hidden=true;
    }));
    ov.querySelector("#obFinish").addEventListener("click",()=>go(3));
    wireChrome();
  }

  // --- 完了（ピーク・エンド：達成の山場） ---
  function renderDone() {
    const persona = mapPersona(state);
    const labelMap = { morning:"朝活", student_night:"夜の学生", worker_night:"ナイト", woman_safety:"デイタイム" };
    ov.innerHTML = `
      <div class="ob-card ob-card--done">
        <div class="ob-done-burst" aria-hidden="true">${[...Array(10)].map((_,i)=>`<span style="--i:${i}"></span>`).join("")}</div>
        <div class="ob-done-check">${icon("check",{size:44})}</div>
        <h2 class="ob-title">準備、完了！</h2>
        <p class="ob-sub">あなた仕様（<b class="text-accent">${labelMap[persona]||"あなた"}</b>）にしました。<br>ホーム・マイページが、あなたに合わせて変わります。</p>
        <div class="ob-foot">
          <button class="c-btn c-btn--primary c-btn--block c-btn--xl" id="obStart" type="button">P・SPO をはじめる</button>
        </div>
      </div>`;
    ov.querySelector("#obStart").addEventListener("click",()=>{ close(true); toast("ようこそ！あなた仕様にしました", { icon:"sparkles" }); });
    // 自動では閉じない（達成画面を味わってもらう＝ピーク・エンド）
  }

  function wireChrome() {
    ov.querySelector("[data-skip]")?.addEventListener("click",()=>close(false));
    ov.querySelector("[data-back]")?.addEventListener("click",()=>go(state.step-1));
  }

  // キーボード: Esc=戻る/スキップ、Tab はオーバーレイ内に閉じ込める（focus trap）
  ov.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (state.step === 0) close(false); else if (state.step < 3) go(state.step - 1); return; }
    if (e.key === "Tab") {
      const f = ov.querySelectorAll('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  render();
}
