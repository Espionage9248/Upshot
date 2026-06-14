import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth-guard";
import { THEME_COOKIE, type ThemePref } from "@/lib/theme";
import { UpRail } from "@/components/up-rail";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Authenticated app shell. Server Component: re-checks the session (defence in
 * depth — a direct hit that bypasses middleware is still bounced to /login).
 * This makes the route dynamic, which is expected.
 *
 * Renders the rail + a main content column; each page supplies its own <TopBar>.
 */
export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactNode> {
  await requireSession();

  const pref =
    ((await cookies()).get(THEME_COOKIE)?.value as ThemePref | undefined) ??
    "system";

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      <UpRail />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "14px 24px 0",
          }}
        >
          <ThemeToggle initial={pref} />
        </div>
        <main style={{ flex: 1, padding: "16px 24px 32px", minWidth: 0 }}>
          {children}
        </main>
      </div>
      {/* Task 18: mount <CommandPalette/> */}
    </div>
  );
}
