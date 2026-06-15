"use client";

import { useState } from "react";
import { UIcon } from "@upshot/ui";
import { THEME_COOKIE, nextTheme, resolveTheme, type ThemePref } from "@/lib/theme";

/**
 * Three-state theme toggle: System -> Light -> Dark -> System.
 * Persists the preference to the theme cookie and updates <html class="dark">
 * live (no reload). The initial preference is passed from the server layout so
 * the button label is correct on first paint.
 */
export function ThemeToggle({ initial = "system" }: { initial?: ThemePref }) {
  const [pref, setPref] = useState<ThemePref>(initial);

  function apply(next: ThemePref) {
    setPref(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const prefersDark =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = resolveTheme(next, prefersDark);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }

  return (
    <button
      type="button"
      aria-label={`Theme: ${pref}`}
      onClick={() => apply(nextTheme(pref))}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 12,
        border: "none",
        background: "transparent",
        color: "var(--text-3)",
        cursor: "pointer",
      }}
    >
      {/* dark -> moon; light/system -> sun (system at reduced opacity) */}
      <span style={{ opacity: pref === "system" ? 0.55 : 1, display: "inline-flex" }}>
        <UIcon name={pref === "dark" ? "moon" : "sun"} size={20} />
      </span>
    </button>
  );
}
