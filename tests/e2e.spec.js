// =============================================================================
// E2E（Playwright）— P・SPO COMPANY ランディングの主要フローを保証する。
// 走らせ方:  npm i -D @playwright/test && npx playwright install && npm run test:e2e
// 設計: 既存サーバ(8731)を再利用。外部画像/フォント失敗は onerror 設計のため除外。
// =============================================================================
const { test, expect } = require("@playwright/test");

const PAGES = ["index", "app", "area", "live", "me", "price", "guide", "growth", "data", "machimiru", "brief", "critique"];

// ---- 1. スモーク：全ページが 200 で読め、重大な実行時エラーが無い ----
test.describe("smoke: all pages load", () => {
  for (const p of PAGES) {
    test(`${p}.html loads, no fatal console errors`, async ({ page }) => {
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(String(e)));
      const resp = await page.goto(`/${p}.html`);
      expect(resp.status()).toBe(200);
      await page.waitForLoadState("domcontentloaded");
      // 外部CDN(画像/フォント/解析)の読込失敗は onerror フォールバック設計のため許容
      const fatal = errors.filter((e) => !/Failed to load resource|net::ERR|favicon|pspo\.jp|fonts\.g|hacomono|apps\.apple|play\.google/i.test(e));
      expect(fatal, fatal.join("\n")).toHaveLength(0);
    });
  }
});

// ---- 2. ブランド：表示に旧「SUKIMA」が残っていない ----
test("brand: no visible SUKIMA on index", async ({ page }) => {
  await page.goto("/index.html");
  expect(await page.content()).not.toContain("SUKIMA");
});

// ---- 3. Hero（index）回帰ガード＋導線 ----
test.describe("hero (index)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/index.html"); });

  // 不可視バグ回帰ガード: センター構成の主要CTA・タイトルが実際に見えていること
  test("centered hero: title and primary CTA are visible (opacity === 1)", async ({ page }) => {
    await expect(page.locator(".hero-brand__big")).toBeVisible();
    const joinOpacity = await page.locator("#heroJoin").evaluate((el) => getComputedStyle(el).opacity);
    expect(joinOpacity).toBe("1");
    // 旧2カラムのパネルは廃止済み（センター単一カラム）
    await expect(page.locator(".hero-brand__panel")).toHaveCount(0);
  });

  test("antigravity light hero: particle canvas mounts and paints", async ({ page }) => {
    await expect(page.locator("#heroCanvas")).toHaveCount(1);
    // 白地ステージ＋語分割の回帰ガード
    await expect(page.locator(".hero-brand--lift")).toHaveCount(1);
    await expect(page.locator(".hero-brand__big .hero-word")).toHaveCount(2);
    // Canvasが実際に描画している（パーティクル）。rAF描画を待ち、canvas全体を走査（モバイルは粒子が疎なため）
    await page.waitForTimeout(500);
    const painted = await page.locator("#heroCanvas").evaluate((cv) => {
      const c = cv.getContext("2d"); if (!c || !cv.width) return false;
      const d = c.getImageData(0, 0, cv.width, cv.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return true;
      return false;
    });
    expect(painted).toBe(true);
  });

  test("hero shows 3 fact-based trust stats (no member headcount)", async ({ page }) => {
    await expect(page.locator("#heroStats .hero-brand__stat")).toHaveCount(3);
    // 人数（会員数）は出さない方針の回帰ガード
    await expect(page.locator("#heroStats")).not.toContainText("万");
    await expect(page.locator("#heroStats")).not.toContainText("人に1人");
  });

  test("store badges deep-link to real App Store / Google Play (new tab)", async ({ page }) => {
    const badges = page.locator("#heroBadges a");
    await expect(badges).toHaveCount(2);
    await expect(badges.nth(0)).toHaveAttribute("href", /apps\.apple\.com/);
    await expect(badges.nth(1)).toHaveAttribute("href", /play\.google\.com/);
    await expect(badges.nth(0)).toHaveAttribute("target", "_blank");
  });

  test("会員になる → price.html, 無料体験 → beginner", async ({ page }) => {
    await expect(page.locator("#heroJoin")).toHaveAttribute("href", "price.html");
    await expect(page.locator("#heroTrial")).toHaveAttribute("href", /pspo\.jp\/beginner/);
  });

  test("header 会員になる → price.html", async ({ page }) => {
    await expect(page.locator(".site-header a", { hasText: "会員になる" })).toHaveAttribute("href", "price.html");
  });
});

// ---- 4. モバイル：常設ボトムCTAバー（サムゾーン） ----
test.describe("mobile bottom CTA bar", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("landing-cta-bar shows 会員になる → price.html, tappable ≥44px", async ({ page }) => {
    await page.goto("/index.html");
    const bar = page.locator(".landing-cta-bar");
    await expect(bar).toBeVisible();
    const join = bar.locator("a", { hasText: "会員になる" });
    await expect(join).toHaveAttribute("href", "price.html");
    expect(await join.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  });

  test("no horizontal overflow (実寸: scrollWidth ≤ clientWidth)", async ({ page }) => {
    await page.goto("/index.html");
    // overflow-x:clip はスクロールを切るだけで scrollWidth は溢れた子で増えるため、実寸で判定する
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw + 1);
  });
});

