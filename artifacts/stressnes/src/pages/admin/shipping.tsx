import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListGovernorates,
  useCreateGovernorate,
  useUpdateGovernorate,
  useDeleteGovernorate,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
  getListGovernoratesQueryKey,
  type Governorate,
  type City,
} from '@workspace/api-client-react';
import { Plus, Trash2, Pencil, X, ChevronRight, ChevronDown, MapPin } from 'lucide-react';

interface GovForm {
  name: string;
  nameAr: string;
  shippingPrice: number;
  estimatedDays: number;
  isActive: boolean;
}

const EMPTY_GOV: GovForm = { name: '', nameAr: '', shippingPrice: 0, estimatedDays: 3, isActive: true };

interface CityForm {
  name: string;
  nameAr: string;
}

const EMPTY_CITY: CityForm = { name: '', nameAr: '' };

const inputCls = 'w-full font-sans text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground';
const labelCls = 'font-sans text-xs text-muted-foreground block mb-1';

export default function AdminShippingPage() {
  const queryClient = useQueryClient();
  const { data: governorates = [], isLoading } = useListGovernorates();

  // Governorate create/edit state
  const [showGovForm, setShowGovForm] = useState(false);
  const [editingGov, setEditingGov] = useState<Governorate | null>(null);
  const [govForm, setGovForm] = useState<GovForm>(EMPTY_GOV);
  const [govError, setGovError] = useState('');

  // Expanded governorate for city management
  const [expandedGovId, setExpandedGovId] = useState<string | null>(null);

  // City create/edit state
  const [showCityForm, setShowCityForm] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityForm, setCityForm] = useState<CityForm>(EMPTY_CITY);
  const [cityError, setCityError] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListGovernoratesQueryKey() });

  const createGovMutation = useCreateGovernorate({ mutation: { onSuccess: () => { invalidate(); closeGovForm(); }, onError: (e: any) => setGovError(e?.message ?? 'Failed') } });
  const updateGovMutation = useUpdateGovernorate({ mutation: { onSuccess: () => { invalidate(); closeGovForm(); }, onError: (e: any) => setGovError(e?.message ?? 'Failed') } });
  const deleteGovMutation = useDeleteGovernorate({ mutation: { onSuccess: invalidate } });
  const createCityMutation = useCreateCity({ mutation: { onSuccess: () => { invalidate(); closeCityForm(); }, onError: (e: any) => setCityError(e?.message ?? 'Failed') } });
  const updateCityMutation = useUpdateCity({ mutation: { onSuccess: () => { invalidate(); closeCityForm(); }, onError: (e: any) => setCityError(e?.message ?? 'Failed') } });
  const deleteCityMutation = useDeleteCity({ mutation: { onSuccess: invalidate } });

  function openCreateGov() { setEditingGov(null); setGovForm(EMPTY_GOV); setGovError(''); setShowGovForm(true); }
  function openEditGov(gov: Governorate) {
    setEditingGov(gov);
    setGovForm({ name: gov.name, nameAr: gov.nameAr ?? '', shippingPrice: Number(gov.shippingPrice), estimatedDays: gov.estimatedDays, isActive: gov.isActive });
    setGovError('');
    setShowGovForm(true);
  }
  function closeGovForm() { setShowGovForm(false); setEditingGov(null); setGovForm(EMPTY_GOV); setGovError(''); }

  function openCreateCity(govId: string) { setExpandedGovId(govId); setEditingCity(null); setCityForm(EMPTY_CITY); setCityError(''); setShowCityForm(true); }
  function openEditCity(city: City) { setEditingCity(city); setCityForm({ name: city.name, nameAr: city.nameAr ?? '' }); setCityError(''); setShowCityForm(true); }
  function closeCityForm() { setShowCityForm(false); setEditingCity(null); setCityForm(EMPTY_CITY); setCityError(''); }

  function handleGovSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGovError('');
    if (!govForm.name.trim()) { setGovError('Name is required'); return; }
    if (govForm.shippingPrice < 0) { setGovError('Shipping price cannot be negative'); return; }
    if (govForm.estimatedDays < 1) { setGovError('Estimated days must be at least 1'); return; }
    const data = { name: govForm.name.trim(), nameAr: govForm.nameAr.trim() || null, shippingPrice: govForm.shippingPrice, estimatedDays: govForm.estimatedDays, isActive: govForm.isActive };
    if (editingGov) {
      updateGovMutation.mutate({ id: editingGov.id, data });
    } else {
      createGovMutation.mutate({ data });
    }
  }

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    setCityError('');
    if (!cityForm.name.trim()) { setCityError('Name is required'); return; }
    const data = { name: cityForm.name.trim(), nameAr: cityForm.nameAr.trim() || null };
    if (editingCity) {
      updateCityMutation.mutate({ id: editingCity.governorateId, cityId: editingCity.id, data });
    } else if (expandedGovId) {
      createCityMutation.mutate({ id: expandedGovId, data });
    }
  }

  function handleDeleteGov(id: string) {
    if (!confirm('Delete this governorate and all its cities? This cannot be undone.')) return;
    deleteGovMutation.mutate({ id });
  }

  function handleDeleteCity(govId: string, cityId: string) {
    if (!confirm('Delete this city?')) return;
    deleteCityMutation.mutate({ id: govId, cityId });
  }

  const govList = Array.isArray(governorates) ? governorates : [];

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl mb-1">Shipping</h1>
              <p className="font-sans text-sm text-muted-foreground">
                {govList.length} governorates · Manage shipping prices and city lists
              </p>
            </div>
            <button onClick={openCreateGov} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-sans text-sm rounded-sm hover:bg-foreground/90 transition-colors">
              <Plus className="size-4" /> Add Governorate
            </button>
          </div>

          {/* Governorate form */}
          {showGovForm && (
            <div className="mb-6 bg-card border border-border rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-sm font-medium">{editingGov ? 'Edit Governorate' : 'Add Governorate'}</h2>
                <button onClick={closeGovForm}><X className="size-4 text-muted-foreground hover:text-foreground" /></button>
              </div>
              <form onSubmit={handleGovSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name (English) *</label>
                  <input value={govForm.name} onChange={(e) => setGovForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Cairo" required />
                </div>
                <div>
                  <label className={labelCls}>Name (Arabic)</label>
                  <input value={govForm.nameAr} onChange={(e) => setGovForm((f) => ({ ...f, nameAr: e.target.value }))} className={inputCls} placeholder="القاهرة" dir="rtl" />
                </div>
                <div>
                  <label className={labelCls}>Shipping Price (EGP) *</label>
                  <input type="number" min="0" step="0.01" value={govForm.shippingPrice} onChange={(e) => setGovForm((f) => ({ ...f, shippingPrice: parseFloat(e.target.value) || 0 }))} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Estimated Delivery (days) *</label>
                  <input type="number" min="1" step="1" value={govForm.estimatedDays} onChange={(e) => setGovForm((f) => ({ ...f, estimatedDays: parseInt(e.target.value) || 1 }))} className={inputCls} required />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="govActive" checked={govForm.isActive} onChange={(e) => setGovForm((f) => ({ ...f, isActive: e.target.checked }))} />
                  <label htmlFor="govActive" className="font-sans text-sm cursor-pointer">Active (visible to customers)</label>
                </div>
                {govError && <p className="col-span-2 font-sans text-xs text-destructive">{govError}</p>}
                <div className="col-span-2 flex gap-3 justify-end pt-2">
                  <button type="button" onClick={closeGovForm} className="px-4 py-2 font-sans text-sm border border-border rounded-sm hover:bg-muted/50 transition-colors">Cancel</button>
                  <button type="submit" disabled={createGovMutation.isPending || updateGovMutation.isPending} className="px-4 py-2 font-sans text-sm bg-foreground text-background rounded-sm hover:bg-foreground/90 transition-colors disabled:opacity-50">
                    {(createGovMutation.isPending || updateGovMutation.isPending) ? 'Saving…' : editingGov ? 'Save Changes' : 'Add Governorate'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* City form */}
          {showCityForm && (
            <div className="mb-6 bg-card border border-border rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-sm font-medium">{editingCity ? 'Edit City' : 'Add City'}</h2>
                <button onClick={closeCityForm}><X className="size-4 text-muted-foreground hover:text-foreground" /></button>
              </div>
              <form onSubmit={handleCitySubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City Name (English) *</label>
                  <input value={cityForm.name} onChange={(e) => setCityForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Nasr City" required />
                </div>
                <div>
                  <label className={labelCls}>City Name (Arabic)</label>
                  <input value={cityForm.nameAr} onChange={(e) => setCityForm((f) => ({ ...f, nameAr: e.target.value }))} className={inputCls} placeholder="نصر سيتي" dir="rtl" />
                </div>
                {cityError && <p className="col-span-2 font-sans text-xs text-destructive">{cityError}</p>}
                <div className="col-span-2 flex gap-3 justify-end pt-2">
                  <button type="button" onClick={closeCityForm} className="px-4 py-2 font-sans text-sm border border-border rounded-sm hover:bg-muted/50 transition-colors">Cancel</button>
                  <button type="submit" disabled={createCityMutation.isPending || updateCityMutation.isPending} className="px-4 py-2 font-sans text-sm bg-foreground text-background rounded-sm hover:bg-foreground/90 transition-colors disabled:opacity-50">
                    {(createCityMutation.isPending || updateCityMutation.isPending) ? 'Saving…' : editingCity ? 'Save Changes' : 'Add City'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Governorates list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : govList.length === 0 ? (
            <div className="bg-card border border-border rounded-sm p-12 text-center">
              <MapPin className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-sans text-sm text-muted-foreground">No governorates yet. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {govList.map((gov) => {
                const isExpanded = expandedGovId === gov.id;
                return (
                  <div key={gov.id} className="bg-card border border-border rounded-sm overflow-hidden">
                    {/* Governorate row */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      <button onClick={() => setExpandedGovId(isExpanded ? null : gov.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-sans text-sm font-medium">{gov.name}</span>
                          {gov.nameAr && <span className="font-sans text-xs text-muted-foreground" dir="rtl">{gov.nameAr}</span>}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-[10px] tracking-widest uppercase ${gov.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                            {gov.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className="font-sans text-xs text-muted-foreground">EGP {Number(gov.shippingPrice).toLocaleString()} shipping</span>
                          <span className="font-sans text-xs text-muted-foreground">{gov.estimatedDays} day{gov.estimatedDays !== 1 ? 's' : ''} delivery</span>
                          <span className="font-sans text-xs text-muted-foreground">{gov.cities?.length ?? 0} cities</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEditGov(gov)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors" title="Edit">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDeleteGov(gov.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Delete">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Cities section */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">Cities</span>
                          <button onClick={() => openCreateCity(gov.id)} className="flex items-center gap-1.5 font-sans text-xs text-foreground hover:opacity-70 transition-opacity">
                            <Plus className="size-3" /> Add City
                          </button>
                        </div>
                        {(!gov.cities || gov.cities.length === 0) ? (
                          <p className="font-sans text-xs text-muted-foreground">No cities yet. Add one above.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {gov.cities.map((city) => (
                              <div key={city.id} className="flex items-center gap-1.5 bg-background border border-border rounded-full px-3 py-1">
                                <span className="font-sans text-xs">{city.name}</span>
                                <button onClick={() => openEditCity(city)} className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
                                  <Pencil className="size-2.5" />
                                </button>
                                <button onClick={() => handleDeleteCity(gov.id, city.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <X className="size-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
