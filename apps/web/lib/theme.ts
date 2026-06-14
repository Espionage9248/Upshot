/**
 * Pure theme helpers — no React / next imports, so this is safe to import from
 * the edge middleware, Server Components, Client Components, and unit tests.
 *
 * The cookie stores the user PREFERENCE ("system" | "light" | "dark"). The
 * resolved (concrete) theme for "system" depends on the OS `prefers-color-scheme`
 * which only the client knows — so the server renders "system" without a forced
 * class and a tiny inline script resolves it before first paint (see app/layout).
 */

export const THEME_COOKIE = "upshot-theme";

export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

/**
 * Resolve a stored preference (or anything) to a concrete theme.
 * "light"/"dark" are honoured verbatim; "system" / unknown / undefined fall back
 * to the OS preference (`prefersDark`).
 */
export function resolveTheme(
  pref: ThemePref | string | undefined,
  prefersDark: boolean,
): ResolvedTheme {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return prefersDark ? "dark" : "light";
}

/**
 * Next preference in the toggle cycle: System -> Light -> Dark -> System.
 * Anything unrecognised starts the cycle at "light".
 */
export function nextTheme(current: ThemePref | string | undefined): ThemePref {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  if (current === "dark") return "system";
  return "light";
}
