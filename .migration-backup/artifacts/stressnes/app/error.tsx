'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Boundary
 *
 * Catches unhandled errors in the React tree below the root layout.
 * Must be a Client Component.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error('[STRESSNES Error]', error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-xs font-sans tracking-[0.3em] uppercase text-destructive">
          Error
        </p>
        <h1 className="font-serif text-4xl text-foreground">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred. Our team has been notified.
          {error.digest && (
            <span className="block mt-2 font-mono text-xs opacity-60">
              Reference: {error.digest}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 text-sm font-sans bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2.5 text-sm font-sans border border-border text-foreground rounded-sm hover:bg-secondary transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
