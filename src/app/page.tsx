import Link from "next/link";
import InstallPrompt from "@/components/InstallPrompt";
import {
  ArrowRightIcon,
  BookIcon,
  CalendarIcon,
  CheckSquareIcon,
  SparkIcon,
  WifiOffIcon,
} from "@/components/icons";

const MODULES = [
  {
    href: "/categories",
    title: "Carnet de mots",
    description:
      "Rangez vos mots et phrases par catégorie, avec leur signification et un exemple d'usage.",
    icon: BookIcon,
    tint: "tint-carnet",
    glow: "glow-carnet",
  },
  {
    href: "/tasks",
    title: "Mes tâches",
    description:
      "Cochez ce qui est fait, filtrez par date, assignez une priorité et une récurrence.",
    icon: CheckSquareIcon,
    tint: "tint-taches",
    glow: "glow-taches",
  },
  {
    href: "/schedule",
    title: "Emploi du temps",
    description:
      "Planifiez vos créneaux, de la date à l'heure, et retrouvez-les d'un coup d'œil.",
    icon: CalendarIcon,
    tint: "tint-agenda",
    glow: "glow-agenda",
  },
];

export default function Home() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_0%,var(--primary-soft)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-caption font-medium text-muted-foreground shadow-sm">
            <SparkIcon className="h-3.5 w-3.5 text-primary" />
            100% hors-ligne, sur votre appareil
          </span>

          <h1 className="mt-6 text-display font-bold tracking-tight text-foreground">
            Taskly
          </h1>
          <p className="mt-4 text-heading leading-relaxed font-normal text-muted-foreground">
            Votre carnet personnel pour apprendre, organiser et ne rien
            oublier. Trois modules, une seule application, aucun compte à
            créer.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module, index) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.href}
                href={module.href}
                style={{ animationDelay: `${index * 70}ms` }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 animate-fade-up"
              >
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 -top-16 h-32 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${module.glow}`}
                />
                <div className="relative">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${module.tint}`}
                  >
                    <Icon className="h-5.5 w-5.5" />
                  </span>
                  <h2 className="mt-5 text-subheading font-semibold text-foreground">
                    {module.title}
                  </h2>
                  <p className="mt-2 text-body leading-relaxed text-muted-foreground">
                    {module.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-body font-medium text-primary">
                    Ouvrir
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: WifiOffIcon,
              title: "Fonctionne hors-ligne",
              text: "Un service worker garde l'application accessible sans réseau.",
            },
            {
              icon: SparkIcon,
              title: "Données locales",
              text: "Tout est stocké dans IndexedDB, jamais envoyé sur un serveur.",
            },
            {
              icon: CheckSquareIcon,
              title: "Installable",
              text: "Ajoutez Taskly à votre écran d'accueil comme une application.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4"
              >
                <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                <div>
                  <p className="text-body font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-caption leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <InstallPrompt />
      </div>
    </section>
  );
}
