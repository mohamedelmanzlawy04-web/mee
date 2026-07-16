import { useState } from 'react';
import { useSearch } from 'wouter';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  useListProducts,
  useListCategories,
  useListCollections,
  type ListProductsParams,
} from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Price: Low to High', value: 'price-asc', sortBy: 'price', sortOrder: 'asc' },
  { label: 'Price: High to Low', value: 'price-desc', sortBy: 'price', sortOrder: 'desc' },
  { label: 'Name A–Z', value: 'name-asc', sortBy: 'title', sortOrder: 'asc' },
] as const;

export default function ProductsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [sortValue, setSortValue] = useState('newest');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const sortOpt = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];
  const featuredParam = params.get('featured') === 'true' ? true : undefined;

  const queryParams: ListProductsParams = {
    status: 'ACTIVE',
    page,
    pageSize: 12,
    sortBy: sortOpt.sortBy as ListProductsParams['sortBy'],
    sortOrder: sortOpt.sortOrder as ListProductsParams['sortOrder'],
    ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
    ...(selectedCollectionId ? { collectionId: selectedCollectionId } : {}),
    ...(featuredParam ? { featured: featuredParam } : {}),
  };

  const { data, isLoading } = useListProducts(queryParams);
  const { data: categories } = useListCategories();
  const { data: collections } = useListCollections();

  const activeFiltersCount = [selectedCategoryId, selectedCollectionId].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategoryId('');
    setSelectedCollectionId('');
    setPage(1);
  };

  const pageTitle = featuredParam ? 'Featured Pieces' : 'All Products';

  return (
    <Layout>
      <div className="border-b border-border">
        <div className="container-site py-10">
          <h1 className="font-serif text-4xl md:text-5xl">{pageTitle}</h1>
          {data && (
            <p className="font-sans text-sm text-muted-foreground mt-2">
              {data.total} {data.total === 1 ? 'piece' : 'pieces'}
            </p>
          )}
        </div>
      </div>

      <div className="container-site py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters — desktop */}
          <aside className="lg:w-56 flex-shrink-0 hidden lg:block">
            <FilterPanel
              categories={categories ?? []}
              collections={collections ?? []}
              selectedCategoryId={selectedCategoryId}
              selectedCollectionId={selectedCollectionId}
              onCategoryChange={(v) => { setSelectedCategoryId(v); setPage(1); }}
              onCollectionChange={(v) => { setSelectedCollectionId(v); setPage(1); }}
              onClear={clearFilters}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-3.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-foreground text-background text-[10px]">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" /> Clear filters
                </button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <span className="font-sans text-xs text-muted-foreground hidden sm:block">Sort by</span>
                <select
                  value={sortValue}
                  onChange={(e) => { setSortValue(e.target.value); setPage(1); }}
                  className="font-sans text-sm border border-border rounded-sm px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <ProductGridSkeleton count={12} />
            ) : data?.data && data.data.length > 0 ? (
              <>
                <ProductGrid products={data.data} />
                {data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-14">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="font-sans text-sm text-muted-foreground px-3">
                      {page} / {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24">
                <p className="font-serif text-2xl mb-3">No products found</p>
                <p className="font-sans text-sm text-muted-foreground mb-6">Try adjusting your filters.</p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 z-[var(--z-overlay)] bg-foreground/20 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 z-[var(--z-modal)] bg-background border-r border-border p-6 overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <span className="font-sans text-sm tracking-widest uppercase">Filters</span>
              <Button variant="ghost" size="icon" onClick={() => setFiltersOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <FilterPanel
              categories={categories ?? []}
              collections={collections ?? []}
              selectedCategoryId={selectedCategoryId}
              selectedCollectionId={selectedCollectionId}
              onCategoryChange={(v) => { setSelectedCategoryId(v); setPage(1); }}
              onCollectionChange={(v) => { setSelectedCollectionId(v); setPage(1); }}
              onClear={clearFilters}
            />
          </div>
        </>
      )}
    </Layout>
  );
}

function FilterPanel({
  categories,
  collections,
  selectedCategoryId,
  selectedCollectionId,
  onCategoryChange,
  onCollectionChange,
  onClear,
}: {
  categories: Array<{ id: string; name: string; slug: string }>;
  collections: Array<{ id: string; name: string; slug: string }>;
  selectedCategoryId: string;
  selectedCollectionId: string;
  onCategoryChange: (v: string) => void;
  onCollectionChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-8">
      {(selectedCategoryId || selectedCollectionId) && (
        <button onClick={onClear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <X className="size-3" /> Clear all
        </button>
      )}

      {categories.length > 0 && (
        <div>
          <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-3">Category</p>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onCategoryChange('')} className={cn('font-sans text-sm w-full text-left', !selectedCategoryId ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
                All
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button onClick={() => onCategoryChange(cat.id)} className={cn('font-sans text-sm w-full text-left', selectedCategoryId === cat.id ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {collections.length > 0 && (
        <div>
          <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-3">Collection</p>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onCollectionChange('')} className={cn('font-sans text-sm w-full text-left', !selectedCollectionId ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
                All
              </button>
            </li>
            {collections.map((col) => (
              <li key={col.id}>
                <button onClick={() => onCollectionChange(col.id)} className={cn('font-sans text-sm w-full text-left', selectedCollectionId === col.id ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
                  {col.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
