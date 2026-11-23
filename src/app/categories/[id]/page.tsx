"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { db, type Category } from "@/lib/db";
import { useLiveQuery } from "@/lib/useLiveQuery";
import WordList from "@/components/WordList";
import { ArrowLeftIcon } from "@/components/icons";

function CategoryContent() {
  const params = useParams<{ id: string }>();
  const categoryId = Number(params.id);

  const { data: category, loading } = useLiveQuery<Category | undefined>(
    () => db.categories.get(categoryId),
    [categoryId]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
      </div>
    );
  }

  if (!category || category.id === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-body font-medium text-foreground">
          Catégorie introuvable
        </p>
        <p className="mt-1 text-body text-muted-foreground">
          Elle a peut-être été supprimée depuis un autre onglet.
        </p>
        <Link
          href="/categories"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour aux catégories
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-body font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour au carnet
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="h-10 w-1.5 rounded-full"
          style={{ backgroundColor: category.color ?? "#6366f1" }}
        />
        <h1 className="text-title font-bold tracking-tight text-foreground">
          {category.name}
        </h1>
      </div>

      <WordList
        categoryId={category.id}
        categoryName={category.name}
      />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="mt-6 h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
