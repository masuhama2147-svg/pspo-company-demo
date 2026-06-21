// =============================================================================
// insights.js — 分析・経営・研究データ（静的データセット）
// 出典:
//  - 学生BPOチーム一次資料（PSPOさんの課題.xlsx 25/05/31時点, 小山/仲田/坂東/鎌倉/平井 各分析）
//  - 競合調査（多エージェント研究 WF1/WF2、検証フェーズで数値補正済み）
//  - PSPO公式サイト実地確認（店舗ページに「※10分間隔で更新しております」とカメラ映像2枚）
// すべて非PII（個人を特定しない集計値のみ）。Notion原則「公開データは非PII射影」。
// =============================================================================
import { GEO_STORES } from "./geo.js";   // 店舗数の単一真実源（地図ピン＝実データ）

/* ---- PSPO 事実（WF1/WF2 検証済み・出典付き / 2026-06時点） ---------- */
export const PSPO_FACTS = {
  founded: 2016,                 // 約350名 → 2024年 1.6万人超の急成長
  parent: "三福ホールディングス（代表: 中矢孝則）",
  operator: "株式会社P・SPOカンパニー（社長: 村上晃平）",
  group: "グループ資本2.82億円・従業員約730名・約20社",
  priceBasic: 5478,              // 月額 税込（4,980円＋税）30種類以上 使い放題
  priceBasicEx: 4980,            // 税抜
  priceDay: 2980,                // DAYプラン
  priceSpa: 6578,                // SPA P・SPO（5,980＋税）
  registerFee: 11000,            // 初回登録料（学生一次資料）
  stores: GEO_STORES.length,     // 単一真実源＝地図ピンの実数(=81：愛媛77＋愛知3＋北海道1)。公式PRマイルストーンは別途 storesNote「愛媛80店舗突破」
  storesNote: "2026/6 P・SPO夏目店で愛媛県内80店舗突破（旧ジムのリブランド買収＋多業態同時出店で量産）",
  members: 15753,                // 2025-05-31 一次資料（在籍）。公式概要は「16,000超」
  membersAvgTenure: 13.99,       // ヶ月
  // ⚠️目標は出典で別物。混同しない（WF2検証）
  goalOfficial: "公式2030ビジョン：のれん分けカンパニー制で『100社・100人の社長』",
  goalInternal: "『100店舗・会員5万人』は社内資料ベース（出典の確度に留意・対外断定は避ける）",
  goalPress: "2026年報道では『年内100店舗』の表現も（別目標）",
  entry: "顔認証による入退館認証（＝来館タイムスタンプを取得済み。ただしゾーン別・設備別の占有や滞在内訳は未取得）",
  currentCongestion: "公式店舗ページにライブカメラ画像2枚＋「※10分間隔で更新しております」。数値・ゾーン・設備粒度なし＝混雑度はユーザーが目視で判断（2026実地確認）",
  expansionEngine: "親会社・三福綜合不動産が松山商圏の空き店舗を掌握→低コスト調達（『シャッターゼロプロジェクト』『松山三越アンチエイジングパーク 約1000坪』）",
  notable: "2026/3 船井総研フィットネス経営研究会が視察（全国30社超）。モデル自体がPR資産化",
  newVentures: [
    "P・SPO夏目店（旧HERO KING GYM をリブランド・2026/6／愛媛80店舗突破）",
    "P・SPO カラオケ二番町店（無人・無料・2025/2）",
    "ビリヤード＆ダーツ（69店舗目）／うどん『砲麺』（70店舗目）",
    "P・SPO Lounge 松山観光港店（無料ラウンジ・2026/4）",
    "半田市『日常型テーマパーク』（愛知3号店・2026/4）",
  ],
  services: ["24hジム", "自習室", "会員カフェ", "セルフ居酒屋", "サウナ/整い", "コワーキング", "セルフエステ/VISIA肌診断", "ゴルフ/卓球", "カラオケ", "ホットヨガ"],
};

