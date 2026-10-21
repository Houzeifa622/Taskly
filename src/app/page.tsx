export default function Home() {
  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Taskly
          </h1>
          <p className="text-lg max-w-md mx-auto text-muted-foreground">
            Votre carnet personnel pour apprendre, organiser et ne rien oublier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="group bg-card border border-border rounded-xl p-6 hover:bg-card-hover transition-colors">
            <div className="flex items-start gap-3">
              <div className="shrink-0 bg-primary/10 p-3 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Mes catégories</h3>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Organisez vos mots par thème</p>
              </div>
            </div>
          </div>
          <div className="group bg-card border border-border rounded-xl p-6 hover:bg-card-hover transition-colors">
            <div className="flex items-start gap-3">
              <div className="shrink-0 bg-primary/10 p-3 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Mes tâches</h3>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Ne rien oublier</p>
              </div>
            </div>
          </div>
          <div className="group bg-card border border-border rounded-xl p-6 hover:bg-card-hover transition-colors">
            <div className="flex items-start gap-3">
              <div className="shrink-0 bg-primary/10 p-3 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Emploi du temps</h3>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Planifiez votre temps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}