import { useEffect, useRef, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import {
  Users,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Activity,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface LiveVisitor {
  sessionId: string;
  path: string;
  device: 'MOBILE' | 'DESKTOP' | 'TABLET';
  source: string;
  country: string | null;
  city: string | null;
  lastSeen: number;
}

interface LiveData {
  count: number;
  visitors: LiveVisitor[];
}

interface StatsData {
  today: number;
  yesterday: number;
  week: number;
  month: number;
  total: number;
  topPages: Array<{ path: string; views: number }>;
  sources: Array<{ source: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  countries: Array<{ country: string | null; count: number }>;
}

// ── Helpers ──────────────────────────────────────────────────────
const SOURCE_LABELS: Record<string, string> = {
  DIRECT: 'Direct',
  GOOGLE: 'Google',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
  YOUTUBE: 'YouTube',
  TWITTER: 'Twitter / X',
  OTHER: 'Other',
};

const SOURCE_COLORS: Record<string, string> = {
  DIRECT: 'bg-zinc-400',
  GOOGLE: 'bg-blue-500',
  INSTAGRAM: 'bg-pink-500',
  TIKTOK: 'bg-black',
  FACEBOOK: 'bg-blue-600',
  YOUTUBE: 'bg-red-500',
  TWITTER: 'bg-sky-400',
  OTHER: 'bg-zinc-500',
};

function DeviceIcon({ device }: { device: string }) {
  if (device === 'MOBILE') return <Smartphone className="size-3.5" />;
  if (device === 'TABLET') return <Tablet className="size-3.5" />;
  return <Monitor className="size-3.5" />;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-EG').format(n);
}

// ── Component ────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [live, setLive] = useState<LiveData>({ count: 0, visitors: [] });
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // ── Fetch stats ────────────────────────────────────────────────
  async function fetchStats() {
    try {
      const res = await fetch('/api/analytics/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── SSE live stream ────────────────────────────────────────────
  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/analytics/live');
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const data: LiveData = JSON.parse(e.data);
          setLive(data);
        } catch {
          // ignore malformed frames
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 5 s
        setTimeout(connect, 5_000);
      };
    }

    connect();
    return () => {
      esRef.current?.close();
    };
  }, []);

  // ── Derived numbers ────────────────────────────────────────────
  const totalDeviceCount = stats?.devices.reduce((s, d) => s + Number(d.count), 0) ?? 1;
  const totalSourceCount = stats?.sources.reduce((s, d) => s + Number(d.count), 0) ?? 1;

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="max-w-6xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl mb-1">Analytics</h1>
            <p className="font-sans text-sm text-muted-foreground">
              Live visitor data and traffic insights
            </p>
          </div>

          {/* Live Visitors Hero */}
          <div className="bg-card border border-border rounded-sm p-6 flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="size-16 rounded-full bg-foreground/5 flex items-center justify-center">
                <Activity className="size-7 text-foreground" />
              </div>
              {/* Pulse dot */}
              <span
                className={[
                  'absolute top-0 right-0 size-3 rounded-full border-2 border-card',
                  connected ? 'bg-emerald-500' : 'bg-zinc-400',
                ].join(' ')}
              />
            </div>
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-1">
                Live Visitors
              </p>
              <p className="font-serif text-5xl leading-none">{live.count}</p>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                {connected ? 'Updating in real time' : 'Reconnecting…'}
              </p>
            </div>
          </div>

          {/* Period Stats */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-sm p-5 animate-pulse h-24"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Today's Visitors", value: stats?.today ?? 0 },
                { label: "Yesterday", value: stats?.yesterday ?? 0 },
                { label: 'This Week', value: stats?.week ?? 0 },
                { label: 'This Month', value: stats?.month ?? 0 },
                { label: 'All Time', value: stats?.total ?? 0 },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-card border border-border rounded-sm p-5"
                >
                  <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-3">
                    {label}
                  </p>
                  <p className="font-serif text-2xl">{fmt(value)}</p>
                  <p className="font-sans text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="size-3" /> unique visitors
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Live Visitor Table */}
          <div className="bg-card border border-border rounded-sm">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-sans text-sm tracking-widest uppercase">
                Active Right Now
              </h2>
              <span className="font-sans text-xs text-muted-foreground">
                {live.visitors.length} session{live.visitors.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Page', 'Device', 'Source', 'Location'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left font-sans text-xs tracking-widest uppercase text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {live.visitors.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-muted-foreground font-sans text-sm"
                      >
                        No active visitors right now
                      </td>
                    </tr>
                  )}
                  {live.visitors.map((v) => (
                    <tr
                      key={v.sessionId}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-6 py-3 font-sans text-xs font-medium max-w-[220px] truncate">
                        {v.path || '/'}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
                          <DeviceIcon device={v.device} />
                          {v.device.charAt(0) + v.device.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-sans text-xs text-muted-foreground">
                        {SOURCE_LABELS[v.source] ?? v.source}
                      </td>
                      <td className="px-6 py-3 font-sans text-xs text-muted-foreground">
                        {v.city && v.country
                          ? `${v.city}, ${v.country}`
                          : (v.country ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom grid: Top Pages + Sources + Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <div className="bg-card border border-border rounded-sm lg:col-span-1">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-sans text-sm tracking-widest uppercase">
                  Top Pages
                </h2>
                <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                  Last 7 days
                </p>
              </div>
              <div className="divide-y divide-border/50">
                {!stats || stats.topPages.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-muted-foreground font-sans">
                    No data yet
                  </p>
                ) : (
                  stats.topPages.map((p) => {
                    const maxViews = stats.topPages[0]?.views ?? 1;
                    const pct = Math.round((Number(p.views) / Number(maxViews)) * 100);
                    return (
                      <div key={p.path} className="px-6 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-sans text-xs truncate max-w-[150px]">
                            {p.path || '/'}
                          </span>
                          <span className="font-sans text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {fmt(Number(p.views))}
                          </span>
                        </div>
                        <div className="h-0.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-foreground/30 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-card border border-border rounded-sm">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-sans text-sm tracking-widest uppercase">
                  Traffic Sources
                </h2>
                <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                  This month
                </p>
              </div>
              <div className="divide-y divide-border/50">
                {!stats || stats.sources.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-muted-foreground font-sans">
                    No data yet
                  </p>
                ) : (
                  stats.sources.map((s) => {
                    const pct =
                      totalSourceCount > 0
                        ? Math.round((Number(s.count) / totalSourceCount) * 100)
                        : 0;
                    return (
                      <div
                        key={s.source}
                        className="px-6 py-3 flex items-center gap-3"
                      >
                        <span
                          className={[
                            'size-2 rounded-full flex-shrink-0',
                            SOURCE_COLORS[s.source] ?? 'bg-zinc-400',
                          ].join(' ')}
                        />
                        <span className="font-sans text-xs flex-1">
                          {SOURCE_LABELS[s.source] ?? s.source}
                        </span>
                        <span className="font-sans text-xs text-muted-foreground">
                          {pct}%
                        </span>
                        <span className="font-sans text-xs text-muted-foreground w-12 text-right">
                          {fmt(Number(s.count))}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Devices + Countries */}
            <div className="flex flex-col gap-6">
              {/* Devices */}
              <div className="bg-card border border-border rounded-sm flex-1">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-sans text-sm tracking-widest uppercase">
                    Devices
                  </h2>
                  <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                    This month
                  </p>
                </div>
                <div className="divide-y divide-border/50">
                  {!stats || stats.devices.length === 0 ? (
                    <p className="px-6 py-6 text-sm text-muted-foreground font-sans">
                      No data yet
                    </p>
                  ) : (
                    stats.devices.map((d) => {
                      const pct =
                        totalDeviceCount > 0
                          ? Math.round((Number(d.count) / totalDeviceCount) * 100)
                          : 0;
                      return (
                        <div
                          key={d.device}
                          className="px-6 py-3 flex items-center gap-3"
                        >
                          <span className="text-muted-foreground">
                            <DeviceIcon device={d.device} />
                          </span>
                          <span className="font-sans text-xs flex-1">
                            {d.device.charAt(0) +
                              d.device.slice(1).toLowerCase()}
                          </span>
                          <span className="font-sans text-xs text-muted-foreground">
                            {pct}%
                          </span>
                          <span className="font-sans text-xs text-muted-foreground w-10 text-right">
                            {fmt(Number(d.count))}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top Countries */}
              <div className="bg-card border border-border rounded-sm flex-1">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-sans text-sm tracking-widest uppercase flex items-center gap-2">
                    <Globe className="size-3.5" />
                    Countries
                  </h2>
                  <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                    This month
                  </p>
                </div>
                <div className="divide-y divide-border/50">
                  {!stats || stats.countries.length === 0 ? (
                    <p className="px-6 py-6 text-sm text-muted-foreground font-sans">
                      No geo data yet
                    </p>
                  ) : (
                    stats.countries.slice(0, 6).map((c) => (
                      <div
                        key={c.country}
                        className="px-6 py-3 flex items-center gap-3"
                      >
                        <span className="font-sans text-xs flex-1 truncate">
                          {c.country ?? 'Unknown'}
                        </span>
                        <span className="font-sans text-xs text-muted-foreground">
                          {fmt(Number(c.count))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
