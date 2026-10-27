import { Suspense } from "react";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-title font-bold tracking-tight text-foreground">
          Mes tâches
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          Ce qui est dû aujourd&apos;hui d&apos;abord, puis ce qui arrive.
        </p>
      </header>

      {/* La zone interactive lit l'heure courante et IndexedDB : elle est
          rendue côté client, derrière une frontière Suspense. */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-72 animate-pulse rounded-2xl border border-border bg-card/60" />
            <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/60" />
          </div>
        }
      >
        <TaskForm />
        <TaskList />
      </Suspense>
    </div>
  );
}
