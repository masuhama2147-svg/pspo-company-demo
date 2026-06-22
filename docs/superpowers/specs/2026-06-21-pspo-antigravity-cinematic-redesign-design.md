# P・SPO ✕ antigravity シネマティック・リデザイン — Design Spec

- 日付: 2026-06-21
- 対象: 集客の入口 `index.html` を旗艦として antigravity.google のデザイン哲学・手法に寄せてレベルアップし、その哲学を全12画面へ横展開する。
- ブランド: 先に統一済みの **P・SPO**（ネイビー×オレンジ／公式ロゴ）。本提案デモは非営利・改善提案。

## 0. 確定事項（このセッションで承認済み）

1. **哲学は全画面・演出は用途別**：集客/経営/B2B はダーク・シネマティック、日常アプリは同じ哲学を「明るく・速く・読みやすく」適用。
2. **質感は再現・スクロール乗っ取りはしない**：antigravity の無重力/グロー/粒子/スクロール連動の“質感”は再現するが、ネイティブスクロールは奪わない。`@supports` と `prefers-reduced-motion` で全ブラウザ・全端末で崩れない。
3. **色は P・SPO**：antigravity の寒色ではなく、ネイビー基調＋オレンジのグロー。手法だけ借りる。
4. **コピーの品位（重要）**：上質・端的・プロフェッショナル。砕けた口語・軽い問いかけ（例「今、空いてる？が、ひと目で。」）は**不使用**。
5. **情報の吟味（重要）**：掲出する PSPO 情報は一次情報に紐付け、誇張しない。各数字に出典コメントを付す。

## 1. antigravity デザイン哲学 → 我々の翻案

| 軸 | antigravity の正体（調査結果） | P・SPO への翻案 |
|---|---|---|
| 思想 | 無重力(lift)・知性・流動 | 軽やかに浮かぶ上質な体験 |
| 色/背景 | ダーク・シネマティック＋グロー/グラデメッシュ＋リング粒子(Houdini PaintWorklet) | ネイビー基調＋オレンジのグロー＋リング粒子（手法流用・PSPO色） |
| 文字 | 大型・幾何学サンセリフ・広い余白 | 既存 Anton / Zen Kaku を一段大型化＋余白拡大 |
| モーション | scroll-driven リビール・段階表示(sibling-index)・@starting-style 入場・カーソル追従光・最小JS | 同様。ただしスクロール乗っ取りはせず、IO フォールバック併用 |
| 実装 | 最新CSS＋`@supports` で段階強化、JSは最小 | 同方針・no-build 維持 |

出典: antigravity.google（JSレンダリングのため直接解析不可）、bram.us「Google Antigravity website rebuilt with Modern CSS」（Houdini PaintWorklet 粒子、scroll-driven、@starting-style、カーソル同期2変数、最小JS）、ブランド解説（lift/intelligence/fluidity）。

## 2. コンテンツ原則（Section 0）

- **出典のある数字だけ**：店舗数・料金・サービス＝pspo.jp 公式、会員/退会＝実Excel の**非PII集計**。定数は `config.js` / `insights.js`（単一の真実の源）から参照し、実装時に各掲出値へ出典コメントを付す。
- **誇張しない**：実データに整合（例「市内 約3%」）。根拠のない訴求は不採用。
- **1文字単位の推敲**：各セクションのコピーはターゲット別に吟味。砕けた表現は使わない（確定事項4）。
- **顧客面はカメラレス・非PII厳守**。

## 3. アーキテクチャ：共有シネマティック層（横展開の土台）

新規の薄い再利用レイヤーを作り、全ページが opt-in する。CSSは既存5層（base/layout/components/pages/motion）を踏襲し追記する。

### 3.1 トークン（css/base.css 追記）
- ダーク・シネマ用: `--cine-bg-0:#0c1116`, `--cine-bg-1:#16243a`, `--glow:（--hot 由来のオレンジ）`, `--cine-fg:#eaf0f4`。
- 面の切替: `body.surface-cine`（または セクション単位 `.surface-cine`）でダーク文脈に。既存ライトトークンはそのまま。

### 3.2 背景エンジン `.cine-bg`（css/components.css 追記）（Section 2）
1層 ネイビーグラデ基調 → 2層 オレンジ・オーロラグロー(`radial-gradient`・低速ドリフト・低不透明) → 3層 リング粒子(Houdini `paint()`、`@supports (background: paint(x))` 判定、無対応は SVG ドット/静的グローへフォールバック) → 4層 微グレイン(既存 feTurbulence・低不透明)。
- カーソル追従光: `--mx/--my` のCSS変数を使った `radial-gradient`。タッチ端末は自動オフ。
- 粒子はヒーロー等の限定領域のみ＋高性能端末＋`prefers-reduced-motion` で停止（GPU負荷管理）。

### 3.3 モーション体系（css/motion.css 追記 + js/ui.js フック）（Section 3）
- リビール: 既存 `.io` を **scroll-driven**(`animation-timeline: view()`)へ格上げ、`@supports` で非対応は既存 `observeReveal`(IntersectionObserver) にフォールバック。`--i` で段階表示。
- 入場: ヒーローを `@starting-style` で下からフェード。
- 浮遊: `.levitate`（ガラスカード/キービジュアル、ゆっくり）。`prefers-reduced-motion` で停止。
- CTA: 主ボタンに軽いスケール＋グローのホバー。
- パララックス: 背景の施設写真を低速 `translateY`（scroll-driven・低コスト）。
- 全モーションは `prefers-reduced-motion: reduce` で無効化。

