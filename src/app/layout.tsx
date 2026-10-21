import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import HeaderShell from "@/components/HeaderShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<HeaderShell />}>
          <AppHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-card/40">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-opacity sm:flex-row sm:px-6 lg:px-8">
            <p>Taskly — vos données restent sur votre appareil.</p>
            <p className="font-mono">Hors-ligne · IndexedDB · 0 serveur</p>
          </div>
        </footer>

        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
