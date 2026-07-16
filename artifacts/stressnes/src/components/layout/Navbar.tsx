import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, User, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth';
import { useCart } from '@/context/cart';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { label: 'Shop', href: '/products' },
  { label: 'Collections', href: '/collections' },
  { label: 'Categories', href: '/categories' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-site">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-serif text-xl tracking-[0.15em] font-normal text-foreground">
            STRESSNES
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-sans text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => navigate('/search')}
            >
              <Search className="size-4" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {/* Account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account">
                    <User className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account')}>My Account</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account/orders')}>Orders</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wishlist')}>Wishlist</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign in"
                onClick={() => navigate('/login')}
              >
                <User className="size-4" />
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cart (${itemCount} items)`}
              className="relative"
              onClick={openCart}
            >
              <ShoppingBag className="size-4" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-medium">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-1 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-3 font-sans text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
