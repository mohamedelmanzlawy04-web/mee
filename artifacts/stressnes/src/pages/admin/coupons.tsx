import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListCoupons } from '@workspace/api-client-react';

export default function AdminCouponsPage() {
  const { data: coupons, isLoading } = useListCoupons();

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-5xl">
          <div className="mb-6">
            <h1 className="font-serif text-3xl mb-1">Coupons</h1>
            <p className="font-sans text-sm text-muted-foreground">
              {Array.isArray(coupons) ? coupons.length : 0} coupons in the system
            </p>
          </div>

          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Active', 'Expires'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                  {!isLoading && (!Array.isArray(coupons) || coupons.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No coupons found</td>
                    </tr>
                  )}
                  {Array.isArray(coupons) && coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{coupon.code}</code>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{coupon.type}</td>
                      <td className="px-4 py-3 font-sans text-xs font-medium">
                        {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `EGP ${Number(coupon.value).toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">
                        {coupon.minOrderAmount ? `EGP ${Number(coupon.minOrderAmount).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">
                        {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Never'}
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
