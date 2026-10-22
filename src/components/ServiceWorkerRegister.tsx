"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  setInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/installPrompt";

function subscribeToConnection(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOfflineSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

/**
 * Enregistre le service worker (mode hors-ligne), capture l'invite
 * d'installation de la PWA et affiche un discret indicateur lorsque la
 * connexion est perdue.
 */
export default function ServiceWorkerRegister() {
  const offline = useSyncExternalStore(
    subscribeToConnection,
    getOfflineSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error) => console.error("Erreur d'enregistrement du SW", error));
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-6">
      <p className="rounded-full border border-border bg-card px-4 py-2 text-caption font-medium text-muted-foreground shadow-lg animate-fade-up">
        Mode hors-ligne — vos données restent disponibles.
      </p>
    </div>
  );
}
