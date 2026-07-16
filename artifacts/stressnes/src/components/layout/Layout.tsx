import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartSidebar } from '@/components/cart/CartSidebar';

interface LayoutProps {
  children: React.ReactNode;
  noFooter?: boolean;
}

export function Layout({ children, noFooter = false }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!noFooter && <Footer />}
      <CartSidebar />
    </div>
  );
}
