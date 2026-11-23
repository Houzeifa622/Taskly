"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@/components/icons";

/** Bouton flottant pour revenir en haut d'une longue liste. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > 400);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Revenir en haut"
      title="Revenir en haut"
      className="fixed right-4 bottom-24 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none lg:bottom-6"
    >
      <ArrowUpIcon className="h-5 w-5" />
    </button>
  );
}
