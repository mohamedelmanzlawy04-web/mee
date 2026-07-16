import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { User, Package, Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useUpdateCustomer } from '@workspace/api-client-react';
import { toast } from 'sonner';

export default function AccountPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const updateCustomer = useUpdateCustomer();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync form fields once the user data arrives from the server
  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  if (!isLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateCustomer.mutateAsync({ id: user.id, data: { fullName, phone } });
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container-site py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl mb-8">My Account</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar nav — all hrefs are consistent with the router */}
            <nav className="space-y-1">
              {[
                { icon: User, label: 'Profile', href: '/account' },
                { icon: Package, label: 'Orders', href: '/account/orders' },
                { icon: Heart, label: 'Wishlist', href: '/wishlist' },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-4 py-3 rounded-sm font-sans text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-sm font-sans text-sm text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors w-full text-left"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </nav>

            {/* Profile form */}
            <div className="md:col-span-2">
              <div className="bg-card border border-border rounded-sm p-6">
                <h2 className="font-sans text-sm tracking-widest uppercase mb-6">Personal Information</h2>

                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="font-sans text-xs tracking-widest uppercase block mb-2">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border border-border rounded-sm px-4 py-3 font-sans text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-xs tracking-widest uppercase block mb-2">Email</label>
                      <input
                        type="email"
                        value={user?.email ?? ''}
                        disabled
                        className="w-full border border-border rounded-sm px-4 py-3 font-sans text-sm bg-muted/50 text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-xs tracking-widest uppercase block mb-2">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 100 000 0000"
                        className="w-full border border-border rounded-sm px-4 py-3 font-sans text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
