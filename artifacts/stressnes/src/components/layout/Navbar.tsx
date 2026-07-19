import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/BrandMark';

const navLinks = [
  { label: 'Shop', href: '/products' },
  { label: 'Collections', href: '/collections' },
  { label: 'Categories', href: '/categories' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const { itemCount, openCart } = useCart();

  const isHome = location === '/';
  const transparent = isHome && !scrolled;

  // When the wordmark is over a dark surface (transparent hero OR dark theme navbar)
  // we need to invert the dark PNG pixels to white.
  const wordmarkInvert = transparent || resolvedTheme === 'dark';

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-out',
        transparent
          ? 'bg-transparent border-transparent'
          : 'bg-background/95 backdrop-blur-md border-b border-border',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="container-site">
        <nav className="flex items-center justify-between h-16">

          {/* ── Logo: mark + wordmark ────────────────────────────────────── */}
          <Link
            href="/"
            aria-label="STRESSNES — Home"
            className="flex items-center gap-[6px] md:gap-[11px]"
          >
            {/* Compass-star mark — scales with wordmark */}
            <BrandMark
              size={28}
              className="shrink-0 w-[18px] h-[18px] md:w-[28px] md:h-[28px] transition-colors duration-500"
              style={{ color: wordmarkInvert ? '#ffffff' : '#0a0a0a' } as React.CSSProperties}
              aria-hidden
            />

            {/*
             * Wordmark — reduced on mobile to prevent overlap with action icons.
             * Desktop: 46px height (~300px wide). Mobile: 24px height (~150px wide).
             * Source is 581×93 px tight crop.
             */}
            <img
              src="/images/stressnes-wordmark.png"
              alt="STRESSNES"
              width={300}
              height={48}
              className="block h-[24px] w-auto md:h-[46px] transition-[filter] duration-500"
              style={{
                filter: wordmarkInvert ? 'brightness(0) invert(1)' : 'brightness(0)',
                imageRendering: 'auto',
              }}
              draggable={false}
            />
          </Link>

          {/* ── Desktop nav ──────────────────────────────────────────────── */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'font-sans text-sm tracking-widest uppercase transition-colors duration-500',
                    transparent
                      ? 'text-white/70 hover:text-white'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => navigate('/search')}
              className={cn(
                'transition-colors duration-500',
                transparent && 'text-white hover:text-white hover:bg-white/10',
              )}
            >
              <Search className="size-4" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'transition-colors duration-500',
                transparent && 'text-white hover:text-white hover:bg-white/10',
              )}
            >
              {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cart (${itemCount} items)`}
              className={cn(
                'relative transition-colors duration-500',
                transparent && 'text-white hover:text-white hover:bg-white/10',
              )}
              onClick={openCart}
            >
              <ShoppingBag className="size-4" />
              {itemCount > 0 && (
                <span
                  className={cn(
                    'absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium transition-colors duration-500',
                    transparent
                      ? 'bg-white text-black'
                      : 'bg-foreground text-background',
                  )}
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'md:hidden transition-colors duration-500',
                transparent && 'text-white hover:text-white hover:bg-white/10',
              )}
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </nav>

        {/* ── Mobile menu ───────────────────────────────────────────────── */}
        {mobileOpen && (
          <div
            className={cn(
              'md:hidden border-t py-6',
              transparent ? 'border-white/20' : 'border-border',
            )}
          >
            {/* Brand mark in mobile drawer header */}
            <div className="flex items-center gap-2.5 px-2 mb-5">
              <BrandMark
                size={18}
                className={transparent ? 'text-white/60' : 'text-muted-foreground'}
                aria-hidden
              />
              <span
                className={cn(
                  'font-sans text-[9px] tracking-[0.45em] uppercase',
                  transparent ? 'text-white/40' : 'text-muted-foreground/60',
                )}
              >
                Menu
              </span>
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-2 py-3 font-sans text-sm tracking-widest uppercase transition-colors',
                    transparent
                      ? 'text-white/70 hover:text-white'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