/* ---- 公式サイトの文言・画像（三福HD許諾のうえ引用・事実準拠） ------- */
export const BRAND_COPY = {
  en1: "EVERYDAY MATCHING FOR YOUR LIFE",
  big: "NEVER STOP",
  en3: "PUSH THE LIMITS OF THE IMPOSSIBLE",
  priceLine: "月額 4,980円（税込5,478円）〜",
  storesLine: "愛媛県を中心に 81店舗 使い放題（愛媛77・愛知3・北海道1／2026年時点）",
  slogan: "低価格なのに！トレーニングマシンが充実のラインナップ",
  beautyNote: "※BEAUTY（中央通り・ダイノ・東温・鷹子・北条・今治・ラウンジ&ビューティー2階）利用は、ビューティー登録＋らくらくプラン加入が必要です。",
};
// 公式アセット（pspo.jp）。読み込み失敗時はローカルのダミー/絵文字へフォールバック。
export const OFFICIAL = {
  logo: "https://pspo.jp/wp2022/wp-content/uploads/2024/09/cropped-logonew.png",
  heroPhoto: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/img_facility.jpg",
  cta: {
    trial: "https://pspo.jp/beginner/",
    join: "https://pspo.jp/join/",
    corporate: "https://pspo.jp/planforcompany/",
    area: "https://pspo.jp/area/",
  },
  icon: {
    study: "https://pspo.jp/wp2022/wp-content/uploads/2022/12/icon_study.png",
    cafe: "https://pspo.jp/wp2022/wp-content/uploads/2022/12/icon_cafe.png",
    sauna: "https://pspo.jp/wp2022/wp-content/uploads/2022/12/icon_sauna.png",
    music: "https://pspo.jp/wp2022/wp-content/uploads/2023/03/icon_music.png",
    work: "https://pspo.jp/wp2022/wp-content/uploads/2023/09/icon_work.png",
    sakaba: "https://pspo.jp/wp2022/wp-content/uploads/2023/12/icon_sakaba.png",
    spa: "https://pspo.jp/wp2022/wp-content/uploads/2023/12/icon_spa.png",
    raundly: "https://pspo.jp/wp2022/wp-content/uploads/2023/12/icon_raundly.png",
    kids: "https://pspo.jp/wp2022/wp-content/uploads/2024/10/icon_kids.png",
    food: "https://pspo.jp/wp2022/wp-content/uploads/2024/10/icon_food.png",
    web: "https://pspo.jp/wp2022/wp-content/uploads/2025/07/icon_web.png",
    event: "https://pspo.jp/wp2022/wp-content/uploads/2023/09/icon_event.png",
  },
  // 公式サイトの実写真（読み込み失敗時は onerror で非表示/フォールバック）
  photo: {
    facility: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/img_facility.jpg",
    beginner: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/img_beginner_top.jpg",
    beginner1: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/beginner_001B.jpg",
    beginner2: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/beginner_002B.jpg",
  },
  // 公式の App Store / Google Play バッジ・QR・アプリ端末モック（実物）
  appBadge: {
    apple: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/appApple.png",
    google: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/appGoogle.png",
    appleQr: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/appAppleQr.png",
    googleQr: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/appGoogleQr.png",
    phone: "https://pspo.jp/wp2022/wp-content/uploads/2022/02/appSmapho.png",
  },
  // 実際の Web 入会（申し込み）導線
  hacomono: "https://pspo24.hacomono.jp",
  // 公式アプリ P・SPO24 の実ストアURL（バッジから直接ダウンロードへ）
  appStore: {
    apple: "https://apps.apple.com/jp/app/p-spo24/id1499960318",
    google: "https://play.google.com/store/apps/details?id=com.couponapp2.chain.tac12785",
  },
  // 公式LINE（松山・東温・砥部エリア限定の最新情報・キャンペーン）
  line: { url: "https://lin.ee/KYIzCN8", note: "松山・東温・砥部エリア限定。最新情報・お得なキャンペーン・イベント情報をお届け。" },
  // アプリ会員特典（来店スタンプ→月10/15回でプレゼント・Tポイント）
  appPerks: "来店でスタンプ。月10回・15回の達成で毎月変わるプレゼント（ドラッグストアmacで使えるTポイント300〜500円分など）。",
  // 公式の混雑状況ページ（来館前に空きを確認＝本アプリの“ライブ空き”の原型）
  congestion: "https://pspo.jp/congestion/",
};

/* ---- 入会フロー：エリアで方法が違う（公式 RESERVE/JOIN を整理・一次情報） --- */
export const JOIN_AREAS = [
  { area: "松山・東温・砥部・宇和島・伊予", how: "完全WEB入会", pay: "クレジット または 口座振替", docs: "クレジット/キャッシュカード＋写真付き本人確認書類", url: "https://pspo.jp/join/" },
  { area: "西条・新居浜・大洲", how: "来店して手続き", pay: "現金 または クレジット", docs: "キャッシュカード＋本人確認書類（受付 9:00〜20:00／月会費 最大2ヶ月20日分＋入会金・事務手数料）", url: "https://pspo.jp/fcjoin/" },
  { area: "しまなみ", how: "完全WEB入会", pay: "口座振替", docs: "キャッシュカード＋本人確認書類", url: "https://pspo.jp/shimanami_join/" },
];
export const RESERVE_NOTE = "来店は予約制。入会希望日の2週間前〜受付希望の3時間前まで予約可能。一部の無人店舗は見学予約から。";

/* ---- 協賛チーム（地域貢献＝信頼シグナル） --- */
export const SUPPORTING_TEAMS = [
  { name: "愛媛オレンジバイキングス", logo: "assets/supporting01.jpg", url: "https://orangevikings.jp/" },
  { name: "愛媛プロレス", logo: "assets/supporting04.jpg", url: "http://www.ehime-pro.com/" },
  { name: "愛媛マンダリンパイレーツ", logo: "assets/supporting03.jpg", url: "http://www.m-pirates.jp/" },
  { name: "愛媛FC", logo: "assets/supporting02.jpg", url: "http://www.ehimefc.com/" },
  { name: "愛媛県ビーチバレーボール協会", logo: "assets/supporting05.jpg", url: "http://www.ebv.jp/" },
];

