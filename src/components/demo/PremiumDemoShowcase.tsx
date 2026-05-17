import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Film,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getDemoClips, type DemoClip } from '../../constants/demoVideos';

const OUTPUTS = [
  { icon: Film, label: 'Labeled MP4', desc: 'Overlays on every frame' },
  { icon: FileText, label: 'HTML report', desc: 'Briefing-ready export' },
  { icon: Sparkles, label: 'JSON + RAG', desc: 'Structured evidence' },
];

type PremiumDemoShowcaseProps = {
  clips?: DemoClip[];
};

export default function PremiumDemoShowcase({ clips = getDemoClips() }: PremiumDemoShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState<number[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = clips[active] ?? clips[0];

  const goTo = useCallback(
    (index: number) => {
      if (failed.includes(index)) return;
      setActive(index);
      setReady(false);
    },
    [failed],
  );

  const next = useCallback(() => {
    let i = (active + 1) % clips.length;
    let guard = 0;
    while (failed.includes(i) && guard < clips.length) {
      i = (i + 1) % clips.length;
      guard += 1;
    }
    goTo(i);
  }, [active, clips.length, failed, goTo]);

  const prev = useCallback(() => {
    let i = (active - 1 + clips.length) % clips.length;
    let guard = 0;
    while (failed.includes(i) && guard < clips.length) {
      i = (i - 1 + clips.length) % clips.length;
      guard += 1;
    }
    goTo(i);
  }, [active, clips.length, failed, goTo]);

  useEffect(() => {
    if (reduceMotion || clips.length <= 1) return;
    const t = window.setInterval(next, 16000);
    return () => window.clearInterval(t);
  }, [next, reduceMotion, clips.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [active, current?.src]);

  return (
    <section className="relative" aria-labelledby="demo-showcase-heading">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-48px' }}
        transition={{ duration: 0.5 }}
        className="page-shell"
      >
        <header className="mb-8 sm:mb-10 text-center max-w-3xl mx-auto">
          <p className="elite-label mb-3">Product preview</p>
          <h2
            id="demo-showcase-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight"
          >
            Real labeled outputs from{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Detectra AI
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400 leading-relaxed">
            These are pre-analyzed samples — the same pipeline your team runs in the analyzer.
            Sign in to process your own footage with private storage and full exports.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_min(320px,36%)] lg:gap-8 items-start">
          {/* Main theater */}
          <div className="elite-card overflow-hidden border-cyan-500/15 p-0">
            <motion.div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-black/30">
              <motion.div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500/90" />
                <span className="h-2 w-2 rounded-full bg-amber-400/90" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/90" />
                <span className="ml-2 text-[11px] font-medium text-gray-500 hidden sm:inline">
                  Sample output · read-only preview
                </span>
              </motion.div>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </motion.div>

            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                key={current.src}
                src={current.src}
                className="h-full w-full object-contain"
                autoPlay
                muted={muted}
                playsInline
                loop
                preload="metadata"
                crossOrigin="anonymous"
                onCanPlay={() => setReady(true)}
                onLoadedData={() => setReady(true)}
                onError={() => {
                  setFailed((f) => (f.includes(active) ? f : [...f, active]));
                  next();
                }}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                  <motion.div className="h-10 w-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                </div>
              )}

              {clips.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md hover:bg-black/90"
                    aria-label="Previous clip"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md hover:bg-black/90"
                    aria-label="Next clip"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <motion.div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
                <div className="flex items-center gap-2 min-w-0">
                  <Play className="h-3.5 w-3.5 text-cyan-400 shrink-0 fill-cyan-400" aria-hidden />
                  <span className="truncate text-xs font-medium text-white">{current.title}</span>
                </div>
                <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  Labeled
                </span>
              </motion.div>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none border-t border-white/10 bg-black/20">
              {clips.map((clip, i) => (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={failed.includes(i)}
                  className={`relative shrink-0 w-28 sm:w-32 rounded-lg overflow-hidden border-2 transition-all ${
                    i === active
                      ? 'border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Play ${clip.title}`}
                  aria-current={i === active}
                >
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                    <Film className="h-5 w-5 text-cyan-500/50" />
                  </div>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 py-1 text-[10px] font-medium text-white truncate">
                    {clip.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-4">
            <motion.div className="elite-card p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90 mb-2">
                {current.scenario}
              </p>
              <h3 className="text-xl font-bold text-white mb-2">{current.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{current.description}</p>
              <ul className="mt-4 space-y-2">
                {current.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div className="elite-card p-5 sm:p-6">
              <p className="elite-label mb-3">Every job includes</p>
              <ul className="space-y-3">
                {OUTPUTS.map(({ icon: Icon, label, desc }) => (
                  <li key={label} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-cyan-500/10">
                      <Icon className="h-4 w-4 text-cyan-400" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{label}</span>
                      <span className="block text-xs text-gray-500">{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
