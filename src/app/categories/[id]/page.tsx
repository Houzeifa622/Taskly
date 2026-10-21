"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import WordEntryForm from "@/components/WordEntryForm";
import WordList from "@/components/WordList";

export default async function CategoryPage() {
  const { id: paramsId } = useParams();

  if (!paramsId) {
    notFound();
  }

  const categoryId = Number(paramsId);

  const category = await db.categories.get(categoryId);
  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <a
          href="/categories"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Toutes les catégories
        </a>
      </div>

      <WordEntryForm categoryId={category.id!} />
      <WordList categoryId={category.id!} categoryName={category.name} />
    </div>
  );
}