import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * Full-screen video intro — loops indefinitely.
 * Tap / click anywhere to enter the site.
 *
 * Audio strategy:
 *  1. Try to play unmuted. Most browsers block this without prior interaction.
 *  2. If blocked → fall back to muted autoplay + show a "Tap for sound" prompt.
 *  3. On tap: unmute and hide the prompt.
 *  4. Small corner button lets the user toggle mute at any time.
 */
export function IntroVideo() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [browserForcedMute, setBrowserForcedMute] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);

  // ── Try to unmute once the video is playing ──────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryUnmute = () => {
      video.muted = false;
      Promise.resolve().then(() => {
        if (video.muted) {
          setMuted(true);
          setBrowserForcedMute(true);
        } else {
          setMuted(false);
          setBrowserForcedMute(false);
        }
      });
    };

    if (!video.paused) {
      tryUnmute();
    } else {
      video.addEventListener('play', tryUnmute, { once: true });
    }

    return () => video.removeEventListener('play', tryUnmute);
  }, []);

  // ── Dismiss (fade out → remove) ──────────────────────────────────────────
  const dismiss = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFading(true);
    setTimeout(() => setVisible(false), 700);
  }, []);

  // ── Tap for sound ────────────────────────────────────────────────────────
  const enableSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setBrowserForcedMute(false);
  }, []);

  // ── Corner mute toggle ───────────────────────────────────────────────────
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    setBrowserForcedMute(false);
  }, [muted]);

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      className={[
        'fixed inset-0 z-[9999] bg-black cursor-pointer',
        'transition-opacity duration-700 ease-in-out',
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ].join(' ')}
      aria-label="Click to enter the site"
    >
      {/* ── Buffering spinner ──────────────────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 pointer-events-none">
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
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={() => { setReady(true); setLoading(false); }}
        onLoadedData={() => { setReady(true); setLoading(false); }}
        onPlay={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        <source src="/images/hero-video-1080p-mobile.mp4" type="video/mp4" />
        <source src="/images/hero-video-1080p.mp4" type="video/mp4" />
        <source src="/images/hero-video.mp4" type="video/mp4" />
      </video>

      {/* ── "Tap for sound" overlay ───────────────────────────────────── */}
      {browserForcedMute && ready && (
        <button
          onClick={enableSound}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 cursor-pointer group"
          aria-label="Tap to enable sound"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-20 h-20 rounded-full bg-white/10 animate-ping" />
            <span className="relative w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Volume2 className="size-7 text-white" />
            </span>
          </div>
          <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-white/70 group-hover:text-white transition-colors">
            Tap for sound
          </p>
        </button>
      )}

      {/* ── Bottom controls ───────────────────────────────────────────── */}
      {ready && (
        <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:pb-12 flex items-end justify-between z-30">
          {/* "Tap to enter" hint */}
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-white/40 select-none pointer-events-none">
            Tap anywhere to enter
          </p>

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
      )}
    </div>
  );
}
