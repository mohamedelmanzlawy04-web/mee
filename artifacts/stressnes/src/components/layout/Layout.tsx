import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  noFooter?: boolean;
  /** When true, removes the top padding that compensates for the fixed navbar.
   *  Use on pages whose first section deliberately sits under the transparent navbar (e.g. homepage hero). */
  heroMode?: boolean;
}

export function Layout({ children, noFooter = false, heroMode = false }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className={cn('flex-1', !heroMode && 'pt-16')}>{children}</main>
      {!noFooter && <Footer />}
      <CartSidebar />
    </div>
  );
}