/* ---- お知らせ（公式 pspo.jp の実 NEWS を整理。販促/時限的＝デモ表示） --- */
// url が空文字の項目は非リンク表示（公式トップへの誤着地を避ける）
export const NEWS = [
  { tag: "NEW", t: "P・SPO WORKS 御宝店 OPEN", url: "https://pspo.jp/works/" },
  { tag: "会員特典", t: "Tポイント付与サービスが開始（月会費の支払いで貯まる）", url: "" },
  { tag: "新サービス", t: "P・SPO GALLERY で気軽に個展を開催", url: "https://pspo.jp/gallery/" },
  { tag: "お知らせ", t: "ワールドプラザ店 営業時間を拡大", url: "" },
  { tag: "温泉", t: "とべ温泉、値上げ時代に挑戦（会員特別価格）", url: "https://pspo.jp/tobeonsen/" },
];

/* ---- ヒーロー下の“イベント/広告枠”（右→左で流す） ------------------ */
// お知らせ：短く・要点だけ（タグ＋数語）
export const EVENTS = [
  { tag: "新店",   text: "夏目店オープン" },
  { tag: "無料",   text: "カラオケ歌い放題" },
  { tag: "新生活", text: "友達と入会で特典" },
  { tag: "特典",   text: "空き時間にドリンク1杯無料" },
];

/* ---- 大学生年代の課題（在籍 vs 退会・性別・在籍期間） 一次資料 ------- */
// 出典: PSPOさんの課題.xlsx「元資料」/「小山改訂版」(2025-05-31 在籍, 2024-08〜2025-04 退会)
export const CHURN = {
  asOf: "2025-05-31",
  churnWindow: "2024-08〜2025-04",
  totals: {
    members: 15753, membersAvgTenure: 13.99,
    churners6mo: 3813, churnersAvgTenure: 12.17,
    idealTenure: 10.6,                 // PSPOが述べた理想継続期間
    studentShareOfMembers: 12.49,      // %（18-21歳が在籍に占める割合）
    studentShareOfChurn: 16.3,         // %（18-21歳が退会に占める割合）← 過剰退会
  },
  // ★誠実な前提（WF2検証）: 16.3%は“全体の退会率”ではなく「退会者に占める学生の割合」。
  // 丹.pdf は『PSPO全体の継続率はカフェ・酒場の居場所化で業界平均より良い』と指摘。
  // 真の課題は“学生コホートの過剰退会”と“学生の早期退会(平均≈7ヶ月<理想10.6)”であり、
  // 混雑UXは一要因にすぎない（主因は卒業・県外進学・価値認知・習慣化の弱さ）。
  framing: "16.3%は学生が退会者に占める割合（全体退会率ではない）。学生は在籍12.49%に対し退会16.3%＝過剰退会。",
  // 在籍（人数, 平均在籍ヶ月, 男, 男ヶ月, 女, 女ヶ月, 全会員シェア%）
  enrolled: [
    { age: 18, n: 346, mo: 5.00, m: 286, mMo: 5.1, w: 60, wMo: 4.5, share: 2.19 },
    { age: 19, n: 448, mo: 5.61, m: 335, mMo: 5.6, w: 113, wMo: 5.63, share: 2.84 },
    { age: 20, n: 558, mo: 7.83, m: 432, mMo: 8.43, w: 126, wMo: 5.78, share: 3.54 },
    { age: 21, n: 617, mo: 9.17, m: 454, mMo: 10.5, w: 163, wMo: 5.49, share: 3.91 },
  ],
  enrolledTotal: { n: 1969, mo: 7.25, m: 1507, mMo: 7.79, w: 462, wMo: 5.48 },
  // 退会（人数, 平均在籍ヶ月, 男, 男ヶ月, 女, 女ヶ月, 全退会シェア%）
  churned: [
    { age: 18, n: 225, mo: 7.05, m: 146, mMo: 7.34, w: 79, wMo: 6.51, share: 5.9 },
    { age: 19, n: 113, mo: 6.25, m: 79, mMo: 6.36, w: 34, wMo: 6.0, share: 2.96 },
    { age: 20, n: 140, mo: 7.02, m: 106, mMo: 7.44, w: 34, wMo: 5.73, share: 3.67 },
    { age: 21, n: 144, mo: 8.38, m: 98, mMo: 9.2, w: 46, wMo: 6.63, share: 3.78 },
  ],
  churnedTotal: { n: 622, mo: 7.18, m: 429, mMo: 7.59, w: 193, wMo: 6.22 },
  // 学生が挙げた“なぜ辞める/通わない”の声（一次資料の要約・非PII）
  voices: [
    { who: "小山", point: "個人で加入すると続かない。学生に¥5,500は水道光熱費レベルで契約ハードルが高い。顔認証で取得済みデータを利用数に応じた割引に還元すべき。" },
    { who: "仲田", point: "ジムを利用しないと¥5,500は高い。具体的な目標がない／トレ方法が曖昧なまま行かなくなる。PSPOで何ができるか分かっていない。" },
    { who: "坂東", point: "18歳は卒業で県外へ。帰りの“溜まり場”になっていない。カフェで小声で話したら『うるさい』と言われ、機能していない。" },
    { who: "鎌倉", point: "受験目的の自習室が卒業で役目を終え退会。サービスが多岐だが『自分に合った活用法』を見出しにくく満足度低下。顔認証で勉強時間を計測しランク/バッジでゲーム化を。" },
    { who: "平井", point: "入会約¥8,000＋月約¥5,000で初年度7万円近い。種類が多すぎて分かりにくい。女性のメリットが弱い。完全WEB入会・継続ボーナスを。" },
  ],
};