### 3.4 新規JS（最小）
- `js/cine.js`（新規・任意読込）: (a) PaintWorklet 登録（対応時のみ）、(b) `pointermove` → `--mx/--my` 同期（rAF スロットル、タッチ無効）。両方とも失敗・非対応で安全に無視。
- `assets/ring-particles.js`（Houdini worklet・新規）: bram.us 系のリング粒子。`@supports` 非対応環境では読み込まれても無害。

## 4. Section 1：ヒーロー（旗艦 index）

レイアウトは既存 `.hero-brand` 構造を活かしつつシネマ化。
- 背景: `.cine-bg`（ネイビー＋オレンジグロー＋粒子＋グレイン）。施設実写は**極暗・低速パララックス**で奥に（実在感のみ残す）。既存の虹色2blobは廃止（オレンジグローへ統合）。
- タイポ: eyebrow → 大見出し(Anton, 一段大型・トラッキング調整) → リード → ガラスカード の順に段階リビール。
- ガラスカード(`backdrop-filter` 磨りガラス・微浮遊)に CTA／ストアバッジ／QR。
- 確定コピー（脱カジュアル・実数値）:
  - eyebrow: `REAL-TIME AVAILABILITY × YOUR BEST TIME`
  - 大見出し: `NEVER STOP`（据置・変更可）
  - リード: `リアルタイムの空き状況と、あなたに最適な時間を。`
  - カード見出し: `空き状況を、リアルタイムに可視化。`
  - カード補足: `30種類以上のサービスが月額一本。愛媛ほか83店舗で利用可能。`（¥5,478・83店舗・30種＝出典付き）
- 4役割ルーターは中核として維持（来訪者を 使う人／はじめての人／自社経営／地元企業 へ）。

## 5. Section 4：横展開ルール（2ティア）

**Tier A — シネマティック（ダーク）**: `index / machimiru / data / growth / brief / critique`
→ フル `.cine-bg`＋大型タイポ＋グロー＋scroll リビール＋ヒーロー浮遊。

**Tier B — 日常アプリ（ライト・高速）**: `app / area / live / me / price / guide`
→ 同じ哲学（広い余白・大型タイポスケール・リビール・要所グロー・上質コピー）を**明るい背景**で。粒子は不使用、可読性・速度・サムゾーン最優先。シネマ質感は主要カードの小グローのみ。

ヘッダ/フッタの公式ロゴは `--fg` 追従のため両ティアで整合。

## 6. 実装フェーズ（段階的・各フェーズで検証）

1. **共有シネマ層＋index旗艦**: トークン/`.cine-bg`/モーション/`cine.js`/worklet を作り、`index.html` を再構築。検証。
2. **Tier A 展開**: machimiru/data/growth/brief/critique に `.cine-bg`＋シネマ・ヘッダ適用。
3. **Tier B 適用**: app/area/live/me/price/guide に哲学適用（明るさ・可読性維持）。
- 各フェーズで CSS 版数バンプ（現 v15 → 以降）。

## 7. 性能・アクセシビリティ・互換

- **段階的強化**: 最新CSS（scroll-driven, @starting-style, paint()）は全て `@supports` で判定し、非対応はフォールバック（IO リビール／静的グロー）。崩れない。
- **reduced-motion**: 粒子・浮遊・パララックス・リビールを停止。
- **コントラスト**: ダーク面でも本文 AA を維持（`--cine-fg` と十分な明度差）。
- **性能**: 粒子は限定領域＋高性能端末のみ、`content-visibility`/`will-change` を要所のみ。画像は既存方針（lazy・aspect-ratio 固定・onerror）。
- **no-build 維持**: ES modules・バニラ。worklet は静的ファイル。

## 8. 変更ファイル（想定）

- 追記: `css/base.css`(トークン), `css/components.css`(`.cine-bg`/グロー/ガラス), `css/motion.css`(リビール/浮遊/入場), `css/layout.css`(ヘッダのダーク文脈)。
- 新規: `js/cine.js`, `assets/ring-particles.js`(worklet)。
- 改修: `index.html`(旗艦) → 以降 Tier A/B 各ページ。`js/ui.js`(cine.js フック読込)。

## 9. 検証

- 静的: 全ページ HTTP 200、`@supports` フォールバック経路の存在、`prefers-reduced-motion` 分岐、コントラスト、SUKIMA 残存ゼロ（維持）。
- 実行: jsdom 未導入のため、構文チェック＋配信確認＋（ユーザー側で）実ブラウザ目視。社長デモ想定で Safari/Chrome 両方の見えを確認してもらう。
- 各掲出数値の出典コメントが入っているかをレビュー。

## 10. スコープ外（YAGNI）

- スクロールジャック、メガメニュー刷新、`@scope`/anchor-positioning など対応の薄い最新CSSへの依存。
- 新しいデータ取得や PII の取り扱い。顧客面のカメラ表現。
- 配色そのものの変更（PSPO ネイビー×オレンジを維持）。

## 11. リスクと対策

- **粒子/最新CSSの非対応**→ `@supports` フォールバックで質感を落としても破綻させない。
- **ダーク面の可読性**→ AA 担保、グローは低不透明、本文は `--cine-fg`。
- **日常アプリの使いやすさ低下**→ Tier B はライト維持、粒子なし、サムゾーン優先。
- **情報の正確性**→ 全数値を単一の真実の源から参照＋出典コメント＋実装後レビュー。
- **git リポジトリ root が想定外（ホーム配下）** のため、本 spec の自動コミットは行わない（必要時に明示依頼で対応）。
