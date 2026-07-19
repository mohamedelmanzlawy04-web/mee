import { useLocation, Link } from 'wouter';
import { Package, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Layout } from '@/components/layout/Layout';
import { useListOrders } from '@workspace/api-client-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-600 bg-yellow-50',
  PAID: 'text-blue-600 bg-blue-50',
  PROCESSING: 'text-blue-600 bg-blue-50',
  PACKED: 'text-purple-600 bg-purple-50',
  SHIPPED: 'text-indigo-600 bg-indigo-50',
  DELIVERED: 'text-green-600 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
  REFUNDED: 'text-gray-600 bg-gray-50',
};

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading } = useListOrders({ page: 1, pageSize: 20 }, {
    query: { enabled: isAuthenticated, retry: false },
  });

  if (!authLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="container-site py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/account" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
              Account
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <h1 className="font-serif text-4xl">Orders</h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-sm h-24" />
              ))}
            </div>
          ) : !data?.data?.length ? (
            <div className="text-center py-24 bg-card border border-border rounded-sm">
              <Package className="size-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
              <p className="font-serif text-2xl mb-2">No orders yet</p>
              <p className="font-sans text-sm text-muted-foreground mb-6">
                Your order history will appear here once you make a purchase.
              </p>
              <Link href="/products" className="font-sans text-sm underline underline-offset-2 hover:text-accent transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.data.map((order) => (
                <div key={order.id} className="bg-card border border-border rounded-sm p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-sans text-sm font-medium">Order #{order.orderNumber}</p>
                      <p className="font-sans text-xs text-muted-foreground mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={cn(
                      'font-sans text-xs px-2 py-1 rounded-sm font-medium',
                      STATUS_COLORS[order.status] ?? 'text-muted-foreground bg-muted'
                    )}>
                      {order.status}
                    </span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between font-sans text-sm">
                          <span className="text-muted-foreground">
                            {item.productTitle ?? 'Product'} × {item.quantity}
                          </span>
                          <span>{formatPrice(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="font-sans text-xs text-muted-foreground">
                      {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="font-sans text-sm font-medium">
                      Total: {formatPrice(order.total, order.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
