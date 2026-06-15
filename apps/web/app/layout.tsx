import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Figtree, JetBrains_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { THEME_COOKIE, type ThemePref } from "@/lib/theme";
import "./globals.css";

// Self-hosted via next/font; the `variable` classes override the token-declared
// --font-sans / --font-mono families (same family names, now self-hosted → no FOUT).
const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Upshot",
  description: "Personal budgeting — V2",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-180.png",
  },
  manifest: "/manifest.webmanifest",
};

// Pre-paint, before React hydrates: resolve "system"/absent prefs against the
// OS setting and add `.dark` so there is no flash of the wrong theme. Explicit
// "light"/"dark" prefs are already applied server-side via the <html> class.
const noFlashScript = `(function(){try{var m=document.cookie.match(/(?:^|; )upshot-theme=([^;]+)/);var p=m?decodeURIComponent(m[1]):"system";if(p!=="light"&&p!=="dark"){p=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.classList.toggle("dark",p==="dark");}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactNode> {
  const pref = (await cookies()).get(THEME_COOKIE)?.value as
    | ThemePref
    | undefined;
  // CSP nonce minted per-request by middleware (Task 25). The inline theme
  // script must carry it or the locked-down script-src would block it.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // Server can only honour explicit prefs; "system"/absent resolve client-side.
  const htmlClass = [
    figtree.variable,
    jetbrainsMono.variable,
    pref === "dark" ? "dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={htmlClass}>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
