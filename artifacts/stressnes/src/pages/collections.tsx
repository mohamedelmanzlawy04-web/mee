import { useListCollections } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { Link } from 'wouter';

export default function CollectionsPage() {
  const { data: collections, isLoading } = useListCollections();

  return (
    <Layout>
      <div className="border-b border-border">
        <div className="container-site py-10">
          <h1 className="font-serif text-4xl md:text-5xl">Collections</h1>
          <p className="font-sans text-sm text-muted-foreground mt-2">
            Curated stories, each piece chosen with intention.
          </p>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[4/3] bg-muted rounded-sm mb-4" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : !collections?.length ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl mb-3">Collections coming soon</p>
            <p className="font-sans text-sm text-muted-foreground mb-6">We're curating something special.</p>
            <Link href="/products" className="font-sans text-sm underline underline-offset-2 hover:text-accent transition-colors">
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((col, i) => (
              <Link key={col.id} href={`/collections/${col.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted mb-4">
                  {col.image && (
                    <img
                      src={col.image}
                      alt={col.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/10 transition-colors duration-300" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-serif text-2xl text-background">{col.name}</p>
                  </div>
                </div>
                {col.description && (
                  <p className="font-sans text-sm text-muted-foreground line-clamp-2">{col.description}</p>
                )}
                <p className="font-sans text-xs tracking-widest uppercase text-accent mt-2 group-hover:underline underline-offset-4">
                  Explore →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
