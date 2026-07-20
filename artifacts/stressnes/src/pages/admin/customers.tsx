import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListCustomers } from '@workspace/api-client-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useListCustomers({ page, pageSize: 20, search: search || undefined });

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
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl mb-1">Customers</h1>
              <p className="font-sans text-sm text-muted-foreground">{data?.total ?? 0} registered customers</p>
            </div>
            <input
              type="text"
              placeholder="Search by name…"
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
                    {['Name', 'Email', 'Phone', 'Role', 'Joined'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center">
                      <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                    </td></tr>
                  )}
                  {!isLoading && data?.data?.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No customers found</td></tr>
                  )}
                  {data?.data?.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="font-sans text-xs text-muted-foreground uppercase">{(c.fullName ?? c.email ?? 'U').charAt(0)}</span>
                          </div>
                          <span className="font-sans text-xs font-medium">{c.fullName ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{c.email}</td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{c.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wider uppercase font-medium bg-muted text-muted-foreground">{c.role}</span>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {isLoading && (
                <div className="py-8 flex justify-center">
                  <div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                </div>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <p className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No customers found</p>
              )}
              {data?.data?.map((c) => (
                <div key={c.id} className="p-4 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="font-sans text-sm text-muted-foreground uppercase">{(c.fullName ?? c.email ?? 'U').charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-medium truncate">{c.fullName ?? '—'}</p>
                    <p className="font-sans text-xs text-muted-foreground truncate">{c.email}</p>
                    {c.phone && <p className="font-sans text-xs text-muted-foreground">{c.phone}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wider uppercase font-medium bg-muted text-muted-foreground">{c.role}</span>
                    <p className="font-sans text-[10px] text-muted-foreground mt-1">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination />
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
