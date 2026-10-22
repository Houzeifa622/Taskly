"use client";

export type ThemePreference = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "taskly:theme";

let preference: ThemePreference = "auto";
let resolved: ResolvedTheme = "light";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readStored(): ThemePreference {
  if (!isBrowser()) return "auto";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "auto") return value;
  } catch {
    /* stockage indisponible (navigation privée) */
  }
  return "auto";
}

function systemTheme(): ResolvedTheme {
  if (!isBrowser()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Applique le thème sur <html> (le mode "auto" suit le système). */
export function applyTheme(next: ThemePreference) {
  if (!isBrowser()) return;
  const target = next === "auto" ? systemTheme() : next;
  resolved = target;
  const root = document.documentElement;
  root.dataset.theme = target;
  root.dataset.themePreference = next;
  root.style.colorScheme = target;
}

if (isBrowser()) {
  preference = readStored();
  resolved = preference === "auto" ? systemTheme() : preference;

  // Le script inline du layout a déjà posé data-theme : on resynchronise.
  applyTheme(preference);

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (preference === "auto") {
        applyTheme("auto");
        emit();
      }
    });
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemePreference(): ThemePreference {
  return preference;
}

export function getResolvedTheme(): ResolvedTheme {
  return resolved;
}

export function getServerThemePreference(): ThemePreference {
  return "auto";
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* stockage indisponible : le thème ne sera pas mémorisé */
    }
  }
  applyTheme(next);
  emit();
}
