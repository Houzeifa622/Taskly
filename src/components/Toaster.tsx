"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  type ToastItem,
} from "@/lib/toast";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
} from "@/components/icons";

const VARIANT_ICON = {
  default: InfoIcon,
  success: CheckCircleIcon,
  error: AlertCircleIcon,
};

const VARIANT_ICON_CLASS = {
  default: "text-primary",
  success: "text-success",
  error: "text-danger",
};

function ToastCard({ toast }: { toast: ToastItem }) {
  useEffect(() => {
    const duration = toast.duration ?? (toast.action ? 8000 : 4500);
    const timer = window.setTimeout(() => dismissToast(toast.id), duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, toast.action]);

  const Icon = VARIANT_ICON[toast.variant ?? "default"];

  return (
    <div
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-lg animate-toast-in"
      role="status"
    >
      <Icon
        className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${VARIANT_ICON_CLASS[toast.variant ?? "default"]}`}
      />

      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-caption text-muted-foreground">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              dismissToast(toast.id);
            }}
            className="mt-2 rounded-lg text-label font-semibold text-primary underline-offset-4 transition-colors hover:underline focus:ring-4 focus:ring-primary/20 focus:outline-none"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="-m-1 rounded-lg p-1 text-muted-opacity transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
        aria-label="Fermer la notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    getServerToasts
  );

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} />
      ))}
    </div>
  );
}