/* ---- パーソナライズ用ペルソナ（同じデータが人で別物に見えることの実証） */
export const PERSONAS = [
  {
    id: "student_night", label: "学生・夜型", emoji: "🎓", homeStore: "saijo",
    hours: [19, 20, 21, 22], favZones: ["free", "machine"], study: true,
    priceSensitive: true, valuesPrivacy: false,
    headline: "テスト期間の夜、フリーウェイトと自習室をハシゴ。",
    recommend: "21時以降は西条店が空きやすい。連続記録を伸ばすなら火曜・木曜の22時が狙い目。",
    goal: { kind: "study", label: "週の勉強", target: 600, unit: "分" },
  },
  {
    id: "morning", label: "朝活・社会人", emoji: "🌅", homeStore: "kuukou",
    hours: [6, 7, 8], favZones: ["cardio", "machine"], study: false,
    priceSensitive: false, valuesPrivacy: false,
    headline: "出勤前の有酸素＋マシンで一日を始める。",
    recommend: "空港通り店は朝が混みやすい。6時台は比較的空き。週末は7時前が狙い目。",
    goal: { kind: "visit", label: "週の来館", target: 5, unit: "回" },
  },
  {
    id: "woman_safety", label: "女性・安心重視", emoji: "💪", homeStore: "okaido",
    hours: [11, 14, 15], favZones: ["studio", "machine"], study: false,
    priceSensitive: true, valuesPrivacy: true,
    headline: "人が少ない時間に、スタジオとマシンを安心して。",
    recommend: "大街道店は平日昼が最も空く。人が少ない時間が選べるから、待たずに安心して通える。",
    goal: { kind: "visit", label: "週の来館", target: 3, unit: "回" },
  },
  {
    id: "worker_night", label: "社会人ナイト", emoji: "🌙", homeStore: "okaido",
    hours: [20, 21, 22], favZones: ["machine", "sauna"], study: false,
    priceSensitive: false, valuesPrivacy: false,
    headline: "仕事帰りにマシン、締めにサウナで整う。",
    recommend: "大街道店の20-21時はピーク。21時半以降が空き。サウナは22時台が狙い目。",
    goal: { kind: "train", label: "週のトレ", target: 240, unit: "分" },
  },
];

/* ---- 競合ベンチ（WF1/WF2・検証で数値補正済み） --------------------- */
export const COMPETITORS = [
  { name: "Density", region: "🇺🇸", modality: "レーダー(mmWave/匿名)", does: "リアルタイム占有・空き席ウェイファインディング", model: "センサ($149 Waffle)＋SaaS、面積課金", lesson: "“生映像”ではなく“答え（どこが空き）”を返す", url: "https://density.io/" },
  { name: "Butlr", region: "🇺🇸", modality: "サーマル(完全カメラレス)", does: "顔を撮らずに人数・滞在を計測", model: "センサ＋SaaS、20,000台以上", lesson: "更衣室/サウナ等“カメラを置けない場所”を匿名計測＝差別化", url: "https://www.butlr.com/" },
  { name: "Xovis / CrowdVision(→Skyfii/Beonic)", region: "🇨🇭🇦🇺", modality: "3Dステレオ/LiDAR", does: "ステーション別の待ち時間・行列", model: "空港等向けSaaS＋センサ", lesson: "建物全体の人数より“器具別の待ち分数”が行動に効く", url: "https://www.xovis.com/" },
  { name: "Placer.ai", region: "🇺🇸", modality: "モバイルパネル(ハード不要)", does: "人流・商圏・属性データを再販", model: "同じデータを10業種へ横展開（データ収益）", lesson: "蓄積した来館データ自体が第二の収益線になる", url: "https://www.placer.ai/" },
  { name: "バカン VACAN", region: "🇯🇵", modality: "各種センサ/カメラ", does: "混雑可視化＋サイネージ広告(UNVEIL)", model: "可視化＋広告＋自治体(平常↔災害)", lesson: "可視化に広告/B2Gを重ねて収益化", url: "https://vacan.com/" },
  { name: "unerry ウネリー", region: "🇯🇵", modality: "人流ビッグデータ", does: "可視化＋リテールメディア＋データ販売", model: "リカーリング比率90%、約45,000店ネットワーク", lesson: "可視化→行動変容→広告/データ販売の3段ロケット", url: "https://www.unerry.co.jp/" },
  { name: "GYM DX / ABEJA", region: "🇯🇵", modality: "カメラAI", does: "混雑表示＋設備稼働＋転倒検知をスタッフ通知", model: "ジム運営向けSaaS（約¥20,000/月〜）", lesson: "同じセンサ基盤で混雑・安全・設備投資判断を兼ねる", url: "https://www.abejainc.com/" },
  { name: "chocoZAP（RIZAP）", region: "🇯🇵", modality: "アプリ入退館", does: "無人・超低価格ジム", model: "月¥2,980・約127万人・1,597店（2024/8）", lesson: "付加価値サービスが無く“飽き”による退会リスク＝PSPOの逆張り余地", url: "https://chocozap.jp/" },
];

