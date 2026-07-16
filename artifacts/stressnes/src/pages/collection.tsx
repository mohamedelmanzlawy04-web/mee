import { useRoute, Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { useListCollections, useListProducts } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid';

export default function CollectionPage() {
  const [, params] = useRoute('/collections/:slug');
  const slug = params?.slug ?? '';

  const { data: collections } = useListCollections();
  const collection = collections?.find((c) => c.slug === slug);

  const { data: products, isLoading } = useListProducts(
    { collectionId: collection?.id, pageSize: 24, status: 'ACTIVE' },
    { query: { enabled: !!collection?.id } }
  );

  return (
    <Layout>
      <div className="border-b border-border">
        <div className="container-site py-10">
          <Link href="/collections" className="flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="size-3" /> Collections
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl">{collection?.name ?? slug}</h1>
          {collection?.description && (
            <p className="font-sans text-sm text-muted-foreground mt-2 max-w-xl">{collection.description}</p>
          )}
          {products && (
            <p className="font-sans text-sm text-muted-foreground mt-2">
              {products.total} {products.total === 1 ? 'piece' : 'pieces'}
            </p>
          )}
        </div>
      </div>

      <div className="container-site py-12">
        {isLoading || (!collection && !collections) ? (
          <ProductGridSkeleton count={12} />
        ) : products?.data?.length ? (
          <ProductGrid products={products.data} />
        ) : (
          <div className="text-center py-24">
            <p className="font-serif text-2xl mb-3">No products yet</p>
            <p className="font-sans text-sm text-muted-foreground mb-6">This collection is being curated.</p>
            <Link href="/products" className="font-sans text-sm underline underline-offset-2 hover:text-accent transition-colors">
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
