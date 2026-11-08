"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { toastError, toastSuccess } from "@/lib/toast";


export default function DataManager() {
  const [importing, setImporting] = useState(false);

  async function exportAll() {
    try {
      const [categories, words, tasks, scheduleEvents, scheduleTemplates] = await Promise.all([
        db.categories.toArray(),
        db.words.toArray(),
        db.tasks.toArray(),
        db.scheduleEvents.toArray(),
        db.scheduleTemplates.toArray(),
      ]);

      const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        app: "Taskly",
        data: {
          categories,
          words,
          tasks,
          scheduleEvents,
          scheduleTemplates,
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskly-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastSuccess("Export réussi", "Sauvegarde complète téléchargée");
    } catch (err) {
      console.error(err);
      toastError("Erreur lors de l'export");
    }
  }

  async function importAll(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data) {
        throw new Error("Format invalide");
      }

      const { categories, words, tasks, scheduleEvents, scheduleTemplates } = backup.data;

      await db.transaction("rw", [db.categories, db.words, db.tasks, db.scheduleEvents, db.scheduleTemplates], async () => {
        if (Array.isArray(categories)) {
          await db.categories.clear();
          await db.categories.bulkAdd(categories.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })));
        }
        if (Array.isArray(words)) {
          await db.words.clear();
          await db.words.bulkAdd(words.map((w: any) => ({
            ...w,
            createdAt: new Date(w.createdAt),
            updatedAt: new Date(w.updatedAt),
            lastReviewedAt: w.lastReviewedAt ? new Date(w.lastReviewedAt) : null,
          })));
        }
        if (Array.isArray(tasks)) {
          await db.tasks.clear();
          await db.tasks.bulkAdd(tasks.map((t: any) => ({
            ...t,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            recurrenceEnd: t.recurrenceEnd ? new Date(t.recurrenceEnd) : null,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          })));
        }
        if (Array.isArray(scheduleEvents)) {
          await db.scheduleEvents.clear();
          await db.scheduleEvents.bulkAdd(scheduleEvents.map((s: any) => ({
            ...s,
            startDateTime: new Date(s.startDateTime),
            endDateTime: new Date(s.endDateTime),
            recurrenceEnd: s.recurrenceEnd ? new Date(s.recurrenceEnd) : null,
            createdAt: new Date(s.createdAt),
          })));
        }
        if (Array.isArray(scheduleTemplates)) {
          await db.scheduleTemplates.clear();
          await db.scheduleTemplates.bulkAdd(scheduleTemplates.map((st: any) => ({
            ...st,
            createdAt: new Date(st.createdAt),
          })));
        }
      });

      toastSuccess("Import réussi", "Toutes les données ont été restaurées");
      e.target.value = "";
    } catch (err) {
      console.error(err);
      toastError("Erreur lors de l'import", "Vérifiez le format du fichier de sauvegarde");
      e.target.value = "";
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-title font-bold tracking-tight text-foreground">Données & Sauvegarde</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Exportez ou importez toutes vos données Taskly
        </p>
      </header>

      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-subheading font-semibold text-foreground">Exporter toutes les données</h2>
              <p className="mt-1 text-body text-muted-foreground">
                Sauvegarde complète de vos tâches, emploi du temps, carnet et catégories au format JSON
              </p>
              <button
                onClick={exportAll}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Télécharger la sauvegarde
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-500/10 p-3">
              <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-subheading font-semibold text-foreground">Importer une sauvegarde</h2>
              <p className="mt-1 text-body text-muted-foreground">
                Restaure toutes les données depuis un fichier JSON de sauvegarde Taskly
              </p>
              <p className="mt-2 text-caption text-danger">
                Attention : cette action remplacera toutes vos données actuelles
              </p>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-body font-medium text-foreground transition-colors hover:bg-muted">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                {importing ? "Import en cours..." : "Sélectionner un fichier"}
                <input
                  type="file"
                  accept=".json"
                  onChange={importAll}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
