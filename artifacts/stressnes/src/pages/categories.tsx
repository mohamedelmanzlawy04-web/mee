import { useListCategories } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { Link } from 'wouter';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <Layout>
      <div className="border-b border-border">
        <div className="container-site py-10">
          <h1 className="font-serif text-4xl md:text-5xl">Categories</h1>
          <p className="font-sans text-sm text-muted-foreground mt-2">
            Browse our curated selection by category.
          </p>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-square bg-muted rounded-sm mb-3" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : !categories?.length ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl mb-3">Categories coming soon</p>
            <Link href="/products" className="font-sans text-sm underline underline-offset-2 hover:text-accent transition-colors">
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-muted mb-3">
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/0 transition-colors" />
                </div>
                <p className="font-sans text-sm font-medium group-hover:text-accent transition-colors">{cat.name}</p>
                {cat.description && (
                  <p className="font-sans text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
