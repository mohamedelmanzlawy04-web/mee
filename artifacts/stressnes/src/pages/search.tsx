import { useState } from 'react';
import { Search } from 'lucide-react';
import { useListProducts } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading } = useListProducts(
    { search: submitted, status: 'ACTIVE', pageSize: 24 },
    { query: { enabled: !!submitted } }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  return (
    <Layout>
      <div className="border-b border-border">
        <div className="container-site py-10">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Search</h1>
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-lg">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full border border-border rounded-sm pl-10 pr-4 py-3 font-sans text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-foreground text-background font-sans text-sm rounded-sm hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="container-site py-12">
        {!submitted ? (
          <div className="text-center py-16">
            <p className="font-sans text-muted-foreground">Enter a search term above to find products.</p>
          </div>
        ) : isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : data?.data?.length ? (
          <>
            <p className="font-sans text-sm text-muted-foreground mb-8">
              {data.total} result{data.total !== 1 ? 's' : ''} for &ldquo;{submitted}&rdquo;
            </p>
            <ProductGrid products={data.data} />
          </>
        ) : (
          <div className="text-center py-16">
            <p className="font-serif text-2xl mb-3">No results found</p>
            <p className="font-sans text-sm text-muted-foreground">
              No products matched &ldquo;{submitted}&rdquo;. Try a different search.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
