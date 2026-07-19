import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListCoupons, useCreateCoupon, useDeleteCoupon } from '@workspace/api-client-react';
import type { CouponInput } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListCouponsQueryKey } from '@workspace/api-client-react';
import { Plus, Trash2, X } from 'lucide-react';

const EMPTY_FORM: CouponInput = {
  code: '',
  type: 'PERCENTAGE',
  value: 10,
  minOrderAmount: null,
  maxUses: null,
  isActive: true,
  expiresAt: null,
};

export default function AdminCouponsPage() {
  const { data: coupons, isLoading } = useListCoupons();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CouponInput>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMutation = useCreateCoupon({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
        setShowForm(false);
        setForm(EMPTY_FORM);
        setFormError('');
      },
      onError: (err: unknown) => {
        const e = err as { message?: string };
        setFormError(e?.message ?? 'Failed to create coupon');
      },
    },
  });

  const deleteMutation = useDeleteCoupon({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
        setDeletingId(null);
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.code.trim()) { setFormError('Code is required'); return; }
    if (!form.value || form.value <= 0) { setFormError('Value must be positive'); return; }
    createMutation.mutate({ data: { ...form, code: form.code.toUpperCase() } });
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    setDeletingId(id);
    deleteMutation.mutate({ id });
  }

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-5xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl mb-1">Coupons</h1>
              <p className="font-sans text-sm text-muted-foreground">
                {Array.isArray(coupons) ? coupons.length : 0} coupons in the system
              </p>
            </div>
            <button
              onClick={() => { setShowForm(true); setFormError(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-sans text-sm rounded-sm hover:bg-foreground/90 transition-colors"
            >
              <Plus className="size-4" />
              New Coupon
            </button>
          </div>

          {/* Create form */}
          {showForm && (
            <div className="mb-6 bg-card border border-border rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-sm font-medium">Create Coupon</h2>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }}>
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SUMMER20"
                    className="w-full font-mono text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' }))}
                    className="w-full font-sans text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (EGP)</option>
                  </select>
                </div>
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">
                    Value * {form.type === 'PERCENTAGE' ? '(%)' : '(EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full font-sans text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Min Order Amount (EGP)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderAmount ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="Optional"
                    className="w-full font-sans text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxUses ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="Unlimited"
                    className="w-full font-sans text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Expires At</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                    className="w-full font-sans text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-sm">
                    <input
                      type="checkbox"
                      checked={form.isActive ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    Active
                  </label>
                </div>
                {formError && (
                  <div className="col-span-2 text-destructive font-sans text-xs">{formError}</div>
                )}
                <div className="col-span-2 flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }}
                    className="px-4 py-2 font-sans text-sm border border-border rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 font-sans text-sm bg-foreground text-background rounded-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Active', 'Expires', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                  {!isLoading && (!Array.isArray(coupons) || coupons.length === 0) && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">
                        No coupons yet. Create one above.
                      </td>
                    </tr>
                  )}
                  {Array.isArray(coupons) && coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{coupon.code}</code>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{coupon.type}</td>
                      <td className="px-4 py-3 font-sans text-xs font-medium">
                        {coupon.type === 'PERCENTAGE'
                          ? `${coupon.value}%`
                          : `EGP ${Number(coupon.value).toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">
                        {coupon.minOrderAmount ? `EGP ${Number(coupon.minOrderAmount).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">
                        {coupon.usedCount ?? 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          disabled={deletingId === coupon.id}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-40"
                          title="Delete coupon"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
