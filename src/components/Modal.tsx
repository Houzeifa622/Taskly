"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/lib/useMounted";
import { XIcon } from "@/components/icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: "center" | "sheet";
  footer?: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  variant = "center",
  footer,
}: Props) {
  const mounted = useMounted();
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Fermeture avec une courte animation avant de prévenir le parent.
  const requestClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setClosing(false);
      onCloseRef.current();
    }, 150);
  }, []);

  // Piège de focus, restauration du focus et blocage du scroll.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      panelRef.current
        ? Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
          )
        : [];

    const focusTimer = window.setTimeout(() => {
      const focusable = getFocusable();
      (focusable[0] ?? panelRef.current)?.focus();
    }, 20);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (
        event.shiftKey &&
        (active === first || !panelRef.current?.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, requestClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  if (!mounted || !open) return null;

  const isSheet = variant === "sheet";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex ${
        isSheet ? "items-end justify-center" : "items-center justify-center p-4"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in ${
          closing ? "opacity-0" : "opacity-100"
        } transition-opacity duration-150`}
        onClick={requestClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${
          isSheet
            ? "max-w-lg rounded-t-3xl border-t border-border bg-card shadow-2xl"
            : "max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
        } outline-none ${
          closing
            ? isSheet
              ? "-translate-y-4 opacity-0"
              : "scale-95 opacity-0"
            : isSheet
              ? "animate-slide-up"
              : "animate-scale-in"
        } transition-all duration-150`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              {title && (
                <h2 className="text-heading font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-caption text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="-m-1.5 rounded-lg p-1.5 text-muted-opacity transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
              aria-label="Fermer"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="border-t border-border px-5 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
