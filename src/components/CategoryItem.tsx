"use client";

import Link from "next/link";
import { useRemoveAnimation } from "@/lib/useRemoveAnimation";
import type { Category } from "@/lib/db";
import { ArrowRightIcon, TrashIcon } from "@/components/icons";

interface Props {
  category: Category;
  count: number;
  index: number;
  onDelete: (category: Category) => void;
}

export default function CategoryItem({
  category,
  count,
  index,
  onDelete,
}: Props) {
  const { removing, remove } = useRemoveAnimation();

  async function handleDelete() {
    await remove(() => onDelete(category));
  }

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
      className={`group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card-hover animate-fade-up ${
        removing ? "scale-95 opacity-0" : ""
      }`}
    >
      <span
        className="h-9 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: category.color ?? "#6366f1" }}
      />

      <Link
        href={`/categories/${category.id}`}
        className="min-w-0 flex-1 rounded-lg outline-none"
      >
        <span className="block truncate font-medium text-foreground">
          {category.name}
        </span>
        <span className="block text-caption text-muted-foreground">
          {count} {count > 1 ? "mots ou phrases" : "mot ou phrase"}
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/categories/${category.id}`}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-muted hover:text-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
          aria-label={`Ouvrir ${category.name}`}
        >
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg p-2 text-muted-opacity transition-colors hover:bg-danger-soft hover:text-danger focus:ring-4 focus:ring-danger/20 focus:outline-none"
          aria-label={`Supprimer ${category.name}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