/* ---- 経営・拡大の打ち手（WF1 由来。デモ実装可否で分類。WF2でAI軸を追補） */
export const GROWTH_MOVES = [
  { title: "カメラ映像→“答え”ダッシュボード", cat: "UX", demo: true, impact: "高", effort: "中",
    body: "ゾーン別×設備別の混雑レベルと“あと何台空き”を提示。現行の見づらいカメラ画像を廃し、来店判断に直接使える情報へ。", by: "Density / Xovis" },
  { title: "空き店舗レコメンド＋混雑予報", cat: "需要平準化", demo: true, impact: "高", effort: "中",
    body: "全店比較で『今ならXX店が空き』、時間帯ヒートマップで『火曜19時混雑・21時空き』。入退館ログだけで生成でき新ハード不要。", by: "VergeSense / Googleの混雑する時間帯" },
  { title: "オフピーク誘導ナッジ＆動的特典", cat: "ビジネスモデル", demo: true, impact: "高", effort: "低",
    body: "空き時間帯の来館にドリンク無料/深夜割。ピーク混雑→退会という最大の解約要因を平準化で緩和。", by: "Density課金思想 / VACAN・unerry" },
  { title: "会員パーソナライズ（通い時間/常用店/好みゾーン学習）", cat: "パーソナライズ", demo: true, impact: "高", effort: "中",
    body: "同じ混雑データを一人ひとり別の画面に。『あなたの大街道、いつもの19時は混雑—21時が狙い目』。現行PSPOに完全欠落。", by: "VergeSense / Placer" },
  { title: "顔認証データ活用：ランク＆スタディ/トレ時間バッジ", cat: "退会抑止", demo: true, impact: "高", effort: "中",
    body: "既に取得済みの入退館データを会員に還元。連続記録・ランク・利用連動割引で習慣化。退会の多い18歳/女性/学生に効かせる。", by: "鎌倉/小山 提案 + Apple Fitness" },
  { title: "プライバシー・バッジ（更衣室/サウナは非カメラ計測）", cat: "プライバシー技術", demo: true, impact: "中", effort: "低",
    body: "高プライバシーゾーンは人感(radar/thermal)で映像を保存しないと明示。日本の感度を逆手に取った安心訴求（女性の定着に効く）。", by: "Butlr / Density" },
  { title: "友達紹介・ペアフロー（学生コミュニティ起点）", cat: "ビジネスモデル", demo: true, impact: "中", effort: "低",
    body: "紹介コード/共有リンクで双方に特典。『一緒に通う相手』を増やし、女性・学生の定着を上げる。", by: "学生マーケ戦略" },
  { title: "推定待ち時間（人気器具）", cat: "UX", demo: true, impact: "高", effort: "低",
    body: "空き台数と占有率から『ベンチプレス 推定待ち8分』。ピーク時の最大不満に直接刺さる。", by: "Xovis / CrowdVision" },
  { title: "来館人流レポートの第二収益線（要・法務）", cat: "データ収益", demo: false, impact: "高", effort: "高",
    body: "匿名加工した来館データを近隣テナント/地主/サプリ等へ。⚠️APPI(個人情報保護法)上、匿名加工情報の基準・利用目的・同意の整理が必須。turnkeyではない。", by: "Placer / unerry" },
  { title: "店内会員への時間ターゲティング枠（要・同意取得）", cat: "データ収益", demo: false, impact: "中", effort: "高",
    body: "空き時間に来館中の会員へパートナー特典を配信。⚠️本人位置の広告利用は現行規約外の可能性大、明示同意と目的変更が前提。", by: "Skyfii / VACAN UNVEIL" },
];

/* ---- 海外の急成長AI×フィットネス事例（PSPOへの示唆） --------------- */
// ※WF2（会社現状＋海外AI調査）の確定値で更新予定。現時点は一般公知ベース。
export const OVERSEAS_AI = [
  { name: "EGym", region: "🇩🇪", what: "AIが自動で重量・可動域を設定する筋力マシン群＋会員アプリ", lesson: "“器具×AI”で初心者でも続く。PSPOのTechnogym資産と相性◎" },
  { name: "Future", region: "🇺🇸", what: "リモートの人間コーチ＋アプリで習慣化・継続に全振り", lesson: "継続(=退会防止)を商品の中心に据える設計" },
  { name: "Tonal / Tempo", region: "🇺🇸", what: "カメラ/センサで自宅トレのフォーム・負荷を解析", lesson: "姿勢推定でフォームフィードバック→満足度・成果の可視化" },
  { name: "Sword / Hinge Health", region: "🇺🇸", what: "AI理学療法（姿勢推定×運動処方）で法人・保険向けに急拡大", lesson: "健康データのB2B（法人ウェルネス）展開モデル" },
  { name: "Whoop / Oura", region: "🇺🇸", what: "装着データからAIが回復・睡眠を個別最適化", lesson: "個別最適のレコメンドで毎日アプリを開かせる" },
];

/* ---- AI×OSS 急拡大プレイブック（WF2検証・自前実装の現実解） --------- */
// demo=true は本デモのフロントで概念実証可能、falseは実センサ/バックエンド要。
export const AI_PLAYBOOK_NOTE =
  "現実解の順序：①まずルールベース＋簡易集計（価値可視化・ランク割引・混雑表示）で効果を出す→②データが貯まってからML。" +
  "顔認証は“入退館認証”であり、ゾーン別占有や滞在内訳は追加センサ(YOLO/サーマル等)が前提。" +
  "用途拡大は個人情報保護法の利用目的変更・本人同意が必要。AIコーチ選好は若年層で低い調査もあり“代替”でなく“案内/補助”に留める。";
