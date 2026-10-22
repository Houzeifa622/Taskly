interface IllustrationProps {
  className?: string;
}

/** Illustration : carnet vide. */
export function EmptyNotebookIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <ellipse cx="80" cy="66" rx="58" ry="44" fill="var(--primary-soft)" />
      <rect
        x="46"
        y="24"
        width="68"
        height="72"
        rx="9"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <path
        d="M61 24v72"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M72 44h30M72 56h30M72 68h18"
        stroke="var(--muted-opacity)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m100 74 6 6 12-14"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Illustration : liste de tâches vide. */
export function EmptyChecklistIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <ellipse cx="80" cy="66" rx="58" ry="44" fill="var(--primary-soft)" />
      <rect
        x="44"
        y="22"
        width="72"
        height="76"
        rx="9"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <rect
        x="66"
        y="14"
        width="28"
        height="16"
        rx="6"
        fill="var(--primary-soft)"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      <rect
        x="56"
        y="44"
        width="12"
        height="12"
        rx="3"
        stroke="var(--muted-opacity)"
        strokeWidth="2"
      />
      <path
        d="M76 50h28"
        stroke="var(--muted-opacity)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="56"
        y="64"
        width="12"
        height="12"
        rx="3"
        stroke="var(--muted-opacity)"
        strokeWidth="2"
      />
      <path
        d="M76 70h20"
        stroke="var(--muted-opacity)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m92 62 5 5 9-11"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Illustration : agenda vide. */
export function EmptyCalendarIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <ellipse cx="80" cy="66" rx="58" ry="44" fill="var(--primary-soft)" />
      <rect
        x="42"
        y="26"
        width="76"
        height="70"
        rx="9"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <path d="M42 46h76" stroke="var(--primary)" strokeWidth="2" />
      <path
        d="M60 18v14M100 18v14"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="54"
        y="58"
        width="14"
        height="12"
        rx="3"
        fill="var(--primary-soft)"
      />
      <rect
        x="78"
        y="58"
        width="14"
        height="12"
        rx="3"
        fill="var(--muted)"
      />
      <rect
        x="102"
        y="58"
        width="14"
        height="12"
        rx="3"
        fill="var(--muted)"
      />
      <rect
        x="54"
        y="76"
        width="14"
        height="12"
        rx="3"
        fill="var(--muted)"
      />
      <rect
        x="78"
        y="76"
        width="14"
        height="12"
        rx="3"
        fill="var(--primary-soft)"
      />
    </svg>
  );
}

/** Illustration : aucun résultat de recherche. */
export function EmptySearchIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <ellipse cx="80" cy="66" rx="58" ry="44" fill="var(--primary-soft)" />
      <rect
        x="38"
        y="28"
        width="70"
        height="58"
        rx="9"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <path
        d="M50 46h46M50 58h30"
        stroke="var(--muted-opacity)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="92"
        cy="64"
        r="18"
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth="3"
      />
      <path
        d="m105 77 12 12"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Illustration : aucune donnée du tout. */
export function EmptyInboxIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <ellipse cx="80" cy="66" rx="58" ry="44" fill="var(--primary-soft)" />
      <path
        d="M40 62 52 34h56l12 28v22a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6Z"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M40 62h22l5 11h26l5-11h22"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
