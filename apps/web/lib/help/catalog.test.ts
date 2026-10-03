import { describe, expect, it } from "vitest";

import {
  ALL_ARTICLES,
  HELP_CATEGORIES,
  articlesForRoles,
  articlesInCategory,
  categoriesForRoles,
  getArticle,
  recommendedFor,
  rolesForUser,
  searchArticles,
} from "./index";

describe("help catalog integrity", () => {
  it("every article has EN + AR title, summary and body", () => {
    for (const a of ALL_ARTICLES) {
      expect(a.title.en.length).toBeGreaterThan(0);
      expect(a.title.ar.length).toBeGreaterThan(0);
      expect(a.summary.en.length).toBeGreaterThan(0);
      expect(a.summary.ar.length).toBeGreaterThan(0);
      expect(a.body.en.length).toBeGreaterThan(0);
      expect(a.body.ar.length).toBeGreaterThan(0);
    }
  });

  it("every article belongs to a declared category", () => {
    const keys = new Set(HELP_CATEGORIES.map((c) => c.key));
    for (const a of ALL_ARTICLES) {
      expect(keys.has(a.category)).toBe(true);
    }
  });

  it("slugs are unique", () => {
    const slugs = ALL_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("related slugs resolve to real articles", () => {
    for (const a of ALL_ARTICLES) {
      for (const rel of a.related) {
        expect(getArticle(rel), `${a.slug} → ${rel}`).toBeDefined();
      }
    }
  });
});

describe("role-aware visibility", () => {
  it("guest sees guest topics but not host-only topics", () => {
    const cats = categoriesForRoles(rolesForUser("guest")).map((c) => c.key);
    expect(cats).toContain("payments");
    expect(cats).toContain("cancellations");
    expect(cats).not.toContain("earnings");
    expect(cats).not.toContain("payouts");
    expect(cats).not.toContain("reservations");
  });

  it("host sees host topics plus shared topics", () => {
    const roles = rolesForUser("host");
    const cats = categoriesForRoles(roles).map((c) => c.key);
    expect(cats).toContain("earnings");
    expect(cats).toContain("payouts");
    expect(cats).toContain("reservations");
    expect(cats).toContain("account"); // shared
    expect(cats).toContain("support"); // shared
  });

  it("guest never receives host-only articles", () => {
    const articles = articlesForRoles(ALL_ARTICLES, rolesForUser("guest"));
    expect(articles.some((a) => a.slug === "host-payout-timing")).toBe(false);
  });

  it("anonymous visitors get guest content", () => {
    const cats = categoriesForRoles(rolesForUser(null)).map((c) => c.key);
    expect(cats).toContain("booking");
    expect(cats).not.toContain("payouts");
  });
});

describe("help search", () => {
  it("finds articles by English title", () => {
    const results = searchArticles(
      ALL_ARTICLES,
      rolesForUser("guest"),
      "cancel",
      "en"
    );
    expect(results.map((a) => a.slug)).toContain("guest-cancel-booking");
  });

  it("finds articles by Arabic title", () => {
    const results = searchArticles(
      ALL_ARTICLES,
      rolesForUser("guest"),
      "الإلغاء",
      "ar"
    );
    expect(results.length).toBeGreaterThan(0);
  });

  it("search is role-aware — guest 'payout' does not surface host payout article", () => {
    const results = searchArticles(
      ALL_ARTICLES,
      rolesForUser("guest"),
      "payout",
      "en"
    );
    expect(results.map((a) => a.slug)).not.toContain("host-payout-timing");
  });

  it("host search surfaces host articles", () => {
    const results = searchArticles(
      ALL_ARTICLES,
      rolesForUser("host"),
      "payout",
      "en"
    );
    expect(results.map((a) => a.slug)).toContain("host-payout-timing");
  });

  it("empty query returns nothing", () => {
    expect(searchArticles(ALL_ARTICLES, rolesForUser("guest"), "", "en")).toEqual(
      []
    );
  });
});

describe("contextual recommendations", () => {
  it("booking context recommends cancellation/check-in help", () => {
    const recs = recommendedFor(ALL_ARTICLES, rolesForUser("guest"), "booking");
    expect(recs.map((a) => a.slug)).toContain("guest-cancel-booking");
  });

  it("host earnings context recommends funds-held and payout help", () => {
    const recs = recommendedFor(
      ALL_ARTICLES,
      rolesForUser("host"),
      "host-earnings"
    );
    const slugs = recs.map((a) => a.slug);
    expect(slugs).toContain("host-funds-held");
    expect(slugs).toContain("host-payout-timing");
  });

  it("unknown context falls back to top articles for the role", () => {
    const recs = recommendedFor(ALL_ARTICLES, rolesForUser("guest"), "nope");
    expect(recs.length).toBeGreaterThan(0);
  });
});

describe("categories", () => {
  it("every visible category for a role has articles", () => {
    for (const role of ["guest", "host"] as const) {
      const roles = rolesForUser(role);
      for (const cat of categoriesForRoles(roles)) {
        if (cat.key === "support") continue;
        const articles = articlesInCategory(ALL_ARTICLES, cat.key, roles);
        expect(
          articles.length,
          `${role} / ${cat.key}`
        ).toBeGreaterThan(0);
      }
    }
  });
});
