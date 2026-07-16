import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AuthProvider } from '@/context/auth';
import { CartProvider } from '@/context/cart';
import { IntroVideo } from '@/components/IntroVideo';

import HomePage from '@/pages/home';
import ProductsPage from '@/pages/products';
import ProductPage from '@/pages/product';
import CategoriesPage from '@/pages/categories';
import CategoryPage from '@/pages/category';
import CollectionsPage from '@/pages/collections';
import CollectionPage from '@/pages/collection';
import SearchPage from '@/pages/search';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import AccountPage from '@/pages/account';
import OrdersPage from '@/pages/orders';
import WishlistPage from '@/pages/wishlist';
import CheckoutPage from '@/pages/checkout';
import NotFound from '@/pages/not-found';

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
      <Route path="/register" component={RegisterPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/account/orders" component={OrdersPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route component={NotFound} />
    </Switch>
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
                <IntroVideo />
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
