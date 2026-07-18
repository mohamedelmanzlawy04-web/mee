import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/auth';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'ADMIN') {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return <>{children}</>;
}
