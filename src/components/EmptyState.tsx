interface Props {
  illustration: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

/**
 * État vide illustré : donne une direction artistique cohérente aux
 * différents modules de l'application.
 */
export default function EmptyState({
  illustration,
  title,
  description,
  action,
  compact = false,
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 text-center ${
        compact ? "px-6 py-10" : "px-6 py-14"
      }`}
    >
      <div className={compact ? "w-32" : "w-44"}>{illustration}</div>

      <p className="mt-4 text-subheading font-semibold text-foreground">
        {title}
      </p>

      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-body text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
