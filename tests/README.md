# E2E テスト（Playwright）

P・SPO COMPANY ランディングの主要フローを保証する End-to-End テスト。

## セットアップ & 実行

```bash
# 依存とブラウザを導入（初回のみ）
npm install
npx playwright install chromium

# サーバを起動（別ターミナル。既に動いていれば不要＝reuseExistingServer）
npm start            # → http://localhost:8731

# E2E を実行（desktop 1440px + mobile iPhone13 の2プロジェクト）
npm run test:e2e
npm run test:e2e:ui  # UIモードで対話実行
npm run test:report  # 直近のHTMLレポートを開く
```

> `webServer.reuseExistingServer: true` のため、すでに 8731 で `node serve.js` が動いていればそれを使い、無ければ自動起動します。

## カバレッジ（`tests/e2e.spec.js`）

1. **スモーク**：全12ページが 200 で読め、致命的なコンソールエラーが無い（外部CDN画像/フォントの失敗は onerror 設計のため除外）。
2. **ブランド**：表示に旧「SUKIMA」が残っていない。
3. **Hero**：
   - パネルが実際に可視（`opacity===1`）＝`.levitate` が `.reveal` を上書きして不可視化したバグの**回帰ガード**。
   - 信頼スタット4つ。
   - ストアバッジが実 App Store / Google Play へ（別タブ）。
   - 「会員になる」→ `price.html`、「無料体験」→ `pspo.jp/beginner`、ヘッダーの「会員になる」→ `price.html`。
4. **モバイル**：常設ボトムCTAバーが表示・「会員になる」→ `price.html`・タップ高 ≥44px・横スクロール暴発なし。
5. **プランビルダー**：ベース3＋オプション5描画／らくらく追加で月額 5,478→7,128／ビューティはらくらく自動必須＋初回¥22,000＋使える施設にセルフエステ追加／SPA切替で 6,578／「このプランで入会する」→ hacomono。
6. **導線**：price の「無料体験」→ beginner。
7. **A11y**：主要CTA（`.c-btn--lg`）が ≥44px。

## 注意
- 本デモは vanilla（no-build）。テストのみ Playwright を devDependency として追加。
- 料金・URL等は一次情報（pspo.jp / hacomono / 各ストア）に紐付け。値が変わったらテストの期待値も更新する。
