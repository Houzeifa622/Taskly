"use client";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallState {
  event: BeforeInstallPromptEvent | null;
  dismissed: boolean;
}

const DISMISS_KEY = "taskly:install-dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

let state: InstallState = { event: null, dismissed: readDismissed() };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Mémorise l'événement beforeinstallprompt pour l'afficher plus tard. */
export function setInstallPrompt(event: BeforeInstallPromptEvent | null) {
  state = { ...state, event };
  emit();
}

export function getInstallState(): InstallState {
  return state;
}

export function getServerInstallState(): InstallState {
  return SERVER_STATE;
}

const SERVER_STATE: InstallState = { event: null, dismissed: false };

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** L'utilisateur ne veut plus voir l'invite d'installation. */
export function dismissInstall() {
  state = { ...state, dismissed: true };
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* stockage indisponible */
  }
  emit();
}

/** Déclenche l'invite d'installation native du navigateur. */
export async function promptInstall(): Promise<boolean> {
  const event = state.event;
  if (!event) return false;

  state = { ...state, event: null };
  emit();

  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === "accepted";
}
