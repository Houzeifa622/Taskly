"use client";

import { useEffect, useState } from "react";
import { toastSuccess } from "@/lib/toast";

export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toastSuccess("Notifications activées", "Vous recevrez des rappels");
      new Notification("Taskly", {
        body: "Les notifications sont activées !",
        icon: "/icon-192.png",
      });
    }
  }

  if (permission === "granted" || typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-lg lg:bottom-4 lg:left-auto">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <div className="flex-1">
          <p className="text-body font-medium text-foreground">Activer les rappels</p>
          <p className="mt-1 text-caption text-muted-foreground">
            Recevez des notifications pour vos tâches et créneaux à venir
          </p>
          <button
            onClick={requestPermission}
            className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-caption font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Activer
          </button>
        </div>
      </div>
    </div>
  );
}
