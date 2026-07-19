import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Boxes,
  Tag,
  Grid2X2,
  Layers,
  LogOut,
  ChevronRight,
  TrendingUp,
  Truck,
  CreditCard,
} from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Boxes, label: 'Inventory', href: '/admin/inventory' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { icon: Grid2X2, label: 'Categories', href: '/admin/categories' },
  { icon: Layers, label: 'Collections', href: '/admin/collections' },
  { icon: TrendingUp, label: 'Finance', href: '/admin/finance' },
  { icon: Truck, label: 'Shipping', href: '/admin/shipping' },
  { icon: CreditCard, label: 'Payment Settings', href: '/admin/payment-settings' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-card">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <BrandMark className="h-6" />
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground ml-1">
              Admin
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
            const isActive = href === '/admin' ? location === '/admin' : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 px-6 py-2.5 font-sans text-sm transition-colors relative',
                  isActive
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                ].join(' ')}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground rounded-r" />
                )}
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="font-sans text-xs font-medium text-muted-foreground uppercase">
                {user?.fullName?.charAt(0) ?? user?.email?.charAt(0) ?? 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-sans text-xs font-medium text-foreground truncate">
                {user?.fullName ?? 'Admin'}
              </p>
              <p className="font-sans text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-2 py-2 rounded-sm font-sans text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar breadcrumb */}
        <header className="h-16 border-b border-border flex items-center px-8 gap-2 shrink-0 bg-background">
          <Link href="/" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
            Store
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="font-sans text-xs text-foreground">
            {NAV_ITEMS.find((n) =>
              n.href === '/admin' ? location === '/admin' : location.startsWith(n.href),
            )?.label ?? 'Admin'}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
