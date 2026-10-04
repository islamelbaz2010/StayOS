/**
 * QA/acceptance build gating.
 *
 * QA login controls (seeded acceptance accounts via /auth/dev-token) are
 * visible only when:
 *   - running under Metro (__DEV__), or
 *   - the dedicated `qa` EAS profile set EXPO_PUBLIC_QA_MODE=1 at build time.
 *
 * The `preview` and `production` profiles never set the env flag, and
 * /auth/dev-token itself only exists on development/staging backends —
 * production builds can never mint sessions this way.
 */
export function isQaLoginEnabled(
  isDev: boolean = __DEV__,
  qaMode: string | undefined = process.env.EXPO_PUBLIC_QA_MODE
): boolean {
  return isDev || qaMode === "1";
}
