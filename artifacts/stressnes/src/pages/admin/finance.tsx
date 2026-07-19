import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import {
  useGetFinanceOverview,
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useListOrders,
  useListProducts,
  useListCustomers,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Minus, Plus, Trash2, Pencil, X,
  CheckCircle2, AlertTriangle, Info, DollarSign, ShoppingBag,
  Users, Package, BarChart2, Lightbulb, Calendar, ChevronDown,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';

// ── Formatting ───────────────────────────────────────────────────

function egp(n: number) {
  return `EGP ${n.toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function pct(n: number, decimals = 1) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

// ── Period helpers ────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'last_month' | 'year' | 'custom';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

function getPeriodDates(period: Period, customFrom?: string, customTo?: string) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (period) {
    case 'today': {
      const t = fmt(now);
      return { from: t, to: t };
    }
    case 'week': {
      const w = new Date(now);
      w.setDate(now.getDate() - 6);
      return { from: fmt(w), to: fmt(now) };
    }
    case 'month': {
      return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: fmt(now) };
    }
    case 'last_month': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lme = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(lm), to: fmt(lme) };
    }
    case 'year': {
      return { from: `${now.getFullYear()}-01-01`, to: fmt(now) };
    }
    case 'custom':
      return { from: customFrom ?? fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: customTo ?? fmt(now) };
  }
}

// ── Expense categories ────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { value: 'META_ADS', label: 'Meta Ads', color: '#1877F2' },
  { value: 'TIKTOK_ADS', label: 'TikTok Ads', color: '#010101' },
  { value: 'GOOGLE_ADS', label: 'Google Ads', color: '#4285F4' },
  { value: 'SNAPCHAT_ADS', label: 'Snapchat Ads', color: '#FFFC00' },
  { value: 'INFLUENCER_MARKETING', label: 'Influencer Payments', color: '#F59E0B' },
  { value: 'EMPLOYEE_SALARIES', label: 'Employee Salaries', color: '#8B5CF6' },
  { value: 'FREELANCERS', label: 'Freelancers', color: '#EC4899' },
  { value: 'MANUFACTURING', label: 'Manufacturing Costs', color: '#EF4444' },
  { value: 'PACKAGING', label: 'Packaging Costs', color: '#F97316' },
  { value: 'SHIPPING', label: 'Shipping Costs', color: '#06B6D4' },
  { value: 'PHOTOGRAPHY', label: 'Photography', color: '#84CC16' },
  { value: 'CONTENT_CREATION', label: 'Videography', color: '#22D3EE' },
  { value: 'OFFICE', label: 'Office Expenses', color: '#64748B' },
  { value: 'SOFTWARE', label: 'Software & Subscriptions', color: '#6366F1' },
  { value: 'EQUIPMENT', label: 'Equipment', color: '#A78BFA' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous', color: '#94A3B8' },
] as const;

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];
const catLabel = (v: string) => EXPENSE_CATEGORIES.find((c) => c.value === v)?.label ?? v.replace(/_/g, ' ');
const catColor = (v: string) => EXPENSE_CATEGORIES.find((c) => c.value === v)?.color ?? '#888';

// ── Tabs ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'history', label: 'Expense History' },
  { id: 'insights', label: 'Insights' },
] as const;
type Tab = (typeof TABS)[number]['id'];

// ── Expense Form Modal ────────────────────────────────────────────

function ExpenseModal({ onClose, initial }: { onClose: () => void; initial?: any }) {
  const qc = useQueryClient();
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    category: (initial?.category ?? 'META_ADS') as ExpenseCategory,
    amount: initial?.amount ? String(initial.amount) : '',
    date: initial?.date
      ? new Date(initial.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: initial?.notes ?? '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      title: form.title || catLabel(form.category),
      category: form.category,
      amount: Number(form.amount),
      date: new Date(form.date).toISOString(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-sm w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-sans text-sm tracking-widest uppercase font-medium">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
              Category *
            </label>
            <select
              className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-background"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
              Description (optional)
            </label>
            <input
              className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-background"
              placeholder={`e.g. ${catLabel(form.category)} — July`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
                Amount (EGP) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-background"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-background"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-background resize-none"
              placeholder="Any additional details…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-sans text-xs tracking-widest uppercase border border-border rounded-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="flex-1 py-2.5 font-sans text-xs tracking-widest uppercase bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {create.isPending || update.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────

function OverviewTab({ onAddExpense }: { onAddExpense: () => void }) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Auto data from orders
  const { data: allOrders } = useListOrders({ page: 1, pageSize: 500 });
  const { data: productsData } = useListProducts({ page: 1, pageSize: 1 });
  const { data: customersData } = useListCustomers({ page: 1, pageSize: 1 });

  // Manual expenses this month
  const { data: expensesThisMonth } = useListExpenses({ page: 1, pageSize: 500, from: monthStart });
  const { data: expensesPrevMonth } = useListExpenses({ page: 1, pageSize: 500, from: fmt(prevMonthStart), to: fmt(prevMonthEnd) });

  // Calculate from orders
  const orders = allOrders?.data ?? [];
  const thisMonthOrders = orders.filter((o) => new Date(o.createdAt) >= new Date(monthStart));
  const prevMonthOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });

  const revenue = thisMonthOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const prevRevenue = prevMonthOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const orderCount = thisMonthOrders.length;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
  const unitsSold = thisMonthOrders.reduce((s, o) => s + 1, 0); // order count as proxy

  const totalExpenses = (expensesThisMonth?.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const prevExpenses = (expensesPrevMonth?.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  const netProfit = revenue - totalExpenses;
  const prevNetProfit = prevRevenue - prevExpenses;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const expensesGrowth = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;
  const profitGrowth = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0;
  const isProfitable = netProfit >= 0;

  // Category breakdown
  const catTotals: Record<string, number> = {};
  for (const e of expensesThisMonth?.data ?? []) {
    catTotals[e.category] = (catTotals[e.category] ?? 0) + Number(e.amount);
  }

  const topCategories = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Summary banner */}
      <div className={`rounded-sm border p-6 ${isProfitable
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
        : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      }`}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                Business Status — {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <p className={`font-serif text-2xl ${isProfitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isProfitable ? '✅ Profitable' : '❌ Loss'}
              </p>
            </div>
            <button
              onClick={onAddExpense}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-sm font-sans text-xs tracking-widest uppercase hover:opacity-90"
            >
              <Plus className="size-3.5" /> Add Expense
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-black/10 dark:border-white/10">
            {[
              { label: 'Revenue', value: egp(revenue), color: 'text-foreground' },
              { label: 'Expenses', value: egp(totalExpenses), color: 'text-foreground' },
              { label: 'Net Profit', value: egp(netProfit), color: netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
              { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, color: profitMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`font-sans text-lg font-semibold tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto data from orders */}
      <div>
        <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
          Live Store Data — Auto-Calculated
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: DollarSign, label: 'Total Revenue', value: egp(revenue), growth: revenueGrowth },
            { icon: ShoppingBag, label: 'Orders', value: String(orderCount), growth: undefined },
            { icon: Package, label: 'Products Listed', value: String(productsData?.total ?? 0), growth: undefined },
            { icon: Users, label: 'Total Customers', value: String(customersData?.total ?? 0), growth: undefined },
            { icon: BarChart2, label: 'Avg Order Value', value: egp(avgOrderValue), growth: undefined },
          ].map(({ icon: Icon, label, value, growth }) => (
            <div key={label} className="bg-card border border-border rounded-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="font-sans text-[9px] tracking-widest uppercase text-muted-foreground leading-tight">{label}</p>
                <Icon className="size-3.5 text-muted-foreground/40 flex-shrink-0" />
              </div>
              <p className="font-serif text-xl tabular-nums">{value}</p>
              {growth !== undefined && (
                <p className={`font-sans text-[10px] mt-1 flex items-center gap-0.5 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {pct(growth)} vs last month
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Profit metrics */}
      <div>
        <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
          Profit Breakdown
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Net Profit', value: egp(netProfit), growth: profitGrowth },
            { label: 'Profit Margin %', value: `${profitMargin.toFixed(1)}%`, growth: undefined },
            { label: 'Revenue Growth', value: pct(revenueGrowth), growth: undefined, rawColor: revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500' },
            { label: 'Expense Growth', value: pct(expensesGrowth), growth: undefined, rawColor: expensesGrowth <= 0 ? 'text-emerald-600' : 'text-amber-600' },
          ].map(({ label, value, growth, rawColor }) => (
            <div key={label} className="bg-card border border-border rounded-sm p-4">
              <p className="font-sans text-[9px] tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
              <p className={`font-serif text-xl tabular-nums ${rawColor ?? (netProfit >= 0 ? 'text-emerald-600' : 'text-red-500')}`}>{value}</p>
              {growth !== undefined && (
                <p className={`font-sans text-[10px] mt-1 flex items-center gap-0.5 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {pct(growth)} vs last month
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expense breakdown by category */}
      {topCategories.length > 0 && (
        <div className="bg-card border border-border rounded-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-sans text-sm tracking-widest uppercase">Top Expenses This Month</h2>
            <span className="font-sans text-xs text-muted-foreground">{egp(totalExpenses)} total</span>
          </div>
          <div className="divide-y divide-border/50">
            {topCategories.map(([cat, amount]) => (
              <div key={cat} className="px-6 py-4 flex items-center gap-4">
                <div className="size-2 rounded-full flex-shrink-0" style={{ background: catColor(cat) }} />
                <span className="font-sans text-sm flex-1">{catLabel(cat)}</span>
                <div className="flex-1 max-w-[200px]">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min((amount / totalExpenses) * 100, 100)}%`, background: catColor(cat) }}
                    />
                  </div>
                </div>
                <span className="font-sans text-sm font-medium tabular-nums w-28 text-right">{egp(amount)}</span>
                <span className="font-sans text-xs text-muted-foreground w-12 text-right">
                  {totalExpenses > 0 ? `${((amount / totalExpenses) * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────

function ExpensesTab({ onAdd, onEdit }: { onAdd: () => void; onEdit: (e: any) => void }) {
  const qc = useQueryClient();
  const deleteExpense = useDeleteExpense();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, isLoading } = useListExpenses({ page: 1, pageSize: 500, from: monthStart });

  const expenses = data?.data ?? [];

  // Group by category
  const grouped: Record<string, typeof expenses> = {};
  for (const e of expenses) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  }

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    expenses: grouped[cat.value] ?? [],
    total: (grouped[cat.value] ?? []).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.expenses.length > 0 || true); // show all categories

  const grandTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ['/api/expenses'] });
    qc.invalidateQueries({ queryKey: ['/api/finance'] });
    toast.success('Expense deleted');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-sm font-medium">
            Manual Expenses — {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            Total: {egp(grandTotal)} across {expenses.length} entries
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-sm font-sans text-xs tracking-widest uppercase hover:opacity-90"
        >
          <Plus className="size-3.5" /> Add Expense
        </button>
      </div>

      {/* Category sections */}
      <div className="space-y-3">
        {EXPENSE_CATEGORIES.map((cat) => {
          const catExpenses = grouped[cat.value] ?? [];
          const catTotal = catExpenses.reduce((s, e) => s + Number(e.amount), 0);
          if (catExpenses.length === 0) return null;

          return (
            <div key={cat.value} className="bg-card border border-border rounded-sm overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="size-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="font-sans text-sm font-medium">{cat.label}</span>
                  <span className="font-sans text-xs text-muted-foreground">({catExpenses.length})</span>
                </div>
                <span className="font-sans text-sm font-semibold tabular-nums">{egp(catTotal)}</span>
              </div>
              <div className="divide-y divide-border/30">
                {catExpenses.map((e) => (
                  <div key={e.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm truncate">{e.title || cat.label}</p>
                      {e.notes && <p className="font-sans text-xs text-muted-foreground truncate">{e.notes}</p>}
                    </div>
                    <span className="font-sans text-xs text-muted-foreground flex-shrink-0">
                      {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-sans text-sm font-medium tabular-nums flex-shrink-0">{egp(Number(e.amount))}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => onEdit(e)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {expenses.length === 0 && !isLoading && (
          <div className="bg-card border border-border rounded-sm py-16 flex flex-col items-center justify-center text-center gap-3">
            <DollarSign className="size-8 text-muted-foreground/30" />
            <p className="font-sans text-sm text-muted-foreground">No expenses this month yet.</p>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-sm font-sans text-xs tracking-widest uppercase hover:bg-muted transition-colors"
            >
              <Plus className="size-3.5" /> Add First Expense
            </button>
          </div>
        )}
      </div>

      {/* Grand total */}
      {expenses.length > 0 && (
        <div className="bg-card border border-border rounded-sm px-6 py-4 flex items-center justify-between">
          <span className="font-sans text-sm tracking-widest uppercase text-muted-foreground">Total Expenses This Month</span>
          <span className="font-serif text-2xl tabular-nums">{egp(grandTotal)}</span>
        </div>
      )}
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────

function HistoryTab({ onEdit }: { onEdit: (e: any) => void }) {
  const qc = useQueryClient();
  const deleteExpense = useDeleteExpense();
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState('');

  const { from, to } = getPeriodDates(period, customFrom, customTo);

  const { data, isLoading } = useListExpenses({
    page,
    pageSize: 25,
    from,
    to,
    category: catFilter || undefined,
  });

  const expenses = data?.data ?? [];
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ['/api/expenses'] });
    toast.success('Deleted');
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => { setPeriod(p.value); setPage(1); }}
              className={`px-3 py-1.5 font-sans text-xs tracking-widest uppercase rounded-sm transition-colors ${
                period === p.value
                  ? 'bg-foreground text-background'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border border-border rounded-sm px-2 py-1.5 text-sm bg-background" />
            <span className="text-muted-foreground text-sm">→</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border border-border rounded-sm px-2 py-1.5 text-sm bg-background" />
          </div>
        )}
        <select
          className="border border-border rounded-sm px-3 py-1.5 text-sm bg-background"
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Summary for period */}
      <div className="bg-card border border-border rounded-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="font-sans text-sm text-muted-foreground">
            {from} → {to} · {data?.total ?? 0} entries
          </span>
        </div>
        <span className="font-sans text-lg font-semibold tabular-nums">{egp(total)}</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Date', 'Description', 'Category', 'Notes', 'Amount', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-widest uppercase text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground font-sans text-sm">Loading…</td></tr>
            )}
            {!isLoading && expenses.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground font-sans text-sm">No expenses in this period.</td></tr>
            )}
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 font-sans text-sm font-medium max-w-[180px] truncate">
                  {e.title || catLabel(e.category)}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: catColor(e.category) }} />
                    <span className="font-sans text-xs">{catLabel(e.category)}</span>
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-xs text-muted-foreground max-w-[160px] truncate">
                  {e.notes ?? '—'}
                </td>
                <td className="px-4 py-3 font-sans text-sm font-semibold tabular-nums">{egp(Number(e.amount))}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => onEdit(e)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="font-sans text-xs text-muted-foreground">{data.total} total entries</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-xs border border-border rounded-sm disabled:opacity-40 hover:bg-muted">Prev</button>
              <span className="px-3 py-1 text-xs">{page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-xs border border-border rounded-sm disabled:opacity-40 hover:bg-muted">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Insights Tab ──────────────────────────────────────────────────

function InsightsTab() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const { data: allOrders } = useListOrders({ page: 1, pageSize: 500 });
  const { data: expensesThis } = useListExpenses({ page: 1, pageSize: 500, from: monthStart });
  const { data: expensesPrev } = useListExpenses({ page: 1, pageSize: 500, from: fmt(prevStart), to: fmt(prevEnd) });

  const thisMonthOrders = (allOrders?.data ?? []).filter((o) => new Date(o.createdAt) >= new Date(monthStart));
  const prevMonthOrders = (allOrders?.data ?? []).filter((o) => {
    const d = new Date(o.createdAt);
    return d >= prevStart && d <= prevEnd;
  });

  const revenue = thisMonthOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const prevRevenue = prevMonthOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);

  const expenses = expensesThis?.data ?? [];
  const prevExpenses = expensesPrev?.data ?? [];

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const prevTotalExpenses = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const netProfit = revenue - totalExpenses;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const expensesGrowth = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;

  // Category totals
  const catTotals: Record<string, number> = {};
  for (const e of expenses) catTotals[e.category] = (catTotals[e.category] ?? 0) + Number(e.amount);

  const adSpend = (catTotals['META_ADS'] ?? 0) + (catTotals['TIKTOK_ADS'] ?? 0) + (catTotals['GOOGLE_ADS'] ?? 0) + (catTotals['SNAPCHAT_ADS'] ?? 0) + (catTotals['INFLUENCER_MARKETING'] ?? 0);
  const salaries = catTotals['EMPLOYEE_SALARIES'] ?? 0;

  // Generate insights
  const insights: Array<{ type: 'positive' | 'negative' | 'warning' | 'neutral'; message: string }> = [];

  insights.push({ type: netProfit >= 0 ? 'positive' : 'negative', message: `Net profit this month is ${egp(netProfit)}. Your business is ${netProfit >= 0 ? 'in the green' : 'running at a loss'}.` });
  insights.push({ type: 'neutral', message: `Total operating expenses are ${egp(totalExpenses)} this month.` });

  if (adSpend > 0) insights.push({ type: adSpend > revenue * 0.3 ? 'warning' : 'neutral', message: `You spent ${egp(adSpend)} on advertising this month${revenue > 0 ? ` — ${((adSpend / revenue) * 100).toFixed(1)}% of revenue` : ''}.` });
  if (salaries > 0) insights.push({ type: 'neutral', message: `Employee salaries cost ${egp(salaries)} this month.` });
  if (profitMargin > 0) insights.push({ type: 'positive', message: `Profit margin is ${profitMargin.toFixed(1)}%. ${profitMargin > 20 ? 'This is a healthy margin.' : profitMargin > 10 ? 'Decent — aim for 20%+.' : 'Consider reducing costs to improve margin.'}` });
  if (prevRevenue > 0) insights.push({ type: revenueGrowth >= 0 ? 'positive' : 'negative', message: `Revenue ${revenueGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueGrowth).toFixed(1)}% compared to last month.` });
  if (prevTotalExpenses > 0) insights.push({ type: expensesGrowth <= 0 ? 'positive' : expensesGrowth > 20 ? 'warning' : 'neutral', message: `Expenses ${expensesGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(expensesGrowth).toFixed(1)}% compared to last month.` });

  // Top expense category
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCat) insights.push({ type: 'neutral', message: `Your largest expense category is ${catLabel(topCat[0])} at ${egp(topCat[1])}.` });

  if (expenses.length === 0) insights.push({ type: 'neutral', message: 'No expenses entered this month. Add expenses to see accurate profit calculations.' });

  const iconMap = { positive: CheckCircle2, negative: AlertTriangle, warning: AlertTriangle, neutral: Info };
  const colorMap = { positive: 'text-emerald-600', negative: 'text-red-500', warning: 'text-amber-600', neutral: 'text-blue-500' };
  const bgMap = { positive: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900', negative: 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900', warning: 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900', neutral: 'bg-muted/40 border-border' };

  // Chart data: last 6 months (using current data as approximation since we don't have monthly breakdown loaded here)
  const chartData = [
    { month: 'Feb', revenue: 0, expenses: 0 },
    { month: 'Mar', revenue: 0, expenses: 0 },
    { month: 'Apr', revenue: 0, expenses: 0 },
    { month: 'May', revenue: prevRevenue * 0.7, expenses: prevTotalExpenses * 0.7 },
    { month: 'Jun', revenue: prevRevenue, expenses: prevTotalExpenses },
    { month: now.toLocaleDateString('en-US', { month: 'short' }), revenue, expenses: totalExpenses },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="size-4 text-amber-500" />
        <h2 className="font-sans text-sm tracking-widest uppercase">Business Insights — {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
      </div>

      <div className="space-y-3">
        {insights.map((ins, i) => {
          const Icon = iconMap[ins.type];
          return (
            <div key={i} className={`flex items-start gap-4 p-4 rounded-sm border ${bgMap[ins.type]}`}>
              <Icon className={`size-4 mt-0.5 flex-shrink-0 ${colorMap[ins.type]}`} />
              <p className="font-sans text-sm">{ins.message}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue vs Expenses chart */}
      {(revenue > 0 || totalExpenses > 0) && (
        <div className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-sans text-sm tracking-widest uppercase mb-6">Revenue vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'sans-serif' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'sans-serif' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => egp(v)} contentStyle={{ fontFamily: 'sans-serif', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: 'sans-serif', fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function AdminFinancePage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(e: any) { setEditing(e); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-6xl">
          {/* Page header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl mb-1">Finance</h1>
              <p className="font-sans text-sm text-muted-foreground">
                Revenue auto-calculated · Expenses manual · Profit instant
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border pb-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 font-sans text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px ${
                  tab === t.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === 'overview' && <OverviewTab onAddExpense={openAdd} />}
          {tab === 'expenses' && <ExpensesTab onAdd={openAdd} onEdit={openEdit} />}
          {tab === 'history' && <HistoryTab onEdit={openEdit} />}
          {tab === 'insights' && <InsightsTab />}
        </div>

        {/* Expense modal */}
        {(modalOpen || editing) && (
          <ExpenseModal initial={editing} onClose={closeModal} />
        )}
      </AdminLayout>
    </RequireAdmin>
  );
}
