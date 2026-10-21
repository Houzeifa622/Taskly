"use client";

import { useEffect, useSyncExternalStore } from "react";

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
 * Enregistre le service worker (mode hors-ligne) et affiche un discret
 * indicateur lorsque la connexion est perdue.
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

    return () => window.removeEventListener("load", register);
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3">
      <p className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg">
        Mode hors-ligne — vos données restent disponibles.
      </p>
    </div>
  );
}
