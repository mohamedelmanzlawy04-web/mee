import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListProducts, useGetInventory, useUpdateInventory } from '@workspace/api-client-react';
import type { InventoryUpdateReason } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const REASONS: InventoryUpdateReason[] = ['PURCHASE', 'RETURN', 'ADJUSTMENT', 'RESERVATION', 'RELEASE', 'DAMAGE', 'RESTOCK'];

function InventoryRow({ variantId, productTitle, variantLabel }: { variantId: string; productTitle: string; variantLabel: string }) {
  const { data: inv, refetch } = useGetInventory(variantId);
  const updateInventory = useUpdateInventory();
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState<InventoryUpdateReason>('ADJUSTMENT');
  const [saving, setSaving] = useState(false);

  async function handleUpdate() {
    if (change === 0) return;
    setSaving(true);
    try {
      await updateInventory.mutateAsync({ variantId, data: { change, reason } });
      toast.success(`Inventory updated: ${change > 0 ? '+' : ''}${change}`);
      setChange(0);
      refetch();
    } catch { toast.error('Failed to update inventory'); }
    finally { setSaving(false); }
  }

  const stock = inv?.stockQty ?? 0;
  const isLow = inv?.isLowStock ?? false;

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/20">
      <td className="px-4 py-3"><span className="font-sans text-xs font-medium">{productTitle}</span></td>
      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{variantLabel}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 font-sans text-xs font-medium ${isLow ? 'text-orange-600' : 'text-foreground'}`}>
          <span className={`size-1.5 rounded-full ${stock === 0 ? 'bg-red-500' : isLow ? 'bg-orange-400' : 'bg-green-500'}`} />
          {stock}
        </span>
      </td>
      <td className="px-4 py-3">
        <input type="number" value={change} onChange={(e) => setChange(Number(e.target.value))} className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background w-20 focus:outline-none focus:ring-1 focus:ring-ring" />
      </td>
      <td className="px-4 py-3">
        <select value={reason} onChange={(e) => setReason(e.target.value as InventoryUpdateReason)} className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <button onClick={handleUpdate} disabled={change === 0 || saving} className="px-3 py-1.5 bg-foreground text-background font-sans text-[10px] tracking-widest uppercase rounded-sm hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {saving ? '…' : 'Apply'}
        </button>
      </td>
    </tr>
  );
}

function InventoryCard({ variantId, productTitle, variantLabel }: { variantId: string; productTitle: string; variantLabel: string }) {
  const { data: inv, refetch } = useGetInventory(variantId);
  const updateInventory = useUpdateInventory();
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState<InventoryUpdateReason>('ADJUSTMENT');
  const [saving, setSaving] = useState(false);

  async function handleUpdate() {
    if (change === 0) return;
    setSaving(true);
    try {
      await updateInventory.mutateAsync({ variantId, data: { change, reason } });
      toast.success(`Inventory updated: ${change > 0 ? '+' : ''}${change}`);
      setChange(0);
      refetch();
    } catch { toast.error('Failed to update inventory'); }
    finally { setSaving(false); }
  }

  const stock = inv?.stockQty ?? 0;
  const isLow = inv?.isLowStock ?? false;

  return (
    <div className="p-4 border-b border-border/50 last:border-0 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-sans text-sm font-medium">{productTitle}</p>
          <p className="font-sans text-xs text-muted-foreground">{variantLabel}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 font-sans text-sm font-medium ${isLow ? 'text-orange-600' : 'text-foreground'}`}>
          <span className={`size-2 rounded-full ${stock === 0 ? 'bg-red-500' : isLow ? 'bg-orange-400' : 'bg-green-500'}`} />
          {stock} in stock
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          value={change}
          onChange={(e) => setChange(Number(e.target.value))}
          className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background w-24 focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="±qty"
        />
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as InventoryUpdateReason)}
          className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-0"
        >
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          onClick={handleUpdate}
          disabled={change === 0 || saving}
          className="px-4 py-2 bg-foreground text-background font-sans text-xs tracking-widest uppercase rounded-sm hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {saving ? '…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

export default function AdminInventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useListProducts({ page, pageSize: 15, search: search || undefined });

  const allVariants: { variantId: string; productTitle: string; variantLabel: string }[] = [];
  data?.data?.forEach((product) => {
    const variants = (product as { variants?: { id: string; size?: string; color?: string }[] }).variants;
    if (!variants || variants.length === 0) {
      allVariants.push({ variantId: product.id, productTitle: product.title, variantLabel: 'Default' });
    } else {
      variants.forEach((v) => {
        allVariants.push({ variantId: v.id, productTitle: product.title, variantLabel: [v.size, v.color].filter(Boolean).join(' / ') || 'Default' });
      });
    }
  });

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
        <div className="max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl mb-1">Inventory</h1>
              <p className="font-sans text-sm text-muted-foreground">Adjust stock levels per variant</p>
            </div>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-52"
            />
          </div>

          <div className="bg-card border border-border rounded-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Product', 'Variant', 'Stock', 'Change', 'Reason', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center">
                      <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                    </td></tr>
                  )}
                  {!isLoading && allVariants.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No products found</td></tr>
                  )}
                  {allVariants.map((v) => (
                    <InventoryRow key={v.variantId} {...v} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {isLoading && (
                <div className="py-8 flex justify-center">
                  <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                </div>
              )}
              {!isLoading && allVariants.length === 0 && (
                <p className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No products found</p>
              )}
              {allVariants.map((v) => (
                <InventoryCard key={v.variantId} {...v} />
              ))}
            </div>

            <Pagination />
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
