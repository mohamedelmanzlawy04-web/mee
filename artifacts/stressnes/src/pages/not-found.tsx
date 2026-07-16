import { Link } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <p className="font-sans text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">404</p>
        <h1 className="font-serif text-5xl md:text-6xl mb-4">Page Not Found</h1>
        <p className="font-sans text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
