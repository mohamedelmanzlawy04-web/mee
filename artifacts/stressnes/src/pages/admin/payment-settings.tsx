import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useGetPaymentSettings, useUpdatePaymentSettings } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Banknote, Smartphone, Wallet, Save } from 'lucide-react';

const inputCls = 'w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring';
const labelCls = 'font-sans text-xs text-muted-foreground block mb-1.5';

interface FormState {
  codEnabled: boolean;
  instapayEnabled: boolean;
  ewalletEnabled: boolean;
  instapayNumber: string;
  ewalletNumber: string;
  accountName: string;
  instapayInstructions: string;
  ewalletInstructions: string;
}

export default function AdminPaymentSettingsPage() {
  const { data: settings, isLoading } = useGetPaymentSettings();
  const updateSettings = useUpdatePaymentSettings();

  const [form, setForm] = useState<FormState>({
    codEnabled: true,
    instapayEnabled: true,
    ewalletEnabled: true,
    instapayNumber: '01030076090',
    ewalletNumber: '01030076090',
    accountName: 'STRESSNES',
    instapayInstructions: '',
    ewalletInstructions: '',
  });

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        codEnabled: settings.codEnabled,
        instapayEnabled: settings.instapayEnabled,
        ewalletEnabled: settings.ewalletEnabled,
        instapayNumber: settings.instapayNumber,
        ewalletNumber: settings.ewalletNumber,
        accountName: settings.accountName,
        instapayInstructions: settings.instapayInstructions,
        ewalletInstructions: settings.ewalletInstructions,
      });
      setDirty(false);
    }
  }, [settings]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ data: form });
      toast.success('Payment settings saved');
      setDirty(false);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <RequireAdmin>
        <AdminLayout>
          <div className="flex items-center justify-center h-40">
            <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        </AdminLayout>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-3xl mb-1">Payment Settings</h1>
              <p className="font-sans text-sm text-muted-foreground">Configure payment methods shown at checkout</p>
            </div>
            <Button onClick={handleSave} disabled={!dirty || updateSettings.isPending} size="sm">
              <Save className="size-4 mr-1.5" />
              {updateSettings.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>

          <div className="space-y-6">

            {/* ── Cash on Delivery ─────────────────────────── */}
            <div className="bg-card border border-border rounded-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                    <Banknote className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium">Cash on Delivery</p>
                    <p className="font-sans text-xs text-muted-foreground">No upfront payment required</p>
                  </div>
                </div>
                <ToggleSwitch enabled={form.codEnabled} onChange={(v) => set('codEnabled', v)} />
              </div>
            </div>

            {/* ── InstaPay ──────────────────────────────────── */}
            <div className="bg-card border border-border rounded-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                    <Smartphone className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium">InstaPay</p>
                    <p className="font-sans text-xs text-muted-foreground">Screenshot verification required</p>
                  </div>
                </div>
                <ToggleSwitch enabled={form.instapayEnabled} onChange={(v) => set('instapayEnabled', v)} />
              </div>

              <div className={['space-y-3 transition-opacity', form.instapayEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'].join(' ')}>
                <div>
                  <label className={labelCls}>InstaPay Number</label>
                  <input value={form.instapayNumber} onChange={(e) => set('instapayNumber', e.target.value)} className={inputCls} placeholder="01030076090" />
                </div>
                <div>
                  <label className={labelCls}>Account Name</label>
                  <input value={form.accountName} onChange={(e) => set('accountName', e.target.value)} className={inputCls} placeholder="STRESSNES" />
                </div>
                <div>
                  <label className={labelCls}>Instructions shown at checkout</label>
                  <textarea
                    value={form.instapayInstructions}
                    onChange={(e) => set('instapayInstructions', e.target.value)}
                    rows={2}
                    className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    placeholder="Transfer the total amount to the number above, then upload a screenshot."
                  />
                </div>
              </div>
            </div>

            {/* ── E-Wallet ──────────────────────────────────── */}
            <div className="bg-card border border-border rounded-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium">E-Wallet</p>
                    <p className="font-sans text-xs text-muted-foreground">Vodafone Cash, Orange Money — screenshot verification required</p>
                  </div>
                </div>
                <ToggleSwitch enabled={form.ewalletEnabled} onChange={(v) => set('ewalletEnabled', v)} />
              </div>

              <div className={['space-y-3 transition-opacity', form.ewalletEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'].join(' ')}>
                <div>
                  <label className={labelCls}>Wallet Number</label>
                  <input value={form.ewalletNumber} onChange={(e) => set('ewalletNumber', e.target.value)} className={inputCls} placeholder="01030076090" />
                </div>
                <div>
                  <label className={labelCls}>Account Name</label>
                  <input value={form.accountName} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
                  <p className="font-sans text-[10px] text-muted-foreground mt-1">Shared with InstaPay above</p>
                </div>
                <div>
                  <label className={labelCls}>Instructions shown at checkout</label>
                  <textarea
                    value={form.ewalletInstructions}
                    onChange={(e) => set('ewalletInstructions', e.target.value)}
                    rows={2}
                    className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    placeholder="Transfer the total amount to the wallet above, then upload a screenshot."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={['relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0',
        enabled ? 'bg-foreground' : 'bg-border'].join(' ')}
    >
      <span className={['size-4 rounded-full bg-background shadow-sm transition-transform',
        enabled ? 'translate-x-5' : 'translate-x-1'].join(' ')} />
    </button>
  );
}
