import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListCollections, useCreateCollection, useUpdateCollection, useDeleteCollection } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function AdminCollectionsPage() {
  const { data: collections, isLoading, refetch } = useListCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');

  function toSlug(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await createCollection.mutateAsync({ data: { name: newName, slug: newSlug || toSlug(newName), description: newDescription || undefined } });
      toast.success('Collection created');
      setShowCreate(false); setNewName(''); setNewSlug(''); setNewDescription('');
      refetch();
    } catch {
      toast.error('Failed to create collection');
    }
  }

  async function handleUpdate(id: string) {
    try {
      await updateCollection.mutateAsync({ id, data: { name: editName, slug: editSlug, description: editDescription || undefined } });
      toast.success('Collection updated');
      setEditingId(null);
      refetch();
    } catch {
      toast.error('Failed to update collection');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete collection "${name}"?`)) return;
    try {
      await deleteCollection.mutateAsync({ id });
      toast.success('Collection deleted');
      refetch();
    } catch {
      toast.error('Failed to delete collection');
    }
  }

  const list = Array.isArray(collections) ? collections : [];

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-3xl mb-1">Collections</h1>
              <p className="font-sans text-sm text-muted-foreground">{list.length} collections</p>
            </div>
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-sans text-xs tracking-widest uppercase rounded-sm hover:bg-foreground/90 transition-colors"
            >
              <Plus className="size-3.5" />
              New Collection
            </button>
          </div>

          {showCreate && (
            <div className="bg-card border border-border rounded-sm p-5 mb-4">
              <h3 className="font-sans text-xs tracking-widest uppercase mb-4">New Collection</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Name *</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background w-full focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Slug</label>
                  <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder={newName ? toSlug(newName) : 'auto-generated'} className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background w-full focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="font-sans text-xs text-muted-foreground block mb-1">Description</label>
                  <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="border border-border rounded-sm px-3 py-2 font-sans text-sm bg-background w-full focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={!newName.trim()} className="px-4 py-2 bg-foreground text-background font-sans text-xs tracking-widest uppercase rounded-sm hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Create</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border font-sans text-xs tracking-widest uppercase rounded-sm hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Name', 'Slug', 'Description', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center"><div className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" /></td></tr>
                )}
                {!isLoading && list.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center font-sans text-sm text-muted-foreground">No collections yet</td></tr>
                )}
                {(list as { id: string; name: string; slug: string; description?: string | null }[]).map((col) => {
                  const isEditing = editingId === col.id;
                  return (
                    <tr key={col.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        {isEditing ? <input value={editName} onChange={(e) => setEditName(e.target.value)} className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background w-full focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="font-sans text-xs font-medium">{col.name}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background w-full focus:outline-none focus:ring-1 focus:ring-ring" /> : <code className="font-mono text-xs text-muted-foreground">{col.slug}</code>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="border border-border rounded-sm px-2 py-1 font-sans text-xs bg-background w-full focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="font-sans text-xs text-muted-foreground">{col.description ?? '—'}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleUpdate(col.id)} className="p-1 text-green-700 hover:bg-green-50 rounded-sm"><Check className="size-3.5" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded-sm"><X className="size-3.5" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingId(col.id); setEditName(col.name); setEditSlug(col.slug); setEditDescription(col.description ?? ''); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm"><Pencil className="size-3.5" /></button>
                              <button onClick={() => handleDelete(col.id, col.name)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-sm"><Trash2 className="size-3.5" /></button>
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
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