export const AI_PLAYBOOK = [
  { move: "リアルタイム混雑AI（P・SPOアプリのコア）", aiOss: "時系列予測 Prophet / Nixtla StatsForecast＋人数カウント YOLO/RT-DETR（顔は保持せず頭部数のみ）", demo: true, impact: "高", effort: "低(デモ)/中(本番)",
    why: "顔認証データを“生映像”でなく非PII占有率に射影し『今いちばん空いてる店・時間』を返す。会員に初めてデータを還元。", by: "P・SPOアプリ『カメラ映像じゃなく、答えを』/ Google 混雑する時間帯" },
  { move: "退会リスク・スコアリング＋自動リテンション", aiOss: "勾配ブースティング XGBoost / LightGBM（入退館ログ）＋ナッジ文面はLLM", demo: true, impact: "高", effort: "中",
    why: "来館間隔の急減を検知し18歳・女性・学生へ先回り特典。1人の退会防止LTV>新規CAC＝100店舗化の分母を守る。", by: "丹/鎌倉/角本『やめにくい設計』" },
  { move: "利用量ベース会員ランク＋翌月ダイナミック割引", aiOss: "ルールエンジン＋軽量スコアリング(scikit-learn)。閾値はconfig.jsに集約", demo: true, impact: "高", effort: "低",
    why: "『学生に5,478円は高い』を“使うほど安い”へ。顔認証データを割引で還元し『取ってるのに返ってこない』を解消。", by: "角本『翌月割引』/ 鎌倉『勉強時間ランキング＋特製カード』" },
  { move: "AIコンシェルジュ（多業態クロスセル・案内用途）", aiOss: "RAG: sentence-transformers＋LLM、推薦は LightFM/implicit", demo: true, impact: "高", effort: "中",
    why: "『多機能すぎて1施設しか使わず割高感』の核心解決。未使用業態へ橋渡しし利用業態数↑＝知覚価値↑＝解約↓。", by: "スタバUX(小山)/EGYM Genius（※若年はAIコーチ選好低→案内に限定）" },
  { move: "需要平準化ダイナミック・パーク（オフピーク誘導）", aiOss: "需要予測 Prophet/LightGBM＋特典最適化 contextual bandit(River/Vowpal Wabbit)", demo: true, impact: "中", effort: "中",
    why: "ガラ空き時間に微小インセンティブを自動発行。同一会員数でキャパ実効↑＝出店前に既存店効率を最大化。", by: "小山『顔認証で利用数に応じ割引』/ サージ逆運用" },
  { move: "女性向けAI安心レイヤー", aiOss: "占有データの属性別“集計”のみ（個票破棄）＋オンデバイス画像 MediaPipe/OpenCV", demo: true, impact: "高", effort: "中",
    why: "『今いちばん女性比率が高く空く時間/店舗』を非PIIで提示。安全不安と“男性的空間”の心理障壁を情報で下げる。", by: "角本『女性個室スマートミラー』/ 丹『女性専用タイム』" },
  { move: "AIフォームチェック（姿勢推定・補助）", aiOss: "MoveNet / MediaPipe Pose（TensorFlow.js・ブラウザ完結・映像非保存）", demo: false, impact: "中", effort: "中",
    why: "『トレ方法が曖昧』を解消。無人時間帯でも“一人で正しく”。※医学的矯正やトレーナー代替ではなく補助。", by: "Tonal Smart View / EGYM" },
  { move: "出店ロケーションAI（空き店舗×需要）", aiOss: "地理空間 GeoPandas/H3＋需要GBM＋地図 MapLibre GL JS", demo: true, impact: "高", effort: "中",
    why: "三福綜合不動産の空き店舗在庫×人口/通学路/カニバリで『次に出す業態×立地』を採点。シャッターゼロを高速化。", by: "小山『大学周りPSPOマップ』/ 出店GIS" },
  { move: "学生4年ロックイン（卒業予測リテンション）", aiOss: "生存時間分析 lifelines（Cox/Kaplan-Meier）", demo: true, impact: "高", effort: "中",
    why: "18歳入会→卒業=離脱時期を予測し『4年プラン/卒業お祝い割/県外移籍』を先回り。最大課題の18歳離脱に直撃。", by: "小山『在学中4年契約＋学生アンバサダー』（※未成年は保護者同意）" },
  { move: "AI価値可視化レポート（割高感の解消）", aiOss: "利用ログ集計＋価格テーブル計算＋文面LLM", demo: true, impact: "中", effort: "低",
    why: "『今月使った業態を個別契約なら○○円→実際5,478円』。学生は保護者宛『健康＋節約＋生存確認』も。", by: "山田/鎌倉『割高感』/ 小山『親に節約を見せる』" },
];

