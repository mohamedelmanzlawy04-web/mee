import Link from 'next/link';

/**
 * 404 Not Found Page
 */
export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="font-serif text-[8rem] leading-none text-muted-foreground/20 select-none">
          404
        </p>
        <div className="space-y-2 -mt-8">
          <p className="text-xs font-sans tracking-[0.3em] uppercase text-muted-foreground">
            Not Found
          </p>
          <h1 className="font-serif text-3xl text-foreground">
            This page doesn&apos;t exist
          </h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The page you&apos;re looking for may have been moved, deleted, or never existed.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-8 py-3 text-sm font-sans bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity tracking-wider uppercase"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
