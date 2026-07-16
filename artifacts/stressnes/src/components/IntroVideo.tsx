import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

const SESSION_PLAYED_KEY = 'stressnes-intro-played';
const SESSION_MUTE_KEY = 'stressnes-intro-muted';

/**
 * Full-screen video intro that plays once per browsing session.
 * Audio is ON by default; the browser may override this with its autoplay policy,
 * in which case we fall back gracefully to muted and let the user unmute manually.
 */
export function IntroVideo() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(false);   // desired state (audio ON by default)
  const [ready, setReady] = useState(false);    // video has buffered enough to play
  const [loading, setLoading] = useState(true); // still buffering
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);

  // ── Mount: check session ─────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_PLAYED_KEY)) return; // already played
    const savedMuted = sessionStorage.getItem(SESSION_MUTE_KEY) === 'true';
    setMuted(savedMuted);
    setVisible(true);
  }, []);

  // ── Start playback when the component becomes visible ────────────────────
  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;

    // Try unmuted first (audio ON as requested)
    video.muted = false;
    video
      .play()
      .then(() => {
        // Browser allowed audio — great
        setMuted(false);
      })
      .catch(() => {
        // Autoplay with audio blocked — fall back to muted
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {
          // Even muted playback failed (very rare). Show Skip so user can proceed.
        });
      });
  }, [visible]);

  // ── Dismiss: fade out → mark session → unmount ───────────────────────────
  const dismiss = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    sessionStorage.setItem(SESSION_PLAYED_KEY, '1');
    setFading(true);
    setTimeout(() => setVisible(false), 800);
  }, []);

  // ── Mute / unmute toggle ─────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    sessionStorage.setItem(SESSION_MUTE_KEY, String(next));
  }, [muted]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={[
        'fixed inset-0 z-[9999] bg-black',
        'transition-opacity duration-700 ease-in-out',
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ].join(' ')}
    >
      {/* ── Buffering spinner ─────────────────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          {/* Thin rotating ring */}
          <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
          <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-white/40">
            Loading
          </p>
        </div>
      )}

      {/* ── Video ─────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/images/hero-video.mp4"
        preload="auto"
        playsInline
        onCanPlay={() => {
          setReady(true);
          setLoading(false);
        }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onEnded={dismiss}
        style={{
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:pb-12 flex items-end justify-between z-20">
        {/* Skip intro */}
        <button
          onClick={dismiss}
          className={[
            'flex items-center gap-2',
            'bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30',
            'text-white font-sans text-xs tracking-[0.25em] uppercase',
            'px-5 py-3 rounded-sm border border-white/20',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          ].join(' ')}
          aria-label="Skip intro"
        >
          Skip Intro
          <SkipForward className="size-3.5 shrink-0" />
        </button>

        {/* Mute / unmute */}
        <button
          onClick={toggleMute}
          className={[
            'w-11 h-11 flex items-center justify-center',
            'bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30',
            'text-white rounded-full border border-white/20',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          ].join(' ')}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      {ready && <VideoProgress videoRef={videoRef} onEnd={dismiss} />}
    </div>
  );
}

// ── Thin progress bar at the bottom of the screen ───────────────────────────
function VideoProgress({
  videoRef,
  onEnd,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onEnd: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tick = () => {
      if (video.duration) {
        setProgress(video.currentTime / video.duration);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef]);

  return (
    <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/10 z-30">
      <div
        className="h-full bg-white/60 transition-none"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
