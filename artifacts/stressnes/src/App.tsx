import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AuthProvider } from '@/context/auth';
import { CartProvider } from '@/context/cart';

import HomePage from '@/pages/home';
import ProductsPage from '@/pages/products';
import ProductPage from '@/pages/product';
import CategoriesPage from '@/pages/categories';
import CategoryPage from '@/pages/category';
import CollectionsPage from '@/pages/collections';
import CollectionPage from '@/pages/collection';
import SearchPage from '@/pages/search';
import LoginPage from '@/pages/login';
import CheckoutPage from '@/pages/checkout';
import NotFound from '@/pages/not-found';
import AdminDashboardPage from '@/pages/admin/index';
import AdminOrdersPage from '@/pages/admin/orders';
import AdminProductsPage from '@/pages/admin/products';
import AdminCustomersPage from '@/pages/admin/customers';
import AdminInventoryPage from '@/pages/admin/inventory';
import AdminCouponsPage from '@/pages/admin/coupons';
import AdminCategoriesPage from '@/pages/admin/categories';
import AdminCollectionsPage from '@/pages/admin/collections';
import AdminFinancePage from '@/pages/admin/finance';
import AdminShippingPage from '@/pages/admin/shipping';
import AdminPaymentSettingsPage from '@/pages/admin/payment-settings';
import AdminAnalyticsPage from '@/pages/admin/analytics';
import { Analytics } from '@/components/Analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <>
      <Analytics />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/products/:slug" component={ProductPage} />
        <Route path="/categories" component={CategoriesPage} />
        <Route path="/categories/:slug" component={CategoryPage} />
        <Route path="/collections" component={CollectionsPage} />
        <Route path="/collections/:slug" component={CollectionPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/checkout" component={CheckoutPage} />
        {/* Admin routes — protected by RequireAdmin inside each page */}
        <Route path="/admin" component={AdminDashboardPage} />
        <Route path="/admin/orders" component={AdminOrdersPage} />
        <Route path="/admin/products" component={AdminProductsPage} />
        <Route path="/admin/customers" component={AdminCustomersPage} />
        <Route path="/admin/inventory" component={AdminInventoryPage} />
        <Route path="/admin/coupons" component={AdminCouponsPage} />
        <Route path="/admin/categories" component={AdminCategoriesPage} />
        <Route path="/admin/collections" component={AdminCollectionsPage} />
        <Route path="/admin/finance" component={AdminFinancePage} />
        <Route path="/admin/shipping" component={AdminShippingPage} />
        <Route path="/admin/payment-settings" component={AdminPaymentSettingsPage} />
        <Route path="/admin/analytics" component={AdminAnalyticsPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AuthProvider>
              <CartProvider>
                <Router />
                <Toaster position="bottom-right" richColors />
              </CartProvider>
            </AuthProvider>
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