// ---- 4b. コンバージョン導線（データ駆動描画の静かな回帰を防ぐ） ----
test.describe("conversion routing (index)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/index.html"); });

  test("エリア別入会: 3件 and area-specific join hrefs", async ({ page }) => {
    const cards = page.locator("#joinAreas a.c-card");
    await expect(cards).toHaveCount(3);
    const hrefs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs.join(" ")).toMatch(/\/join\//);
    expect(hrefs.join(" ")).toMatch(/\/fcjoin\//);
    expect(hrefs.join(" ")).toMatch(/\/shimanami_join\//);
  });

  test("公式LINE 友だち追加 → lin.ee", async ({ page }) => {
    await expect(page.locator("#channels a", { hasText: "友だち追加" })).toHaveAttribute("href", /lin\.ee/);
  });

  test("法人プランを見る → planforcompany", async ({ page }) => {
    await expect(page.locator("#corporate a", { hasText: "法人プラン" })).toHaveAttribute("href", /planforcompany/);
  });

  test("申込: Web入会 → hacomono, 最終CTA → beginner", async ({ page }) => {
    await expect(page.locator("#webJoin")).toHaveAttribute("href", /pspo24\.hacomono\.jp/);
    await expect(page.locator("#ctaTrial")).toHaveAttribute("href", /pspo\.jp\/beginner/);
  });
});

// ---- 4c. 公式リール・ショーケース（antigravity流の無重力タイル） ----
test.describe("reel showcase (index)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/index.html"); });

  test("renders 3 reel tiles with self-hosted mp4 + poster", async ({ page }) => {
    const tiles = page.locator("#reelShowcase .reel-tile");
    await expect(tiles).toHaveCount(3);
    const sources = page.locator("#reelShowcase video source");
    await expect(sources).toHaveCount(3);
    const srcs = await sources.evaluateAll((els) => els.map((e) => e.getAttribute("src")));
    for (const s of srcs) expect(s).toMatch(/^assets\/reels\/web\/.+-loop\.mp4$/);
    // poster は静止フォールバック（reduced-motion / Save-Data 用）に必須
    const posters = await page.locator("#reelShowcase video").evaluateAll((els) => els.map((e) => e.getAttribute("poster")));
    for (const p of posters) expect(p).toMatch(/-poster\.jpg$/);
  });

  test("videos are muted + playsinline + loop (autoplay 規約準拠)", async ({ page }) => {
    const flags = await page.locator("#reelShowcase video").evaluateAll((els) =>
      els.map((v) => ({ muted: v.muted, loop: v.loop, playsInline: v.playsInline })));
    for (const f of flags) { expect(f.muted).toBe(true); expect(f.loop).toBe(true); expect(f.playsInline).toBe(true); }
  });

  test("each tile has a play/pause control (a11y) and links to official IG", async ({ page }) => {
    await expect(page.locator("#reelShowcase .reel-tile__toggle")).toHaveCount(3);
    await expect(page.locator("#reelShowcase .reel-foot a")).toHaveAttribute("href", /instagram\.com\/pspo\.ehime/);
  });
});

// ---- 4d. 店舗数の単一真実源（81）— ページ間で一致する ----
test("store count is single-sourced to 81 across index & price", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator("#heroStats .hero-brand__stat").first()).toContainText("81");
  await page.goto("/price.html");
  await expect(page.locator("#priceHero .figure__l")).toContainText("81 店舗");
  await expect(page.locator("#priceHero .figure__l")).not.toContainText("83");
});

// ---- 5. 料金：プランビルダー（Apple Mac風・積み上げ） ----
test.describe("plan builder (price)", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/price.html"); });

  test("renders 3 base plans + 5 add-ons", async ({ page }) => {
    await expect(page.locator("#builder .bld-opt")).toHaveCount(3);
    await expect(page.locator("#builder .bld-add")).toHaveCount(5);
  });

  test("adding らくらく raises the monthly total (5,478 → 7,128)", async ({ page }) => {
    await expect(page.locator("#builder .figure__n")).toContainText("5,478");
    await page.locator('#builder [data-add="raku"]').click();
    await expect(page.locator("#builder .figure__n")).toContainText("7,128");
  });

  test("ビューティ auto-requires らくらく and raises initial cost to ¥22,000", async ({ page }) => {
    await page.locator('#builder [data-add="beauty"]').click();
    await expect(page.locator('#builder [data-add="raku"]')).toHaveClass(/is-on/);
    await expect(page.locator("#builder .data-row__v")).toContainText("22,000");
    // 使える施設リストが増える
    await expect(page.locator("#builder .bld-gives li")).toContainText(["セルフエステ"]);
  });

  test("switching to SPA base updates the monthly figure (6,578)", async ({ page }) => {
    await page.locator('#builder [data-base="spa"]').click();
    await expect(page.locator("#builder .figure__n")).toContainText("6,578");
  });

  test("このプランで入会する → hacomono", async ({ page }) => {
    await expect(page.locator("#builder a", { hasText: "このプランで入会する" })).toHaveAttribute("href", /pspo24\.hacomono\.jp/);
  });
});

// ---- 6. コンバージョン導線（price） ----
test("price: 無料体験 → beginner", async ({ page }) => {
  await page.goto("/price.html");
  await expect(page.locator("#priceCta a", { hasText: "無料体験" })).toHaveAttribute("href", /pspo\.jp\/beginner/);
});

// ---- 7. アクセシビリティ：主要CTAのタップターゲット（デスクトップ） ----
test("a11y: primary CTAs are ≥44px tall", async ({ page }) => {
  await page.goto("/index.html");
  const heights = await page.locator(".c-btn--lg").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
});
