import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('sn_sid');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('sn_sid', sid);
    }
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Invisible analytics beacon. Fires a lightweight POST on every route change.
 * Does NOT track admin pages. No effect on any visible UI.
 */
export function Analytics() {
  const [location] = useLocation();
  const referrerRef = useRef<string>(
    typeof document !== 'undefined' ? document.referrer : '',
  );

  useEffect(() => {
    // Skip admin pages — don't pollute analytics with admin traffic
    if (location.startsWith('/admin')) return;

    const sessionId = getOrCreateSessionId();

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        path: location,
        referrer: referrerRef.current,
      }),
      // Don't wait for a response — fire and forget
      keepalive: true,
    }).catch(() => {});
  }, [location]);

  return null;
}
