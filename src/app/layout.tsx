import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import HeaderShell from "@/components/HeaderShell";
import BottomNav from "@/components/BottomNav";
import BottomNavShell from "@/components/BottomNavShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import Toaster from "@/components/Toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taskly",
  description:
    "Carnet personnel d'apprentissage, gestion de tâches et emploi du temps — 100% hors-ligne.",
  applicationName: "Taskly",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Taskly",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/pwa-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/pwa-192x192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a11" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Applique le thème choisi par l'utilisateur (auto / clair / sombre) avant le
 * premier rendu, afin d'éviter tout clignotement. Le même script est
 * rejoué par src/lib/theme.ts côté client.
 */
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("taskly:theme");if(s!=="light"&&s!=="dark"&&s!=="auto"){s="auto"}var d=s==="auto"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;var e=document.documentElement;e.dataset.theme=d;e.dataset.themePreference=s;e.style.colorScheme=d;}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2.5 focus:text-label focus:font-medium focus:text-primary-foreground focus:shadow-lg"
        >
          Aller au contenu principal
        </a>

        <Suspense fallback={<HeaderShell />}>
          <AppHeader />
        </Suspense>

        <main id="main-content" tabIndex={-1} className="flex-1 pb-24 outline-none lg:pb-0">
          {children}
        </main>

        <footer className="border-t border-border bg-card/40 pb-24 lg:pb-0">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-caption text-muted-opacity sm:flex-row sm:px-6 lg:px-8">
            <p>Taskly — vos données restent sur votre appareil.</p>
            <p className="font-mono">Hors-ligne · IndexedDB · 0 serveur</p>
          </div>
        </footer>

        <Suspense fallback={<BottomNavShell />}>
          <BottomNav />
        </Suspense>

        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
