/**
 * Global Loading UI
 *
 * Displayed automatically by Next.js during page transitions
 * using the streaming loading pattern.
 */
export default function LoadingPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo mark */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
        </div>
        <p className="text-xs font-sans tracking-[0.4em] uppercase text-muted-foreground animate-pulse">
          Loading
        </p>
      </div>
    </div>
  );
}
