import type { WordEntry } from "@/lib/db";

/** Comparaison insensible aux accents et à la casse. */
export function normalizeWord(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function matchesWordQuery(word: WordEntry, query: string): boolean {
  const term = normalizeWord(query.trim());
  if (!term) return true;

  return (
    normalizeWord(word.term).includes(term) ||
    normalizeWord(word.definition ?? "").includes(term) ||
    normalizeWord(word.usage ?? "").includes(term) ||
    normalizeWord(word.pronunciation ?? "").includes(term) ||
    normalizeWord(word.synonyms ?? "").includes(term) ||
    normalizeWord(word.antonyms ?? "").includes(term)
  );
}

export type WordSort = "recent" | "oldest" | "alpha-asc" | "alpha-desc";

export function sortWords(words: WordEntry[], sort: WordSort): WordEntry[] {
  const list = [...words];
  switch (sort) {
    case "oldest":
      return list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    case "alpha-asc":
      return list.sort((a, b) => a.term.localeCompare(b.term, "fr"));
    case "alpha-desc":
      return list.sort((a, b) => b.term.localeCompare(a.term, "fr"));
    case "recent":
    default:
      return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export function highlightText(text: string, query: string): string {
  const q = query.trim();
  if (!q) return text;

  const normalizedText = normalizeWord(text);
  const normalizedQuery = normalizeWord(q);
  if (!normalizedQuery) return text;

  // Simple approach: split by original text but we need to find matches
  // For simplicity, just return text with basic highlighting
  const regex = new RegExp(
    q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi"
  );
  return text.replace(regex, (match) => `<mark class="rounded bg-primary/20 px-0.5">${match}</mark>`);
}
