import { siteConfig } from '@/config/site';

/**
 * Home Page — Placeholder
 *
 * This page will be replaced with the STRESSNES storefront in a future task.
 * The foundation is set up and ready for development.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <p className="text-sm font-sans tracking-[0.3em] uppercase text-muted-foreground">
          Coming Soon
        </p>
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-foreground">
          {siteConfig.name}
        </h1>
        <p className="font-sans text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
          {siteConfig.description}
        </p>
        <div className="pt-4 w-16 h-px bg-accent mx-auto" />
        <p className="text-xs text-muted-foreground font-sans">
          Foundation ready. Development in progress.
        </p>
      </div>
    </main>
  );
}
