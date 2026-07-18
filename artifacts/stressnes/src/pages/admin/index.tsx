import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useListOrders, useListProducts, useListCustomers } from '@workspace/api-client-react';
import { ShoppingBag, Package, Users, TrendingUp } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-EG').format(n);
}

function currency(n: number) {
  return `EGP ${new Intl.NumberFormat('en-EG').format(n)}`;
}

export default function AdminDashboardPage() {
  const { data: ordersData } = useListOrders({ page: 1, pageSize: 5 });
  const { data: productsData } = useListProducts({ page: 1, pageSize: 1 });
  const { data: customersData } = useListCustomers({ page: 1, pageSize: 1 });
  const { data: recentOrders } = useListOrders({ page: 1, pageSize: 8 });

  const totalRevenue =
    recentOrders?.data?.reduce((sum, o) => sum + Number(o.total ?? 0), 0) ?? 0;

  const stats = [
    {
      label: 'Total Orders',
      value: fmt(ordersData?.total ?? 0),
      icon: ShoppingBag,
      sub: 'all time',
    },
    {
      label: 'Products',
      value: fmt(productsData?.total ?? 0),
      icon: Package,
      sub: 'in catalogue',
    },
    {
      label: 'Customers',
      value: fmt(customersData?.total ?? 0),
      icon: Users,
      sub: 'registered',
    },
    {
      label: 'Recent Revenue',
      value: currency(totalRevenue),
      icon: TrendingUp,
      sub: 'latest 8 orders',
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    PACKED: 'bg-indigo-100 text-indigo-800',
    SHIPPED: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-6xl">
          <h1 className="font-serif text-3xl mb-1">Dashboard</h1>
          <p className="font-sans text-sm text-muted-foreground mb-8">
            Overview of your store's performance
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="bg-card border border-border rounded-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
                    {label}
                  </p>
                  <Icon className="size-4 text-muted-foreground/50" />
                </div>
                <p className="font-serif text-2xl mb-1">{value}</p>
                <p className="font-sans text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="bg-card border border-border rounded-sm">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-sans text-sm tracking-widest uppercase">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Order', 'Status', 'Total', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders?.data?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground font-sans text-sm">
                        No orders yet
                      </td>
                    </tr>
                  )}
                  {recentOrders?.data?.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 last:border-0">
                      <td className="px-6 py-3 font-sans text-xs font-medium">{order.orderNumber}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wider uppercase font-medium ${
                            statusColors[order.status] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-sans text-xs">
                        EGP {Number(order.total ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 font-sans text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
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
