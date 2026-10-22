export type ToastVariant = "default" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
}

let toasts: ToastItem[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Souscrit aux notifications de toast (utilisé par <Toaster />). */
export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot stable (indispensable pour useSyncExternalStore). */
export function getToasts(): ToastItem[] {
  return toasts;
}

/** Snapshot serveur : toujours vide. */
export function getServerToasts(): ToastItem[] {
  return EMPTY;
}

const EMPTY: ToastItem[] = [];

export function dismissToast(id: number) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

/**
 * Affiche une notification éphémère.
 * Retourne l'identifiant du toast pour permettre de le fermer soi-même.
 */
export function toast(options: ToastOptions): number {
  counter += 1;
  const id = counter;
  toasts = [...toasts, { id, ...options }];
  emit();
  return id;
}

/** Notification d'erreur (variante rouge). */
export function toastError(title: string, description?: string) {
  return toast({ title, description, variant: "error" });
}

/** Notification de succès (variante verte). */
export function toastSuccess(title: string, description?: string) {
  return toast({ title, description, variant: "success" });
}
