import { Link } from 'wouter';
import { Instagram, Twitter } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { useState } from 'react';
import { useSubscribeNewsletter } from '@workspace/api-client-react';
import { toast } from 'sonner';

export function Footer() {
  const [email, setEmail] = useState('');
  const subscribeMutation = useSubscribeNewsletter();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await subscribeMutation.mutateAsync({ email });
      toast.success('You\'re on the list');
      setEmail('');
    } catch {
      toast.error('Could not subscribe. Try again.');
    }
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="container-site py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <p className="font-serif text-lg tracking-[0.15em] mb-3">STRESSNES</p>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href={siteConfig.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="size-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-4">Shop</p>
            <ul className="space-y-2.5">
              {[
                { label: 'All Products', href: '/products' },
                { label: 'New Arrivals', href: '/products?sort=newest' },
                { label: 'Collections', href: '/collections' },
                { label: 'Categories', href: '/categories' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-4">Help</p>
            <ul className="space-y-2.5">
              {[
                { label: 'Sizing Guide', href: '/sizing' },
                { label: 'Shipping & Returns', href: '/shipping' },
                { label: 'Care Instructions', href: '/care' },
                { label: 'Contact Us', href: '/contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-4">Stay Connected</p>
            <p className="font-sans text-sm text-muted-foreground mb-4 leading-relaxed">
              New arrivals and curated edits, delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 min-w-0 bg-transparent border border-border rounded-sm px-3 py-2 font-sans text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <button
                type="submit"
                disabled={subscribeMutation.isPending}
                className="px-4 py-2 bg-foreground text-background font-sans text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
              >
                {subscribeMutation.isPending ? '…' : 'Join'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
          <p className="font-sans text-xs text-muted-foreground">
            © {new Date().getFullYear()} STRESSNES. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
