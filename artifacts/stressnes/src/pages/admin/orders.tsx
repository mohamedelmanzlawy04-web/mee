import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListOrders, useUpdateOrderStatus, useVerifyOrderPayment } from '@workspace/api-client-react';
import type { OrderStatusInputStatus } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, ImageIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const paymentStatusColors: Record<string, string> = {
  COD: 'bg-gray-100 text-gray-700',
  WAITING_FOR_VERIFICATION: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const paymentStatusLabels: Record<string, string> = {
  COD: 'COD',
  WAITING_FOR_VERIFICATION: 'Awaiting Verification',
  PAID: 'Verified',
  REJECTED: 'Rejected',
};

const paymentMethodLabels: Record<string, string> = {
  COD: 'Cash on Delivery',
  INSTAPAY: 'InstaPay',
  EWALLET: 'E-Wallet',
};

function screenshotUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  const parts = objectPath.replace(/^\/objects\//, '');
  return `/api/storage/objects/${parts}`;
}

interface RejectModalProps {
  orderId: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

function RejectModal({ orderId: _, onClose, onConfirm }: RejectModalProps) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-sm p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg mb-1">Reject Payment</h3>
        <p className="font-sans text-xs text-muted-foreground mb-4">Optionally add a reason for rejection.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason (optional)…"
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => onConfirm(reason)}>Reject</Button>
        </div>
      </div>
    </div>
  );
}

function ScreenshotModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-8 right-0 text-white/70 hover:text-white text-xs font-sans flex items-center gap-1">
          <XCircle className="size-4" /> Close
        </button>
        <img src={url} alt="Payment screenshot" className="w-full rounded-sm shadow-2xl max-h-[80vh] object-contain bg-black" />
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-white/60 hover:text-white text-xs font-sans">
          <ExternalLink className="size-3" /> Open in new tab
        </a>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [screenshotView, setScreenshotView] = useState<string | null>(null);

  const { data, isLoading, refetch } = useListOrders({ page, pageSize: 20, status: filterStatus || undefined });
  const updateStatus  = useUpdateOrderStatus();
  const verifyPayment = useVerifyOrderPayment();

  async function handleStatusChange(id: string, status: OrderStatusInputStatus) {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      toast.success('Order status updated');
      refetch();
    } catch { toast.error('Failed to update order status'); }
  }

  async function handleVerify(id: string) {
    try {
      await verifyPayment.mutateAsync({ id, data: { action: 'VERIFY' } });
      toast.success('Payment verified — order moved to Processing');
      refetch();
    } catch { toast.error('Failed to verify payment'); }
  }

  async function handleReject(id: string, reason: string) {
    try {
      await verifyPayment.mutateAsync({ id, data: { action: 'REJECT', rejectionReason: reason || undefined } });
      toast.success('Payment rejected');
      setRejectTarget(null);
      refetch();
    } catch { toast.error('Failed to reject payment'); }
  }

  const Pagination = () => (data?.totalPages ?? 0) > 1 ? (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="font-sans text-xs text-muted-foreground">Page {page} of {data?.totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft className="size-4" />
        </button>
        <button onClick={() => setPage((p) => Math.min(data?.totalPages ?? p, p + 1))} disabled={page === data?.totalPages} className="p-1 rounded-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <RequireAdmin>
      <AdminLayout>
        {rejectTarget && (
          <RejectModal orderId={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={(r) => handleReject(rejectTarget, r)} />
        )}
        {screenshotView && (
          <ScreenshotModal url={screenshotView} onClose={() => setScreenshotView(null)} />
        )}

        <div className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl mb-1">Orders</h1>
              <p className="font-sans text-sm text-muted-foreground">{data?.total ?? 0} total orders</p>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-card border border-border rounded-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Order #', 'Status', 'Payment', 'Screenshot', 'Actions', 'Total', 'Date', 'Change Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center">
                      <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                    </td></tr>
                  )}
                  {!isLoading && data?.data?.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No orders found</td></tr>
                  )}
                  {data?.data?.map((order) => {
                    const imgUrl = screenshotUrl(order.paymentScreenshotUrl);
                    const awaitingVerification = order.paymentStatus === 'WAITING_FOR_VERIFICATION';
                    return (
                      <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-sans text-xs font-medium whitespace-nowrap">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wider uppercase font-medium ${statusColors[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-sans text-xs font-medium">{paymentMethodLabels[order.paymentMethod ?? ''] ?? (order.paymentMethod ?? '—')}</p>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-sm font-sans text-[10px] font-medium ${paymentStatusColors[order.paymentStatus ?? ''] ?? 'bg-muted text-muted-foreground'}`}>
                            {paymentStatusLabels[order.paymentStatus ?? ''] ?? (order.paymentStatus ?? '—')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {imgUrl ? (
                            <button onClick={() => setScreenshotView(imgUrl)} className="flex items-center gap-1 text-xs font-sans text-blue-600 hover:text-blue-800 hover:underline">
                              <ImageIcon className="size-3" /> View
                            </button>
                          ) : <span className="font-sans text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {awaitingVerification ? (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleVerify(order.id)} disabled={verifyPayment.isPending} className="flex items-center gap-1 px-2 py-1 rounded-sm bg-green-100 text-green-800 hover:bg-green-200 font-sans text-[11px] font-medium transition-colors disabled:opacity-50">
                                <CheckCircle className="size-3" /> Verify
                              </button>
                              <button onClick={() => setRejectTarget(order.id)} disabled={verifyPayment.isPending} className="flex items-center gap-1 px-2 py-1 rounded-sm bg-red-100 text-red-800 hover:bg-red-200 font-sans text-[11px] font-medium transition-colors disabled:opacity-50">
                                <XCircle className="size-3" /> Reject
                              </button>
                            </div>
                          ) : <span className="font-sans text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 font-sans text-xs whitespace-nowrap">EGP {Number(order.total ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatusInputStatus)}
                            className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden divide-y divide-border">
              {isLoading && (
                <div className="py-8 flex justify-center">
                  <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                </div>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <p className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No orders found</p>
              )}
              {data?.data?.map((order) => {
                const imgUrl = screenshotUrl(order.paymentScreenshotUrl);
                const awaitingVerification = order.paymentStatus === 'WAITING_FOR_VERIFICATION';
                return (
                  <div key={order.id} className="p-4 space-y-3">
                    {/* Row 1: order # + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-sans text-xs font-medium">{order.orderNumber}</p>
                        <p className="font-sans text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wider uppercase font-medium shrink-0 ${statusColors[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Row 2: payment + total */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-sans text-xs">{paymentMethodLabels[order.paymentMethod ?? ''] ?? (order.paymentMethod ?? '—')}</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded-sm font-sans text-[10px] font-medium ${paymentStatusColors[order.paymentStatus ?? ''] ?? 'bg-muted text-muted-foreground'}`}>
                          {paymentStatusLabels[order.paymentStatus ?? ''] ?? (order.paymentStatus ?? '—')}
                        </span>
                      </div>
                      <span className="font-sans text-xs font-medium shrink-0">EGP {Number(order.total ?? 0).toLocaleString()}</span>
                    </div>

                    {/* Row 3: actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {imgUrl && (
                        <button onClick={() => setScreenshotView(imgUrl)} className="flex items-center gap-1 text-xs font-sans text-blue-600 hover:text-blue-800 underline">
                          <ImageIcon className="size-3" /> Screenshot
                        </button>
                      )}
                      {awaitingVerification && (
                        <>
                          <button onClick={() => handleVerify(order.id)} disabled={verifyPayment.isPending} className="flex items-center gap-1 px-2 py-1.5 rounded-sm bg-green-100 text-green-800 hover:bg-green-200 font-sans text-[11px] font-medium transition-colors disabled:opacity-50">
                            <CheckCircle className="size-3" /> Verify
                          </button>
                          <button onClick={() => setRejectTarget(order.id)} disabled={verifyPayment.isPending} className="flex items-center gap-1 px-2 py-1.5 rounded-sm bg-red-100 text-red-800 hover:bg-red-200 font-sans text-[11px] font-medium transition-colors disabled:opacity-50">
                            <XCircle className="size-3" /> Reject
                          </button>
                        </>
                      )}
                      <select
                        defaultValue={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatusInputStatus)}
                        className="border border-border rounded-sm px-2 py-1.5 font-sans text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring ml-auto"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination />
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
