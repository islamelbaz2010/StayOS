import {
  HELP_CATEGORIES,
  articlesForRoles,
  articlesInCategory,
  categoriesForRoles,
  recommendedFor,
  rolesForUser,
  searchArticles,
  type HelpArticle,
  type HelpRole,
  type Localized,
} from "./catalog";
import { GUEST_ARTICLES } from "./articles-guest";
import { HOST_ARTICLES } from "./articles-host";

export const ALL_ARTICLES: HelpArticle[] = [...GUEST_ARTICLES, ...HOST_ARTICLES];

export function getArticle(slug: string): HelpArticle | undefined {
  return ALL_ARTICLES.find((a) => a.slug === slug);
}

export {
  HELP_CATEGORIES,
  articlesForRoles,
  articlesInCategory,
  categoriesForRoles,
  recommendedFor,
  rolesForUser,
  searchArticles,
};
export type { HelpArticle, HelpRole, Localized };
