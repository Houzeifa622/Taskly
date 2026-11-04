import type { WordEntry } from "@/lib/db";

interface Props {
  word: WordEntry;
}

/** Contenu detailed d'une entree du carnet, reutilise en page et en modale. */
export default function WordDetailCard({ word }: Props) {
  const synonyms = word.synonyms ? word.synonyms.split(",").map(s => s.trim()).filter(Boolean) : [];
  const antonyms = word.antonyms ? word.antonyms.split(",").map(s => s.trim()).filter(Boolean) : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-gradient-to-br from-primary-soft to-transparent px-6 py-8">
        <p className="text-caption font-medium tracking-wide text-primary uppercase">
          Mot ou phrase
        </p>
        <h1 className="mt-2 text-title font-bold tracking-tight text-foreground">
          {word.term}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {word.favorite && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-caption font-medium text-amber-600 dark:text-amber-400">
              ★ Favori
            </span>
          )}
          {word.learned && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-caption font-medium text-emerald-600 dark:text-emerald-400">
              ✓ Appris
            </span>
          )}
          {(word.reviewCount ?? 0) > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-medium text-primary">
              Révisé {word.reviewCount} fois
            </span>
          )}
        </div>
      </header>

      <div className="space-y-6 px-6 py-6">
        {word.pronunciation && (
          <section>
            <h2 className="text-caption font-semibold tracking-wide text-muted-opacity uppercase">
              Prononciation
            </h2>
            <p className="mt-2 text-body font-mono text-foreground">
              {word.pronunciation}
            </p>
          </section>
        )}

        {word.definition && (
          <section>
            <h2 className="text-caption font-semibold tracking-wide text-muted-opacity uppercase">
              Signification
            </h2>
            <p className="mt-2 text-heading leading-relaxed font-normal text-foreground italic">
              {word.definition}
            </p>
          </section>
        )}

        {word.usage && (
          <section>
            <h2 className="text-caption font-semibold tracking-wide text-muted-opacity uppercase">
              Comment l&apos;utiliser
            </h2>
            <p className="mt-2 rounded-xl border border-border bg-background px-4 py-3 text-body leading-relaxed text-foreground">
              {word.usage}
            </p>
          </section>
        )}

        {synonyms.length > 0 && (
          <section>
            <h2 className="text-caption font-semibold tracking-wide text-muted-opacity uppercase">
              Synonymes
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {synonyms.map((s, i) => (
                <span key={i} className="rounded-lg bg-muted px-2.5 py-1 text-body text-foreground">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {antonyms.length > 0 && (
          <section>
            <h2 className="text-caption font-semibold tracking-wide text-muted-opacity uppercase">
              Antonymes
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {antonyms.map((s, i) => (
                <span key={i} className="rounded-lg bg-muted px-2.5 py-1 text-body text-foreground">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {!word.definition && !word.usage && !word.pronunciation && synonyms.length === 0 && antonyms.length === 0 && (
          <p className="text-body text-muted-foreground">
            Aucune signification ni exemple n&apos;a encore été ajouté.
          </p>
        )}
      </div>

      <footer className="flex flex-col gap-1 border-t border-border bg-background/60 px-6 py-4 text-caption text-muted-opacity sm:flex-row sm:justify-between">
        <span>
          Créé le{" "}
          <span className="tabular-nums">
            {word.createdAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </span>
        <span>
          Modifié le{" "}
          <span className="tabular-nums">
            {word.updatedAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </span>
      </footer>
    </article>
  );
}
