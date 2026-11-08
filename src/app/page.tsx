import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
          </div>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
