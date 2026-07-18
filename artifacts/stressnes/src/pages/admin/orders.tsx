import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListOrders, useUpdateOrderStatus } from '@workspace/api-client-react';
import type { OrderStatusInputStatus } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS: OrderStatusInputStatus[] = [
  'PENDING', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  PACKED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading, refetch } = useListOrders({
    page,
    pageSize: 20,
    status: filterStatus || undefined,
  });

  const updateStatus = useUpdateOrderStatus();

  async function handleStatusChange(id: string, status: OrderStatusInputStatus) {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      toast.success('Order status updated');
      refetch();
    } catch {
      toast.error('Failed to update order status');
    }
  }

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-3xl mb-1">Orders</h1>
              <p className="font-sans text-sm text-muted-foreground">
                {data?.total ?? 0} total orders
              </p>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Order #', 'Customer', 'Status', 'Total', 'Date', 'Change Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                  {!isLoading && data?.data?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">
                        No orders found
                      </td>
                    </tr>
                  )}
                  {data?.data?.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-sans text-xs font-medium whitespace-nowrap">{order.orderNumber}</td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">
                        —
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wider uppercase font-medium ${statusColors[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs whitespace-nowrap">
                        EGP {Number(order.total ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatusInputStatus)}
                          className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(data?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="font-sans text-xs text-muted-foreground">
                  Page {page} of {data?.totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data?.totalPages ?? p, p + 1))}
                    disabled={page === data?.totalPages}
                    className="p-1 rounded-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
