"use client";

import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { requestOpenForm, type FormKind } from "@/lib/openForm";
import {
  BookIcon,
  CalendarIcon,
  CheckSquareIcon,
} from "@/components/icons";

const ACTIONS: {
  kind: FormKind;
  label: string;
  description: string;
  href: string;
  icon: typeof BookIcon;
}[] = [
  {
    kind: "task",
    label: "Tâche",
    description: "Suivre une action à faire",
    href: "/tasks",
    icon: CheckSquareIcon,
  },
  {
    kind: "word",
    label: "Mot ou phrase",
    description: "Enrichir le carnet",
    href: "/categories",
    icon: BookIcon,
  },
  {
    kind: "event",
    label: "Événement",
    description: "Planifier un créneau",
    href: "/schedule",
    icon: CalendarIcon,
  },
];

/** Feuille d'ajout rapide ouverte depuis le bouton flottant. */
export default function QuickAddSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  function go(kind: FormKind, href: string) {
    requestOpenForm(kind);
    onClose();
    router.push(href);
  }

  return (
    <Modal open={open} onClose={onClose} variant="sheet" title="Ajouter">
      <ul className="space-y-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.kind}>
              <button
                type="button"
                onClick={() => go(action.kind, action.href)}
                className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card-hover focus:ring-4 focus:ring-primary/20 focus:outline-none"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-subheading font-medium text-foreground">
                    {action.label}
                  </span>
                  <span className="block text-caption text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