/* ---- 経営AIエージェント：ビジョン（松山→全国→世界のAIカンパニー） --- */
export const ROADMAP = [
  { phase: "Phase 1", place: "松山（PSPO攻略）", body: "顧客体験（P・SPOアプリ）でPSPOを勝たせ、顔認証データを会員価値に還元。信頼を獲得しデータ基盤を確立。", icon: "home" },
  { phase: "Phase 2", place: "全国", body: "のれん分けカンパニー制＋AIオペレーション基盤を横展開。各地の生活者データを面で取得し、地方都市DXのモデルに。", icon: "growth" },
  { phase: "Phase 3", place: "世界", body: "『生活者の行動データ × AIエージェント』のOSをSaaS化して輸出。三福HDを松山発のAIカンパニーへ。", icon: "data" },
];

// なぜPSPOのデータが“堀”になるか（B2CのCデータ・松山の10人に1人）
export const MOAT_POINTS = [
  "第一者・本人紐付き・連続・多業態の行動データ＝アグリゲータが“推定で買う”ものを、PSPOは“原本”で持つ（クッキー規制後に強い）。",
  "会員1.5万人＋愛媛80店舗の多業態来館で、松山の生活者の暮らしに広く接点。自治体・県が国勢調査やアンケートでは取れない粒度・頻度。",
  "親会社・三福綜合不動産の空き店舗活用で、データ取得点（店舗）を低コストで面的に増やせる。",
  "顧客体験（P・SPOアプリ）がデータの“蛇口”。使われるほどデータが増え、AIが賢くなる好循環（データ・ネットワーク効果）。",
];

// civic / B2B データビジネス（自治体が取れないものを補完）。trust=信頼性要件。
export const CIVIC_APPS = [
  { app: "リアルタイム市民行動パネル", who: "松山市・愛媛県・地元企業", why: "1.5万人の生活者へ即日アンケート＋行動データ。年単位・低頻度・想起バイアスの公的調査を、連続・行動ベースで補完（EBPM）。", trust: "本人同意・匿名集計・オプトアウトを前提" },
  { app: "商圏・出店インテリジェンス", who: "小売・不動産・三福綜合不動産", why: "誰がいつどこに動くかで出店・テナント・賃料を判断（Placer型）。新業態の送客も最適化。", trust: "匿名加工情報の基準遵守・小population再識別防止" },
  { app: "地域ヘルス／ウェルネス指標", who: "自治体健康政策・保険・企業健保", why: "運動習慣・継続の地域トレンドを健康政策・保健事業のKPIに。", trust: "要配慮情報は集計のみ・目的限定" },
  { app: "防災・人流の平常↔災害 転用", who: "松山市 防災", why: "平常時の混雑分散基盤を、災害時の避難所・経路の混雑可視化へ転用（VACANのphase-free型）。", trust: "緊急時の公益利用範囲を事前合意" },
  { app: "地域経済活性化・観光回遊", who: "商店街・観光・行政", why: "回遊データでイベント効果測定・誘客・空き店舗対策（シャッターゼロ）を可視化。", trust: "店舗単位の集計・同意ベース" },
];

// 信頼性・ガバナンス（市民データを扱う以上、ここが事業の前提）
export const GOVERNANCE = [
  { p: "非PII射影", d: "顧客画面は人数・占有率だけ。顔・個票・氏名を一切持たない（本デモも全データがダミー・非PII）。" },
  { p: "利用目的の同意（APPI）", d: "顔認証は入退館認証。経営/データ事業への転用は利用目的の変更・本人同意・通知公表を前提にする。" },
  { p: "匿名加工情報", d: "第三者提供は法定基準を満たす匿名加工＋再識別防止。小population特有のリスクを評価。" },
  { p: "アクセス制御・監査", d: "最小権限と監査ログ（誰がいつ何を見たか）。秘密はSecret Managerでコードに置かない。" },
  { p: "公平性・バイアス監視", d: "年齢・性別プロファイリングが不利益にならないよう監視。重要判断はhuman-in-the-loop。" },
  { p: "オプトアウト・透明性", d: "会員はデータ利用を選べる。AIの提案は根拠を説明できる（説明可能性）。" },
];

// 実証済みの型（別スケールの first-party データ事業・WF3検証）
export const DATA_ANALOGS = [
  { name: "Amazon", region: "🇺🇸", what: "ログイン購買を持続IDに紐付けた cross-vertical 購買グラフ→closed-loop広告。2026年 広告売上 約$81B見込み。", lesson: "80業態を1IDで横断観測するPSPOの“ミニチュア版”" },
  { name: "Tesco Clubcard", region: "🇬🇧", what: "英28.3M世帯中23M（80%超）をカバー。first-party ROAS 6.60 vs 他媒体3.80。", lesson: "footprint内の高浸透×連続が“測定可能な優越”を生む" },
  { name: "Ponta / T-POINT / 楽天", region: "🇯🇵", what: "複数店舗を1IDで縫う cross-format 購買DB＝守れる・売れるデータ資産。", lesson: "多業態を足すほど堀が深まる（PSPOに直結）" },
  { name: "Kroger / 84.51°", region: "🇺🇸", what: "dunnhumbyとのJV解消で“顧客データへのアクセス”を失った。", lesson: "堀はツールでなく“本人紐付きデータの所有”そのもの" },
];

