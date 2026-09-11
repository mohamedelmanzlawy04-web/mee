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
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip admin pages — don't pollute analytics with admin traffic
    if (location.startsWith('/admin')) return;

    const sessionId = getOrCreateSessionId();

    // Meta Pixel base code in index.html only fires PageView once, on the
    // initial hard load — it has no idea when wouter changes routes inside
    // this SPA. Without this, every client-side navigation after the first
    // was invisible to Meta, undercounting reach/frequency and starving any
    // PageView/ViewContent-based audience. Skip the very first mount since
    // index.html's own inline fbq('track','PageView') already covered it.
    const eventId = crypto.randomUUID();
    if (!isFirstMount.current) {
      (window as any).fbq?.('track', 'PageView', {}, { eventID: eventId });
    }
    isFirstMount.current = false;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        path: location,
        referrer: referrerRef.current,
        metaEventId: eventId,
      }),
      // Don't wait for a response — fire and forget
      keepalive: true,
    }).catch(() => {});
  }, [location]);

  return null;
}
