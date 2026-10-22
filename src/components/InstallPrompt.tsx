"use client";

import { useSyncExternalStore } from "react";
import {
  dismissInstall,
  getInstallState,
  getServerInstallState,
  promptInstall,
  subscribeInstallPrompt,
} from "@/lib/installPrompt";
import { DownloadIcon, XIcon } from "@/components/icons";

/**
 * Bandeau d'installation de la PWA. L'événement beforeinstallprompt est
 * capté par <ServiceWorkerRegister /> ; on ne propose l'installation que
 * si le navigateur le permet.
 */
export default function InstallPrompt() {
  const state = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallState,
    getServerInstallState
  );

  if (!state.event || state.dismissed) return null;

  return (
    <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-primary/25 bg-primary-soft p-5 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <DownloadIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-subheading font-semibold text-foreground">
            Installer Taskly
          </p>
          <p className="mt-1 text-body text-muted-foreground">
            Ajoutez l&apos;application à votre écran d&apos;accueil : elle
            s&apos;ouvre en plein écran et fonctionne hors-ligne.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={dismissInstall}
          className="rounded-xl px-3 py-2 text-label font-medium text-muted-foreground transition-colors hover:bg-card focus:ring-4 focus:ring-primary/20 focus:outline-none"
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={() => {
            void promptInstall();
          }}
          className="rounded-xl bg-primary px-4 py-2 text-label font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:ring-4 focus:ring-primary/25 focus:outline-none"
        >
          Installer
        </button>
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Ne plus proposer l'installation"
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-card hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
