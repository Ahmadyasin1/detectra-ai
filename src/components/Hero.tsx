import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Play, ShieldCheck, CheckCircle2, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { openAuthModal } from '../lib/openAuth';
import { getDemoClips } from '../constants/demoVideos';
import { HeroBackground, HeroButtonPrimary, HeroButtonSecondary } from './PageHero';

const DEMO_CLIPS = getDemoClips();
const HERO_VIDEOS = DEMO_CLIPS.map((c) => c.src);
const SCENARIO_LABELS = DEMO_CLIPS.map((c) => `${c.title} â€” ${c.scenario.toLowerCase()}`);


const TRUST_CHIPS = [
  { icon: ShieldCheck, label: 'Evidence-backed' },
  { icon: CheckCircle2, label: 'Scored events' },
  { icon: Lock, label: 'Private uploads' },
];

export default function Hero() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [activeVideo, setActiveVideo] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [failedVideos, setFailedVideos] = useState<number[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getNextVideoIndex = (current: number, skipped: number[]) => {
    const seen = new Set<number>();
    let next = (current + 1) % HERO_VIDEOS.length;
    while (skipped.includes(next) && !seen.has(next)) {
      seen.add(next);
      next = (next + 1) % HERO_VIDEOS.length;
    }
    return next;
  };

  const advanceVideo = useCallback(
    (skipped?: number[]) => {
      setActiveVideo((current) => getNextVideoIndex(current, skipped ?? failedVideos));
    },
    [failedVideos],
  );

  const goToVideo = (index: number) => {
    if (failedVideos.includes(index)) return;
    setActiveVideo(index);
  };

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => advanceVideo(), 14000);
    return () => window.clearInterval(interval);
  }, [advanceVideo, reduceMotion]);

  useEffect(() => {
    setVideoReady(false);
    if (!videoRef.current) return;
    const video = videoRef.current;
    video.load();
    video.play()?.catch(() => {});
  }, [activeVideo]);

  const scenarioLabel =
    SCENARIO_LABELS[activeVideo % SCENARIO_LABELS.length] ?? SCENARIO_LABELS[0];

  return (
    <section
      className="relative w-full overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pb-20"
      aria-labelledby="hero-heading"
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <motion.h1
          id="hero-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl text-center text-[clamp(1.75rem,5.5vw,3.5rem)] font-extrabold leading-[1.12] tracking-tight text-white"
        >
          Surveillance video,{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            turned into clear evidence
          </span>
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06 }}
          className="mt-4 max-w-xl text-center text-sm sm:text-base md:text-lg text-gray-400 leading-relaxed px-1"
        >
          Upload CCTV or body-cam footage. Get objects, speech, events, and reports your team can
          review and share.
        </motion.p>

        <motion.ul
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-5 flex flex-wrap justify-center gap-2 max-w-lg"
          aria-label="Trust highlights"
        >
          {TRUST_CHIPS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300"
            >
              <Icon className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden />
              {label}
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14 }}
          className="mt-7 flex w-full max-w-sm sm:max-w-none flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
        >
          {user ? (
            <HeroButtonPrimary to="/analyze" className="w-full sm:w-auto min-h-[48px]">
              Analyze video <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </HeroButtonPrimary>
          ) : (
            <HeroButtonPrimary
              onClick={() => openAuthModal('signup')}
              className="w-full sm:w-auto min-h-[48px]"
            >
              Get started <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </HeroButtonPrimary>
          )}
          <HeroButtonSecondary to="/demo" className="w-full sm:w-auto min-h-[48px]">
            <Play className="h-4 w-4 shrink-0 fill-white" aria-hidden />
            Watch demo
          </HeroButtonSecondary>
        </motion.div>

        <motion.a
          href="#how-it-works"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-xs sm:text-sm text-gray-500 hover:text-cyan-400 transition-colors underline-offset-4 hover:underline min-h-[44px] inline-flex items-center"
        >
          See how it works
        </motion.a>

        {/* Demo preview */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="mt-10 w-full max-w-4xl lg:max-w-5xl"
        >
          <motion.div className="rounded-2xl sm:rounded-3xl border border-cyan-500/25 bg-white/5 backdrop-blur-md shadow-2xl shadow-cyan-500/10 overflow-hidden">
            <div
              className="flex items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4"
              role="presentation"
            >
              <span className="h-2 w-2 rounded-full bg-red-500/80" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
              <p className="flex-1 text-center text-[10px] sm:text-xs font-medium text-gray-500 truncate px-2">
                Sample analysis preview
              </p>
            </div>

            <div className="relative aspect-video w-full bg-black/60">
              <video
                ref={videoRef}
                key={activeVideo}
                src={HERO_VIDEOS[activeVideo]}
                autoPlay
                muted
                playsInline
                loop
                preload="metadata"
                crossOrigin="anonymous"
                aria-label={`Demo: ${scenarioLabel}`}
                onCanPlay={() => setVideoReady(true)}
                onLoadedData={() => setVideoReady(true)}
                onError={() => {
                  setFailedVideos((current) => {
                    const updated = current.includes(activeVideo)
                      ? current
                      : [...current, activeVideo];
                    setActiveVideo(getNextVideoIndex(activeVideo, updated));
                    return updated;
                  });
                }}
                className="h-full w-full object-contain"
              />

              {!videoReady && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-zinc-950"
                  role="status"
                  aria-live="polite"
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  <span className="sr-only">Loading preview</span>
                </motion.div>
              )}

              {HERO_VIDEOS.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveVideo((activeVideo - 1 + HERO_VIDEOS.length) % HERO_VIDEOS.length)
                    }
                    className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-sm hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 touch-target"
                    aria-label="Previous demo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceVideo()}
                    className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-sm hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 touch-target"
                    aria-label="Next demo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </motion.div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-400 text-center sm:text-left">
              <span className="font-medium text-gray-300">{scenarioLabel}</span>
              <span className="hidden sm:inline"> Â· </span>
              <span className="block sm:inline mt-0.5 sm:mt-0 text-xs sm:text-sm">
                Pre-labeled samples â€” upload your own in the analyzer.
              </span>
            </p>

            {HERO_VIDEOS.length > 1 && (
              <motion.div
                className="flex justify-center gap-2"
                role="tablist"
                aria-label="Demo clips"
              >
                {HERO_VIDEOS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === activeVideo}
                    aria-label={`Clip ${i + 1}`}
                    disabled={failedVideos.includes(i)}
                    onClick={() => goToVideo(i)}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all ${
                      i === activeVideo ? '' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span
                      className={`block rounded-full transition-all ${
                        i === activeVideo ? 'h-2 w-6 bg-cyan-400' : 'h-2 w-2 bg-white/30'
                      }`}
                    />
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
