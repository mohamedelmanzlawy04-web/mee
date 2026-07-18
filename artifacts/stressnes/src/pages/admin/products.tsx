import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import {
  useListProducts,
  useUpdateProduct,
  useDeleteProduct,
} from '@workspace/api-client-react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react';

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-yellow-100 text-yellow-800',
};

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ title?: string; price?: number; status?: string }>({});

  const { data, isLoading, refetch } = useListProducts({
    page,
    pageSize: 20,
    search: search || undefined,
    status: (filterStatus as 'DRAFT' | 'ACTIVE' | 'ARCHIVED') || undefined,
  });

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  async function handleSave(slug: string) {
    try {
      await updateProduct.mutateAsync({ slug, data: editData as Parameters<typeof updateProduct.mutateAsync>[0]['data'] });
      toast.success('Product updated');
      setEditingId(null);
      refetch();
    } catch {
      toast.error('Failed to update product');
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync({ slug });
      toast.success('Product deleted');
      refetch();
    } catch {
      toast.error('Failed to delete product');
    }
  }

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-3xl mb-1">Products</h1>
              <p className="font-sans text-sm text-muted-foreground">{data?.total ?? 0} total products</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring w-48"
              />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Title', 'SKU', 'Price (EGP)', 'Status', 'Featured', 'Actions'].map((h) => (
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
                      <td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No products found</td>
                    </tr>
                  )}
                  {data?.data?.map((product) => {
                    const isEditing = editingId === product.id;
                    return (
                      <tr key={product.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 max-w-[200px]">
                          {isEditing ? (
                            <input
                              value={editData.title ?? product.title}
                              onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
                              className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background w-full focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          ) : (
                            <span className="font-sans text-xs font-medium truncate block">{product.title}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">{product.sku}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editData.price ?? Number(product.price)}
                              onChange={(e) => setEditData((d) => ({ ...d, price: Number(e.target.value) }))}
                              className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background w-24 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          ) : (
                            <span className="font-sans text-xs">{Number(product.price).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editData.status ?? product.status}
                              onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value }))}
                              className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wider uppercase font-medium ${statusColors[product.status] ?? ''}`}>
                              {product.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans text-xs text-muted-foreground">
                          {product.featured ? '✓' : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSave(product.slug)}
                                  className="p-1 text-green-700 hover:bg-green-50 rounded-sm transition-colors"
                                  title="Save"
                                >
                                  <Check className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 text-muted-foreground hover:bg-muted rounded-sm transition-colors"
                                  title="Cancel"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingId(product.id); setEditData({}); }}
                                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.slug, product.title)}
                                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-sm transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(data?.totalPages ?? 0) > 1 && (
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
            )}
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
