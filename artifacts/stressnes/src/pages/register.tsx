import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/account');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ fullName, email, password });
      navigate('/');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Could not create account. Try again.');
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
            Join the STRESSNES community. Get early access to new arrivals, exclusive offers, and curated edits.
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
            <h1 className="font-serif text-3xl mb-2">Create account</h1>
            <p className="font-sans text-sm text-muted-foreground">Join the STRESSNES community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="font-sans text-xs tracking-widest uppercase block mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full border border-border rounded-sm px-4 py-3 font-sans text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Your name"
              />
            </div>
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
                autoComplete="new-password"
                minLength={8}
                className="w-full border border-border rounded-sm px-4 py-3 font-sans text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Min. 8 characters"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="font-sans text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
          </p>

          <p className="font-sans text-sm text-center text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
              Sign in
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link href="/" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