// 経営判断ダッシュボード：どの分析 → 何を意思決定するか（情報収集AIエージェントの出力）
export const ANALYSES = [
  { analysis: "コホート別 継続率（学生／全体／男女）", data: "顔認証 来館ログ＋年齢・性別", decision: "学生・女性向け定着施策をやるか／予算配分" },
  { analysis: "離脱リスク・スコアリング", data: "来館間隔・最終来館日・利用業態数", decision: "危険会員に“先回り特典”を出すか／誰に" },
  { analysis: "店舗別 稼働・混雑プロファイル", data: "ゾーン／設備の占有・時間帯", decision: "増設・スタッフ配置・新規出店の優先順位" },
  { analysis: "需要予測＋平準化シミュレーション", data: "時間帯別 来館の時系列", decision: "オフピーク特典の時間帯・割引率の設計" },
  { analysis: "利用業態クロスセル分析", data: "1IDの業態横断利用", decision: "次に推す業態・新業態の投入順" },
  { analysis: "商圏・人流（匿名集計）", data: "店舗来館の地理・時間", decision: "出店立地・テナント・販促（※要・法務）" },
];

// AIエージェントが活用する“現状すでにあるデータ”
export const DATA_SOURCES = [
  "顔認証の入退館タイムスタンプ（来館頻度・時間帯）",
  "会員属性（年齢・性別・プラン）",
  "利用業態（ジム／自習室／カフェ／サウナ…）",
  "店舗・エリア（80店舗の分布）",
  "在籍・退会の履歴（継続期間）",
];

// 誠実な限界（市民データを語る上で外せない・WF3検証）
export const LIMITS = [
  "代表性: 会員1.5万人は松山市民の数%。運動・自己投資に積極的／有料サブスクを払える層に偏る。“代表”ではなく“補完”。国勢調査の代替ではない。",
  "同意の射程: 会員が同意したのは入退館の顔認証。都市データ・健康・広告・第三者提供は別目的＝個別の明示オプトイン＋オプトアウトが必要。",
  "正統性: 『誰の許可で都市を測るのか』。民間が市民行動を都市OSへ供給するには行政・市民との合意と説明責任が要る（監視批判リスク）。",
  "匿名加工の実効性: k-匿名化しても店舗×時間×属性の組合せで再識別リスク。法定基準・データクリーンルーム・第三者監査が前提。",
  "スケールの現実: Amazon/Tesco等は構造の相似であり規模の同等ではない。あくまで“松山商圏のearly-stageパネル”。全国規模の断定は過大。",
];

/* ---- 批評：現行の弱点（検証済み・カテゴリ別） ----------------------- */
export const WEAKNESSES = [
  { tag: "可視化", title: "“映像”を見せて“答え”を出さない", now: "ライブカメラ画像2枚・10分更新。混雑度はユーザーが目視で解釈", fix: "占有率ゲージ＋ゾーン別レベル＋『あと何台空き』で来店判断に直結", evidence: "公式店舗ページ「※10分間隔で更新しております」を実地確認" },
  { tag: "粒度", title: "建物まるごと1枚で粒度ゼロ", now: "ゾーン別も設備別も無い。目当ての器具が空いてるか分からない", fix: "マシン/フリーウェイト/有酸素/スタジオ/サウナ…を個別に色＋台数表示", evidence: "ピーク時の最大不満＝器具の空き（学生資料・競合の共通仕様）" },
  { tag: "鮮度", title: "10分前の映像は判断に使えない", now: "約10分間隔更新", fix: "体感リアルタイム（本デモは4秒間隔・イベント駆動）", evidence: "Densityは実質リアルタイム。24hジムのピーク判断には10分は遅い" },
  { tag: "アプリ", title: "iOSアプリなのにChromeへ蹴り出す", now: "ネイティブ体験が分断、通知やパーソナライズの土台にならない", fix: "インストール型PWA（ホーム画面追加・全画面・将来Push）で完結", evidence: "あなたの指摘：アプリ→Web遷移が非常に面倒" },
  { tag: "個別化", title: "パーソナライズが皆無", now: "全員に同じ画面。通い時間帯・常用店・好みゾーンを学習しない", fix: "ペルソナ/履歴に基づき『あなたの最適な時間・店舗・活用法』を提示", evidence: "VergeSense/Placerの個別最適が標準。学生『自分に合った活用法が分からない』" },
  { tag: "資産", title: "顔認証データを死蔵", now: "取得済みの来館データを会員に1mmも還元していない", fix: "ランク・連続記録・利用連動割引・勉強/トレ時間バッジに変換", evidence: "鎌倉/小山『利用数に応じた割引・勉強時間ランキングを』" },
  { tag: "経営", title: "退会という本丸にデータが紐づかない", now: "18歳退会5.9%・女性の在籍が一貫して短い・学生平均7.25ヶ月(<理想10.6)", fix: "離脱リスク可視化＋習慣化フック＋需要平準化でLTVを伸ばす", evidence: "PSPOさんの課題.xlsx（一次資料）" },
  { tag: "IA", title: "プラン・サービスが多すぎて価値が埋もれる", now: "料金表が複雑、目玉(¥300カレー等)と弱いサービスが同列", fix: "3プランに集約し“目玉”を主役に。美容機材(VISIA/ReFa)や女性の安心を明示訴求", evidence: "鎌倉/平井『種類が多すぎてわかりにくい・女性メリット弱い』" },
];
