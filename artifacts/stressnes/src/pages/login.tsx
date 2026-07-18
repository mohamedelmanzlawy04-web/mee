import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/admin');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
        <div className="text-background text-center">
          <p className="font-serif text-4xl tracking-[0.1em] mb-4">STRESSNES</p>
          <p className="font-sans text-sm text-background/60 leading-relaxed max-w-xs">
            Luxury fashion ecommerce. Curated pieces for the discerning wardrobe.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="font-serif text-lg tracking-[0.15em] lg:hidden block mb-8">
              STRESSNES
            </Link>
            <h1 className="font-serif text-3xl mb-2">Welcome back</h1>
            <p className="font-sans text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="font-sans text-xs tracking-widest uppercase block mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-border rounded-sm px-4 py-3 font-sans text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="font-sans text-xs tracking-widest uppercase block mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-border rounded-sm px-4 py-3 font-sans text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
