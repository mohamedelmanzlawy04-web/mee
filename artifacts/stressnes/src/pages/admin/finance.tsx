import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import {
  useGetFinanceOverview,
  useGetFinancePl,
  useGetFinanceCashflow,
  useGetFinanceHealth,
  useGetFinanceInsights,
  useGetProductProfitability,
  useGetAdAnalytics,
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useListEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useListAdSpends,
  useCreateAdSpend,
  useDeleteAdSpend,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Minus,
  Plus, Trash2, Pencil, X, BarChart3, Users, Megaphone,
  Activity, Lightbulb, AlertTriangle, CheckCircle2, Info,
  ChevronDown, Download, Search, Filter,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Helpers ─────────────────────────────────────────────────────

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

function egp(n: number) {
  return `EGP ${n.toLocaleString('en-EG', { maximumFractionDigits: 0 })}`;
}
function pct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pl', label: 'P&L' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'employees', label: 'Employees' },
  { id: 'ads', label: 'Ad Analytics' },
  { id: 'products', label: 'Products' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'health', label: 'Business Health' },
] as const;
type Tab = (typeof TABS)[number]['id'];

// ── KPI Card ────────────────────────────────────────────────────

function KpiCard({
  label, value, growth, icon: Icon, positive, sub,
}: {
  label: string;
  value: string;
  growth?: number;
  icon: React.ElementType;
  positive?: boolean;
  sub?: string;
}) {
  const up = growth !== undefined && growth > 0;
  const down = growth !== undefined && growth < 0;
  const growthColor = up ? 'text-emerald-600' : down ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="bg-card border border-border rounded-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground/40" />
      </div>
      <p className="font-serif text-2xl mb-1 tabular-nums">{value}</p>
      <div className="flex items-center gap-2">
        {growth !== undefined && (
          <span className={`flex items-center gap-0.5 font-sans text-[10px] font-medium ${growthColor}`}>
            {up ? <TrendingUp className="size-3" /> : down ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
            {pct(growth)} vs prior
          </span>
        )}
        {sub && <span className="font-sans text-[10px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────

function OverviewTab({ period }: { period: Period }) {
  const { data: kpi, isLoading } = useGetFinanceOverview({ period });
  const { data: insights } = useGetFinanceInsights();

  if (isLoading) return <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-sm">Loading KPIs…</div>;
  if (!kpi) return null;

  const cards = [
    { label: 'Total Revenue', value: egp(kpi.totalRevenue), growth: kpi.revenueGrowth, icon: DollarSign },
    { label: 'Net Revenue', value: egp(kpi.netRevenue), icon: DollarSign },
    { label: 'Gross Profit', value: egp(kpi.grossProfit), icon: TrendingUp },
    { label: 'Net Profit', value: egp(kpi.netProfit), growth: kpi.monthlyGrowth, icon: TrendingUp },
    { label: 'Total Expenses', value: egp(kpi.totalExpenses), growth: kpi.expensesGrowth, icon: CreditCard },
    { label: 'Profit Margin', value: `${kpi.profitMargin.toFixed(1)}%`, icon: Activity },
    { label: 'Revenue Growth', value: pct(kpi.revenueGrowth), icon: TrendingUp },
    { label: 'Avg Order Value', value: egp(kpi.averageOrderValue), icon: DollarSign },
    { label: 'Outstanding', value: egp(kpi.outstandingPayments), icon: AlertTriangle },
    { label: 'Cost Per Order', value: egp(kpi.costPerOrder), icon: CreditCard },
  ];

  return (
    <div className="space-y-8">
      {/* Summary banner */}
      <div className={`rounded-sm p-6 border ${kpi.netProfit > 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Business Status</p>
            <p className={`font-serif text-xl flex items-center gap-2 ${kpi.netProfit > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {kpi.netProfit > 0 ? '🟢 Profitable' : '🔴 Loss'}
            </p>
          </div>
          <div className="flex gap-8 flex-wrap">
            {[
              { label: 'Revenue', value: egp(kpi.totalRevenue) },
              { label: 'Expenses', value: egp(kpi.totalExpenses) },
              { label: 'Net Profit', value: egp(kpi.netProfit) },
              { label: 'Margin', value: `${kpi.profitMargin.toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="font-sans text-sm font-medium tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-card border border-border rounded-sm">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Lightbulb className="size-4 text-amber-500" />
            <h2 className="font-sans text-sm tracking-widest uppercase">AI Financial Insights</h2>
          </div>
          <div className="divide-y divide-border/50">
            {insights.map((ins, i) => {
              const Icon = ins.type === 'positive' ? CheckCircle2 : ins.type === 'negative' ? AlertTriangle : ins.type === 'warning' ? AlertTriangle : Info;
              const color = ins.type === 'positive' ? 'text-emerald-600' : ins.type === 'negative' ? 'text-red-500' : ins.type === 'warning' ? 'text-amber-600' : 'text-blue-500';
              return (
                <div key={i} className="px-6 py-4 flex items-start gap-3">
                  <Icon className={`size-4 mt-0.5 flex-shrink-0 ${color}`} />
                  <p className="font-sans text-sm text-foreground/80">{ins.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── P&L Tab ──────────────────────────────────────────────────────

function PlTab({ period }: { period: Period }) {
  const { data, isLoading } = useGetFinancePl({ period });
  if (isLoading) return <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-sm">Loading P&L…</div>;
  if (!data) return null;

  const rowBg: Record<string, string> = {
    revenue: 'bg-blue-50/50 dark:bg-blue-950/10 font-medium',
    total: 'bg-muted/30 font-semibold border-t border-border',
    cogs: '',
    operating: '',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: egp(data.revenue), color: 'text-foreground' },
          { label: 'COGS', value: egp(data.cogs), color: 'text-red-500' },
          { label: 'Gross Profit', value: egp(data.grossProfit), color: data.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
          { label: 'Net Profit', value: egp(data.netProfit), color: data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-sm p-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
            <p className={`font-serif text-2xl tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-sans text-sm tracking-widest uppercase">Profit & Loss Statement</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-left font-sans text-[10px] tracking-widest uppercase text-muted-foreground">Line Item</th>
              <th className="px-6 py-3 text-right font-sans text-[10px] tracking-widest uppercase text-muted-foreground">Amount</th>
              <th className="px-6 py-3 text-right font-sans text-[10px] tracking-widest uppercase text-muted-foreground">% Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.filter((r) => Math.abs(r.amount) > 0 || r.type === 'total').map((row, i) => (
              <tr key={i} className={`border-b border-border/50 last:border-0 ${rowBg[row.type] ?? ''}`}>
                <td className="px-6 py-3 font-sans text-sm">{row.label}</td>
                <td className={`px-6 py-3 text-right font-sans text-sm tabular-nums ${row.amount < 0 ? 'text-red-500' : row.type === 'total' ? (row.amount >= 0 ? 'text-emerald-600' : 'text-red-500') : ''}`}>
                  {egp(row.amount)}
                </td>
                <td className="px-6 py-3 text-right font-sans text-xs text-muted-foreground tabular-nums">
                  {data.revenue > 0 ? `${((Math.abs(row.amount) / data.revenue) * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Expense Row ──────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  'META_ADS','TIKTOK_ADS','GOOGLE_ADS','SNAPCHAT_ADS','INFLUENCER_MARKETING',
  'MANUFACTURING','PACKAGING','SHIPPING','EMPLOYEE_SALARIES','FREELANCERS',
  'PHOTOGRAPHY','CONTENT_CREATION','OFFICE','EQUIPMENT','SOFTWARE','RENT',
  'UTILITIES','INTERNET','MISCELLANEOUS',
] as const;

const PAYMENT_METHODS = ['CASH','BANK_TRANSFER','CREDIT_CARD','DEBIT_CARD','INSTAPAY','VODAFONE_CASH','OTHER'] as const;

function catLabel(c: string) { return c.replace(/_/g, ' '); }

function ExpenseForm({ onClose, initial }: { onClose: () => void; initial?: any }) {
  const qc = useQueryClient();
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    category: initial?.category ?? 'MISCELLANEOUS',
    amount: initial?.amount ?? '',
    date: initial?.date ? new Date(initial.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vendor: initial?.vendor ?? '',
    paymentMethod: initial?.paymentMethod ?? '',
    notes: initial?.notes ?? '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...form,
      amount: Number(form.amount),
      date: new Date(form.date).toISOString(),
      vendor: form.vendor || undefined,
      paymentMethod: (form.paymentMethod || undefined) as any,
      notes: form.notes || undefined,
    };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial.id, data: body });
        toast.success('Expense updated');
      } else {
        await create.mutateAsync({ data: body });
        toast.success('Expense added');
      }
      qc.invalidateQueries({ queryKey: ['/api/expenses'] });
      qc.invalidateQueries({ queryKey: ['/api/finance'] });
      onClose();
    } catch {
      toast.error('Failed to save expense');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-sm w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-sans text-sm tracking-widest uppercase">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Title *</label>
              <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Category *</label>
              <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Amount (EGP) *</label>
              <input type="number" min="0" step="0.01" className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Date *</label>
              <input type="date" className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Vendor</label>
              <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Payment Method</label>
              <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="">— Select —</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{catLabel(m)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Notes</label>
              <textarea rows={2} className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 font-sans text-xs tracking-widest uppercase border border-border rounded-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={create.isPending || update.isPending} className="px-4 py-2 font-sans text-xs tracking-widest uppercase bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50">
              {isEdit ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpensesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const deleteExpense = useDeleteExpense();

  const { data, isLoading } = useListExpenses({ page, pageSize: 20, search: search || undefined, category: catFilter || undefined });

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ['/api/expenses'] });
    toast.success('Expense deleted');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input placeholder="Search expenses…" className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-sm bg-background" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="border border-border rounded-sm px-3 py-2 text-sm bg-background" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 font-sans text-xs tracking-widest uppercase bg-foreground text-background rounded-sm hover:opacity-90">
          <Plus className="size-3.5" /> Add Expense
        </button>
      </div>

      {(showForm || editing) && (
        <ExpenseForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Date', 'Title', 'Category', 'Vendor', 'Method', 'Amount', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>
            )}
            {!isLoading && (!data?.data || data.data.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No expenses yet. Add your first one.</td></tr>
            )}
            {data?.data?.map((e) => (
              <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3 font-sans text-sm font-medium">{e.title}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-muted rounded-sm font-sans text-[10px] uppercase tracking-wider">{catLabel(e.category)}</span></td>
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{e.vendor ?? '—'}</td>
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{e.paymentMethod ? catLabel(e.paymentMethod) : '—'}</td>
                <td className="px-4 py-3 font-sans text-sm font-medium tabular-nums">{egp(Number(e.amount))}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setEditing(e)} className="text-muted-foreground hover:text-foreground"><Pencil className="size-3.5" /></button>
                    <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="size-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="font-sans text-xs text-muted-foreground">{data.total} total</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-xs border border-border rounded-sm disabled:opacity-40">Prev</button>
              <span className="px-3 py-1 text-xs">{page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-xs border border-border rounded-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Employees Tab ────────────────────────────────────────────────

function EmployeeForm({ onClose, initial }: { onClose: () => void; initial?: any }) {
  const qc = useQueryClient();
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    position: initial?.position ?? '',
    monthlySalary: initial?.monthlySalary ?? '',
    bonus: initial?.bonus ?? 0,
    commission: initial?.commission ?? 0,
    paymentStatus: initial?.paymentStatus ?? 'PENDING',
    isActive: initial?.isActive ?? true,
    notes: initial?.notes ?? '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...form, monthlySalary: Number(form.monthlySalary), bonus: Number(form.bonus), commission: Number(form.commission) };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial.id, data: body });
        toast.success('Employee updated');
      } else {
        await create.mutateAsync({ data: body });
        toast.success('Employee added');
      }
      qc.invalidateQueries({ queryKey: ['/api/employees'] });
      onClose();
    } catch { toast.error('Failed to save'); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-sm w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-sans text-sm tracking-widest uppercase">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose}><X className="size-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Name *</label>
              <input required className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Position *</label>
              <input required className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Monthly Salary (EGP) *</label>
              <input type="number" min="0" required className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Bonus (EGP)</label>
              <input type="number" min="0" className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Commission (EGP)</label>
              <input type="number" min="0" className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.commission} onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Payment Status</label>
              <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="isActive" className="font-sans text-sm">Active employee</label>
            </div>
            <div className="col-span-2">
              <label className="block font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">Notes</label>
              <textarea rows={2} className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-background resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 font-sans text-xs tracking-widest uppercase border border-border rounded-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={create.isPending || update.isPending} className="px-4 py-2 font-sans text-xs tracking-widest uppercase bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50">
              {isEdit ? 'Update' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeesTab() {
  const qc = useQueryClient();
  const { data: employees, isLoading } = useListEmployees();
  const deleteEmp = useDeleteEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const payStatusColor: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 font-sans text-xs tracking-widest uppercase bg-foreground text-background rounded-sm hover:opacity-90">
          <Plus className="size-3.5" /> Add Employee
        </button>
      </div>
      {(showForm || editing) && (
        <EmployeeForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Name', 'Position', 'Salary', 'Bonus', 'Commission', 'Total', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>}
            {!isLoading && (!employees || employees.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No employees added yet.</td></tr>
            )}
            {employees?.map((emp) => (
              <tr key={emp.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-sans text-sm font-medium">{emp.name}</td>
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{emp.position}</td>
                <td className="px-4 py-3 font-sans text-sm tabular-nums">{egp(emp.monthlySalary)}</td>
                <td className="px-4 py-3 font-sans text-xs tabular-nums text-muted-foreground">{egp(emp.bonus)}</td>
                <td className="px-4 py-3 font-sans text-xs tabular-nums text-muted-foreground">{egp(emp.commission)}</td>
                <td className="px-4 py-3 font-sans text-sm font-medium tabular-nums">{egp(emp.monthlySalary + emp.bonus + emp.commission)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-sm font-sans text-[10px] uppercase tracking-wider ${payStatusColor[emp.paymentStatus] ?? 'bg-muted'}`}>{emp.paymentStatus}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setEditing(emp)}><Pencil className="size-3.5 text-muted-foreground hover:text-foreground" /></button>
                    <button onClick={async () => { if (!confirm('Delete employee?')) return; await deleteEmp.mutateAsync({ id: emp.id }); qc.invalidateQueries({ queryKey: ['/api/employees'] }); toast.success('Employee deleted'); }}>
                      <Trash2 className="size-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {employees && employees.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={2} className="px-4 py-3 font-sans text-xs uppercase tracking-wider font-semibold">Monthly Total</td>
                <td className="px-4 py-3 font-sans text-sm font-semibold tabular-nums">{egp(employees.reduce((s, e) => s + e.monthlySalary, 0))}</td>
                <td className="px-4 py-3 font-sans text-xs tabular-nums">{egp(employees.reduce((s, e) => s + e.bonus, 0))}</td>
                <td className="px-4 py-3 font-sans text-xs tabular-nums">{egp(employees.reduce((s, e) => s + e.commission, 0))}</td>
                <td className="px-4 py-3 font-sans text-sm font-semibold tabular-nums">{egp(employees.reduce((s, e) => s + e.monthlySalary + e.bonus + e.commission, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Ad Analytics Tab ─────────────────────────────────────────────

function AdsTab({ period }: { period: Period }) {
  const qc = useQueryClient();
  const { data: analytics } = useGetAdAnalytics({ period });
  const { data: adSpends, isLoading } = useListAdSpends();
  const createAdSpend = useCreateAdSpend();
  const deleteAdSpend = useDeleteAdSpend();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: 'META', amount: '', revenue: '', date: new Date().toISOString().split('T')[0], impressions: '', clicks: '', conversions: '', notes: '' });

  async function submitAdSpend(e: React.FormEvent) {
    e.preventDefault();
    await createAdSpend.mutateAsync({ data: { ...form, platform: form.platform as any, amount: Number(form.amount), revenue: Number(form.revenue) || 0, date: new Date(form.date).toISOString(), impressions: form.impressions ? Number(form.impressions) : undefined, clicks: form.clicks ? Number(form.clicks) : undefined, conversions: form.conversions ? Number(form.conversions) : undefined } });
    qc.invalidateQueries({ queryKey: ['/api/ad-spends'] });
    toast.success('Ad spend added');
    setShowForm(false);
  }

  const platformColors: Record<string, string> = { META: '#1877F2', TIKTOK: '#010101', GOOGLE: '#4285F4', SNAPCHAT: '#FFFC00', OTHER: '#888' };

  return (
    <div className="space-y-6">
      {analytics && analytics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.map((a) => (
            <div key={a.platform} className="bg-card border border-border rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-2 rounded-full" style={{ background: platformColors[a.platform] ?? '#888' }} />
                <p className="font-sans text-sm font-medium">{a.platform}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Spend', value: egp(a.spend) },
                  { label: 'Revenue', value: egp(a.revenue) },
                  { label: 'ROAS', value: `${a.roas.toFixed(2)}x` },
                  { label: 'Profit After Ads', value: egp(a.profitAfterAds) },
                  { label: 'CPA', value: a.cpa > 0 ? egp(a.cpa) : '—' },
                  { label: 'Conversions', value: a.conversions > 0 ? String(a.conversions) : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="font-sans text-sm font-medium tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="font-sans text-sm tracking-widest uppercase">Ad Spend Log</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 font-sans text-xs tracking-widest uppercase bg-foreground text-background rounded-sm hover:opacity-90">
          <Plus className="size-3.5" /> Add Spend
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-5">
          <form onSubmit={submitAdSpend} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Platform</label>
              <select className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-background" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {['META', 'TIKTOK', 'GOOGLE', 'SNAPCHAT', 'OTHER'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Spend (EGP) *</label>
              <input type="number" min="0" required className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-background" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Revenue (EGP)</label>
              <input type="number" min="0" className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-background" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Date *</label>
              <input type="date" required className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-background" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Impressions</label>
              <input type="number" min="0" className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-background" value={form.impressions} onChange={(e) => setForm({ ...form, impressions: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Clicks</label>
              <input type="number" min="0" className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-background" value={form.clicks} onChange={(e) => setForm({ ...form, clicks: e.target.value })} />
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Conversions</label>
              <input type="number" min="0" className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-background" value={form.conversions} onChange={(e) => setForm({ ...form, conversions: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="px-4 py-1.5 font-sans text-xs uppercase tracking-widest bg-foreground text-background rounded-sm">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 font-sans text-xs uppercase tracking-widest border border-border rounded-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Date', 'Platform', 'Spend', 'Revenue', 'ROAS', 'Conversions', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>}
            {!isLoading && (!adSpends || adSpends.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No ad spend entries yet.</td></tr>
            )}
            {adSpends?.map((s) => (
              <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="size-1.5 rounded-full" style={{ background: platformColors[s.platform] ?? '#888' }} /><span className="font-sans text-sm">{s.platform}</span></div></td>
                <td className="px-4 py-3 font-sans text-sm tabular-nums">{egp(s.amount)}</td>
                <td className="px-4 py-3 font-sans text-sm tabular-nums">{egp(s.revenue)}</td>
                <td className="px-4 py-3 font-sans text-sm tabular-nums">{s.amount > 0 ? `${(s.revenue / s.amount).toFixed(2)}x` : '—'}</td>
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground">{s.conversions ?? '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={async () => { if (!confirm('Delete?')) return; await deleteAdSpend.mutateAsync({ id: s.id }); qc.invalidateQueries({ queryKey: ['/api/ad-spends'] }); toast.success('Deleted'); }}>
                    <Trash2 className="size-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Product Profitability Tab ─────────────────────────────────────

function ProductsTab() {
  const { data, isLoading } = useGetProductProfitability();
  if (isLoading) return <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-sm">Loading…</div>;
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-sm">No sales data yet. Place orders to see product profitability.</div>;

  const sorted = [...data].sort((a, b) => b.profit - a.profit);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const highestMargin = [...data].sort((a, b) => b.margin - a.margin)[0];
  const lowestMargin = [...data].sort((a, b) => a.margin - b.margin)[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Best Performer', value: best?.productTitle ?? '—', sub: `${egp(best?.profit ?? 0)} profit` },
          { label: 'Worst Performer', value: worst?.productTitle ?? '—', sub: `${egp(worst?.profit ?? 0)} profit` },
          { label: 'Highest Margin', value: highestMargin?.productTitle ?? '—', sub: `${highestMargin?.margin.toFixed(1) ?? 0}%` },
          { label: 'Lowest Margin', value: lowestMargin?.productTitle ?? '—', sub: `${lowestMargin?.margin.toFixed(1) ?? 0}%` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border rounded-sm p-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
            <p className="font-sans text-sm font-medium truncate">{value}</p>
            <p className="font-sans text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Product', 'Units Sold', 'Revenue', 'COGS', 'Advertising', 'Profit', 'Margin'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.productId} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-sans text-sm font-medium">{p.productTitle}</td>
                <td className="px-4 py-3 font-sans text-sm tabular-nums">{p.unitsSold}</td>
                <td className="px-4 py-3 font-sans text-sm tabular-nums">{egp(p.revenue)}</td>
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground tabular-nums">{egp(p.productCost + p.packagingCost + p.shippingCost)}</td>
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground tabular-nums">{egp(p.advertisingAllocation)}</td>
                <td className={`px-4 py-3 font-sans text-sm font-medium tabular-nums ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{egp(p.profit)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.margin >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(p.margin), 100)}%` }} />
                    </div>
                    <span className="font-sans text-xs tabular-nums">{p.margin.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Cash Flow Tab ─────────────────────────────────────────────────

function CashFlowTab() {
  const { data, isLoading } = useGetFinanceCashflow();
  if (isLoading) return <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-sm">Loading…</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Money In', value: egp(data.moneyIn), color: 'text-emerald-600' },
          { label: 'Money Out', value: egp(data.moneyOut), color: 'text-red-500' },
          { label: 'Net Cash Flow', value: egp(data.netCashFlow), color: data.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500' },
          { label: 'Cash Balance', value: egp(data.cashBalance), color: 'text-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-sm p-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
            <p className={`font-serif text-2xl tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-sm p-6">
        <h2 className="font-sans text-sm tracking-widest uppercase mb-6">Monthly Cash Flow — Last 12 Months</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'sans-serif' }} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'sans-serif' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => egp(v)} contentStyle={{ fontFamily: 'sans-serif', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontFamily: 'sans-serif', fontSize: 11 }} />
            <Area type="monotone" dataKey="moneyIn" name="Money In" stroke="#10b981" fill="url(#colorIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="moneyOut" name="Money Out" stroke="#ef4444" fill="url(#colorOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Business Health Tab ───────────────────────────────────────────

function HealthTab() {
  const { data, isLoading } = useGetFinanceHealth();
  if (isLoading) return <div className="h-64 flex items-center justify-center text-muted-foreground font-sans text-sm">Loading…</div>;
  if (!data) return null;

  const metrics = [
    { label: 'Am I Profitable?', value: data.isProfitable ? '✅ Yes' : '❌ No', color: data.isProfitable ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Net Margin', value: `${data.netMargin.toFixed(1)}%`, color: data.netMargin > 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Monthly Profit', value: egp(data.monthlyProfit), color: data.monthlyProfit > 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Revenue Growth', value: pct(data.revenueGrowth), color: data.revenueGrowth > 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Expense Growth', value: pct(data.expenseGrowth), color: data.expenseGrowth < 0 ? 'text-emerald-600' : data.expenseGrowth > 15 ? 'text-red-500' : 'text-amber-600' },
    { label: 'Burn Rate / Month', value: egp(data.burnRate), color: 'text-foreground' },
    { label: 'Break-even Point', value: egp(data.breakEvenPoint), color: 'text-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className={`rounded-sm p-6 border ${data.isProfitable ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
        <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Overall Status</p>
        <p className={`font-serif text-3xl ${data.isProfitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {data.isProfitable ? '🟢 Profitable Business' : '🔴 Running at a Loss'}
        </p>
        {data.explanation && (
          <p className="font-sans text-sm text-muted-foreground mt-2">{data.explanation}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-sm p-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
            <p className={`font-sans text-lg font-medium tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function AdminFinancePage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<Period>('month');

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl mb-1">Finance</h1>
              <p className="font-sans text-sm text-muted-foreground">Business financial operating system</p>
            </div>
            {/* Period picker — only relevant for data-period tabs */}
            {['overview', 'pl', 'ads'].includes(tab) && (
              <div className="flex items-center gap-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="border border-border rounded-sm px-3 py-2 text-sm bg-card font-sans"
                >
                  {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 mb-8 pb-2 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap px-4 py-2 font-sans text-xs tracking-widest uppercase rounded-sm transition-colors ${
                  tab === t.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'overview' && <OverviewTab period={period} />}
          {tab === 'pl' && <PlTab period={period} />}
          {tab === 'expenses' && <ExpensesTab />}
          {tab === 'employees' && <EmployeesTab />}
          {tab === 'ads' && <AdsTab period={period} />}
          {tab === 'products' && <ProductsTab />}
          {tab === 'cashflow' && <CashFlowTab />}
          {tab === 'health' && <HealthTab />}
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
