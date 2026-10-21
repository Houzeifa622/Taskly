"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import WordDetail from "@/components/WordDetail";

function WordContent() {
  const params = useParams<{ id: string }>();
  const wordId = Number(params.id);

  return <WordDetail wordId={wordId} />;
}

export default function WordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
        </div>
      }
    >
      <WordContent />
    </Suspense>
  );
}
