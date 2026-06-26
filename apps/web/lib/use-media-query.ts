"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media-query hook. Returns `defaultValue` on the server and the first
 * client render (so SSR markup matches hydration), then the live result after mount.
 * The planner defaults to `true` (desktop/Workspace) so the common case never flashes.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (): void => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
