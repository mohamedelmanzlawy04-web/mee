import type { Product } from '@workspace/api-client-react';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  className?: string;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, className, columns = 3 }: ProductGridProps) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn(`grid ${gridClass} gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14`, className)}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 | 4 }) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-sm bg-muted" />
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-16 bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/3 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
