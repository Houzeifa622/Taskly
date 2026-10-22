"use client";

import { useSyncExternalStore } from "react";
import {
  getServerThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from "@/lib/theme";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

const ORDER: ThemePreference[] = ["auto", "light", "dark"];

const LABELS: Record<ThemePreference, string> = {
  auto: "Thème automatique",
  light: "Thème clair",
  dark: "Thème sombre",
};

/**
 * Bouton de bascule du thème : auto → clair → sombre.
 * L'icône affichée est pilotée par CSS (attribut data-theme-preference sur
 * <html>) afin d'éviter tout écart entre le HTML servi et l'hydratation.
 */
export default function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    getServerThemePreference
  );

  function cycle() {
    const index = ORDER.indexOf(preference);
    setThemePreference(ORDER[(index + 1) % ORDER.length]);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABELS[preference]} — cliquer pour changer de thème`}
      title={LABELS[preference]}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-4 focus:ring-primary/20 focus:outline-none"
    >
      <span className="relative flex h-4.5 w-4.5">
        <SunIcon className="theme-icon icon-sun absolute inset-0 h-4.5 w-4.5" />
        <MoonIcon className="theme-icon icon-moon absolute inset-0 h-4.5 w-4.5" />
        <MonitorIcon className="theme-icon icon-auto absolute inset-0 h-4.5 w-4.5" />
      </span>
    </button>
  );
}
