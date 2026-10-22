import type { WordEntry } from "@/lib/db";

interface Props {
  word: WordEntry;
}

/** Contenu detailed d'une entree du carnet, reutilise en page et en modale. */
export default function WordDetailCard({ word }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-gradient-to-br from-primary-soft to-transparent px-6 py-8">
        <p className="text-caption font-medium tracking-wide text-primary uppercase">
          Mot ou phrase
        </p>
        <h1 className="mt-2 text-title font-bold tracking-tight text-foreground">
          {word.term}
        </h1>
      </header>

      <div className="space-y-6 px-6 py-6">
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

        {!word.definition && !word.usage && (
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
