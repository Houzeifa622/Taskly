import { Suspense } from "react";
import ScheduleForm from "@/components/ScheduleForm";
import ScheduleList from "@/components/ScheduleList";

export default function SchedulePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Emploi du temps
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vos rendez-vous et créneaux, en agenda ou en vue semaine.
        </p>
      </header>

      {/* La zone interactive lit l'heure courante et IndexedDB : elle est
          rendue côté client, derrière une frontière Suspense. */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-80 animate-pulse rounded-2xl border border-border bg-card/60" />
            <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/60" />
          </div>
        }
      >
        <ScheduleForm />
        <ScheduleList />
      </Suspense>
    </div>
  );
}
