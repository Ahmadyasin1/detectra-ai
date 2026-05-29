import { motion, useReducedMotion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import {
  ArrowRight, Brain, ShieldCheck, CheckCircle2, Eye, Mic, FileText,
  Upload, PlayCircle, BookOpen, Zap, Clock, Users,
  Star, Building2, Shield, AlertTriangle, Search, BarChart3, Download,
  Globe, Cpu, ChevronRight,
} from 'lucide-react';
import Hero from '../components/Hero';
import { HeroButtonPrimary, HeroButtonSecondary } from '../components/PageHero';
import { useAuth } from '../contexts/AuthContext';
import { openAuthModal } from '../lib/openAuth';

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const duration = 1800;
    const raf = (cb: FrameRequestCallback) => requestAnimationFrame(cb);
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * ease));
      if (progress < 1) raf(tick);
    };
    raf(tick);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0, reduceMotion: boolean | null = false) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-40px' },
        transition: { duration: 0.5, delay, ease: 'easeOut' as const },
      };

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-400 mb-4">
      {children}
    </span>
  );
}

function SectionHeader({
  label, title, description, titleId, className = '',
}: { label: string; title: string; description?: string; titleId?: string; className?: string }) {
  return (
    <header className={`text-center max-w-2xl mx-auto ${className}`}>
      <SectionLabel>{label}</SectionLabel>
      <h2 id={titleId} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-snug">
        {title}
      </h2>
      {description && <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>}
    </header>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 98,  suffix: '%',  label: 'Detection accuracy',  icon: Target2 },
  { value: 15,  suffix: '+',  label: 'AI modules in pipeline', icon: Cpu },
  { value: 10,  suffix: 'x',  label: 'Faster than manual review', icon: Clock },
  { value: 365, suffix: ' days', label: 'Dataset coverage', icon: Globe },
];

// Simple icon component (Target2 not in lucide, use Shield)
function Target2({ className }: { className?: string }) {
  return <Shield className={className} />;
}

const STEPS = [
  {
    step: '01',
    title: 'Upload your footage',
    desc: 'Drag and drop MP4, MOV, AVI, or MKV from any CCTV, body-cam, or archive. Up to 500MB per file.',
    icon: Upload,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    step: '02',
    title: 'AI runs the full pipeline',
    desc: 'Vision, audio, speech, pose, and fusion analysis happens simultaneously. Real-time progress you can follow.',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
  },
  {
    step: '03',
    title: 'Review + export evidence',
    desc: 'Labeled video, HTML report, CSV events, RAG JSON, PDF — all ready for briefings, handoffs, and court.',
    icon: FileText,
    color: 'from-emerald-500 to-teal-500',
  },
];

const FEATURES = [
  {
    icon: Eye,
    title: 'Object & person detection',
    desc: 'YOLOv8 detects 80+ COCO classes with per-frame tracking, identity re-identification, and crowd density scoring.',
    tag: 'YOLOv8 + ByteTrack',
  },
  {
    icon: Mic,
    title: 'Speech & audio intelligence',
    desc: '39-MFCC audio events + faster-whisper speech with automatic language detection across 50+ languages.',
    tag: 'Whisper + PANNs CNN14',
  },
  {
    icon: ShieldCheck,
    title: 'Explainable risk assessment',
    desc: 'Every event is timestamped, severity-scored, and cross-correlated with our 4-head fusion transformer.',
    tag: 'Cross-Attention Fusion',
  },
  {
    icon: AlertTriangle,
    title: 'Real-time surveillance events',
    desc: 'Fall detection, fight classification, stampede alerts, fire/smoke HSV detection, loitering — all automatic.',
    tag: '20+ event types',
  },
  {
    icon: Brain,
    title: 'Agentic AI narrative',
    desc: 'Claude-powered multi-agent orchestrator generates executive briefs, entity graphs, and causal chains.',
    tag: 'Claude + ReasoningAgent',
  },
  {
    icon: Download,
    title: 'Professional exports',
    desc: 'Labeled MP4, full HTML report, PDF brief, CSV events, Word document, and RAG-ready JSON in every job.',
    tag: '6 export formats',
  },
];

const USE_CASES = [
  {
    icon: Building2,
    industry: 'Retail',
    title: 'Loss prevention & customer analytics',
    desc: 'Detect shoplifting patterns, monitor dwell time, track crowd flow, and generate incident reports automatically.',
    color: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/30',
  },
  {
    icon: Shield,
    industry: 'Security operations',
    title: 'Incident detection & evidence packaging',
    desc: 'Fight detection, intrusion alerts, perimeter monitoring, and court-ready timestamped reports.',
    color: 'from-cyan-500/20 to-blue-500/10',
    border: 'border-cyan-500/30',
  },
  {
    icon: Users,
    industry: 'Smart cities',
    title: 'Crowd management & public safety',
    desc: 'Stampede prediction, crowd surge alerts, directional flow analysis, and event heatmaps.',
    color: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/30',
  },
  {
    icon: BarChart3,
    industry: 'Banking & finance',
    title: 'Branch & ATM monitoring',
    desc: 'Loitering detection, suspicious behaviour flags, tailgating alerts, and compliance reporting.',
    color: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/30',
  },
  {
    icon: Search,
    industry: 'Investigations',
    title: 'Forensic video analysis',
    desc: 'Frame-accurate event timelines, person re-identification across cameras, and structured RAG export for AI Q&A.',
    color: 'from-rose-500/20 to-red-500/10',
    border: 'border-rose-500/30',
  },
  {
    icon: Globe,
    industry: 'Transportation',
    title: 'Traffic & transit intelligence',
    desc: 'Vehicle tracking, license plate OCR, direction analysis, and incident reporting for highways and stations.',
    color: 'from-sky-500/20 to-indigo-500/10',
    border: 'border-sky-500/30',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Detectra cut our incident review time by 80%. What took a team of analysts half a day now takes minutes. The AI narrative is remarkably accurate.',
    author: 'Security Operations Director',
    company: 'Multinational Bank',
    rating: 5,
  },
  {
    quote: 'The explainable alerts and timestamped reports were exactly what our legal team needed. We submitted three clips as digital evidence and the court accepted them.',
    author: 'Chief Investigator',
    company: 'Law Enforcement Agency',
    rating: 5,
  },
  {
    quote: 'We integrated the API in under a day. The RAG JSON output feeds directly into our SIEM. Absolutely production-ready.',
    author: 'Lead Security Engineer',
    company: 'Global Retail Chain',
    rating: 5,
  },
];

const TECH_BADGES = [
  'YOLOv8s-Seg', 'ByteTrack', 'faster-whisper', 'PANNs CNN14', 'Places365',
  'ST-GCN', 'ViT Logo', 'MediaPipe', 'Cross-Attention Fusion', 'Claude AI',
];

const QUICK_LINKS = [
  { to: '/demo',         label: 'Live demo',     icon: PlayCircle },
  { to: '/capabilities', label: 'Capabilities',  icon: BookOpen },
  { to: '/pricing',      label: 'Pricing',        icon: Zap },
  { to: '/analyze',      label: 'Analyzer',       icon: Upload },
];

const TRUST_POINTS = [
  'Real-time progress while you wait',
  'Private uploads — only you see your data',
  'Video, HTML report, PDF, CSV, JSON exports',
  'No credit card required',
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const primaryCta = user ? (
    <HeroButtonPrimary to="/analyze" className="w-full sm:w-auto min-h-[48px]">
      Open analyzer <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </HeroButtonPrimary>
  ) : (
    <HeroButtonPrimary onClick={() => openAuthModal('signup')} className="w-full sm:w-auto min-h-[48px]">
      Get started free <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </HeroButtonPrimary>
  );

  return (
    <div className="min-h-screen bg-transparent">

      {/* ── Hero ── */}
      <Hero />

      {/* ── Quick nav ── */}
      <nav aria-label="Explore Detectra" className="relative border-b border-white/10">
        <motion.div {...fadeUp(0, reduceMotion)} className="page-shell py-4 sm:py-5">
          <ul className="flex gap-2 sm:gap-3 overflow-x-auto overscroll-x-contain pb-0.5 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <li key={to} className="snap-start shrink-0">
                <Link
                  to={to}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-cyan-500/40 hover:text-white hover:bg-cyan-500/10 min-h-[44px]"
                >
                  <Icon className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </nav>

      {/* ── Stats row ── */}
      <section className="border-b border-white/5 py-10 sm:py-14" aria-label="Key metrics">
        <div className="page-shell">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp(i * 0.07, reduceMotion)}
                className="text-center"
              >
                <dt className="text-xs sm:text-sm text-gray-500 mb-1 uppercase tracking-wider">{s.label}</dt>
                <dd className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tabular-nums">
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="section-y scroll-mt-24" aria-labelledby="how-heading">
        <div className="page-shell">
          <motion.div {...fadeUp(0, reduceMotion)}>
            <SectionHeader
              label="How it works"
              titleId="how-heading"
              title="Three steps from footage to evidence"
              description="No complex setup. Upload a video, watch the real-time pipeline, then export professional reports."
              className="mb-12 sm:mb-16"
            />
          </motion.div>
          <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 list-none p-0 m-0">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0" aria-hidden />
            {STEPS.map((item, idx) => (
              <motion.li
                key={item.step}
                {...fadeUp(idx * 0.1, reduceMotion)}
                className="relative elite-card flex flex-col p-6 sm:p-8 h-full group hover:border-cyan-500/30 transition-colors"
              >
                {/* Step number badge */}
                <div className={`mb-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                  <item.icon className="h-7 w-7 text-white" aria-hidden />
                </div>
                <span className="absolute top-6 right-6 text-5xl font-black text-white/[0.04] select-none">
                  {item.step}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-1">{item.desc}</p>
              </motion.li>
            ))}
          </ol>
          <motion.div
            {...fadeUp(0.2, reduceMotion)}
            className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {primaryCta}
            <HeroButtonSecondary to="/demo" className="w-full sm:w-auto min-h-[48px]">
              See a live demo first
            </HeroButtonSecondary>
          </motion.div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="section-y border-t border-white/5" aria-labelledby="features-heading">
        <div className="page-shell">
          <motion.div {...fadeUp(0, reduceMotion)}>
            <SectionHeader
              label="Capabilities"
              titleId="features-heading"
              title="Enterprise-grade AI on every video"
              description="A full multimodal pipeline — not a single-purpose detector. Every module runs in parallel for maximum speed and accuracy."
              className="mb-12"
            />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((cap, idx) => (
              <motion.article
                key={cap.title}
                {...fadeUp(idx * 0.05, reduceMotion)}
                className="elite-card p-5 sm:p-6 flex flex-col gap-4 group hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                    <cap.icon className="h-6 w-6 text-cyan-400" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm sm:text-base mb-1.5">{cap.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
                <span className="self-start text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 border border-cyan-500/20 rounded-full px-2.5 py-1 bg-cyan-500/5">
                  {cap.tag}
                </span>
              </motion.article>
            ))}
          </div>
          <motion.p {...fadeUp(0.15, reduceMotion)} className="mt-8 text-center">
            <Link to="/capabilities" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group">
              View all 20+ capabilities
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.p>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="section-y border-t border-white/5" aria-labelledby="usecases-heading">
        <div className="page-shell">
          <motion.div {...fadeUp(0, reduceMotion)}>
            <SectionHeader
              label="Industry verticals"
              titleId="usecases-heading"
              title="Built for the teams that can't afford to miss anything"
              description="Detectra is deployed across security, retail, banking, and law enforcement — wherever video evidence matters."
              className="mb-12"
            />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {USE_CASES.map((uc, idx) => (
              <motion.div
                key={uc.industry}
                {...fadeUp(idx * 0.06, reduceMotion)}
                className={`relative rounded-2xl border ${uc.border} bg-gradient-to-br ${uc.color} p-6 group hover:scale-[1.015] transition-transform duration-300 cursor-default`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <uc.icon className="h-5 w-5 text-white/80" aria-hidden />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">{uc.industry}</span>
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base mb-2">{uc.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp(0.2, reduceMotion)} className="mt-8 text-center">
            <Link to="/use-cases" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group">
              Explore all use cases <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Tech stack strip ── */}
      <section className="section-y border-t border-white/5 overflow-hidden" aria-label="Technology stack">
        <div className="page-shell">
          <motion.p {...fadeUp(0, reduceMotion)} className="text-center text-xs text-gray-500 uppercase tracking-widest mb-6">
            Powered by
          </motion.p>
          <motion.div
            {...fadeUp(0.05, reduceMotion)}
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
          >
            {TECH_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-400 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors"
              >
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section-y border-t border-white/5" aria-labelledby="testimonials-heading">
        <div className="page-shell">
          <motion.div {...fadeUp(0, reduceMotion)}>
            <SectionHeader
              label="What clients say"
              titleId="testimonials-heading"
              title="Trusted by security and operations teams"
              className="mb-12"
            />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.blockquote
                key={i}
                {...fadeUp(i * 0.1, reduceMotion)}
                className="elite-card p-6 sm:p-7 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed flex-1 italic">"{t.quote}"</p>
                <footer className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm font-semibold text-white">{t.author}</p>
                  <p className="text-xs text-gray-500">{t.company}</p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison: Manual vs Detectra ── */}
      <section className="section-y border-t border-white/5" aria-labelledby="compare-heading">
        <div className="page-shell">
          <motion.div {...fadeUp(0, reduceMotion)}>
            <SectionHeader
              label="Why Detectra"
              titleId="compare-heading"
              title="Manual review can't scale. We can."
              className="mb-12"
            />
          </motion.div>
          <motion.div {...fadeUp(0.05, reduceMotion)} className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Comparison: Manual review vs Detectra AI">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 pr-6 text-gray-500 font-medium w-1/2">Capability</th>
                  <th className="py-4 px-4 text-gray-400 font-medium text-center w-1/4">Manual review</th>
                  <th className="py-4 px-4 text-cyan-400 font-bold text-center w-1/4">
                    Detectra AI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Review speed', 'Real-time only', '10× faster than real-time'],
                  ['Simultaneous video streams', '1–2 per analyst', 'Unlimited with API'],
                  ['Audio / speech analysis', '❌ Manual transcription', '✅ Automatic + language detect'],
                  ['Timestamped evidence export', '❌ Screenshot and notes', '✅ Labeled video + PDF report'],
                  ['Fatigue & missed events', '❌ High risk after 30 min', '✅ Zero fatigue, consistent'],
                  ['Night / low-light accuracy', '❌ Heavily degraded', '✅ CLAHE enhancement + auto'],
                  ['Court-ready documentation', '❌ Hours of manual work', '✅ Generated in seconds'],
                  ['AI Q&A on footage', '❌ Not available', '✅ RAG chatbot over results'],
                ].map(([feature, manual, ai]) => (
                  <tr key={feature} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-6 text-gray-300 font-medium">{feature}</td>
                    <td className="py-3.5 px-4 text-center text-gray-500 text-xs">{manual}</td>
                    <td className="py-3.5 px-4 text-center text-cyan-300 text-xs font-medium">{ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section-y border-t border-white/5" aria-labelledby="cta-heading">
        <motion.div {...fadeUp(0, reduceMotion)} className="page-shell-narrow text-center">
          <div className="relative rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent p-8 sm:p-12 lg:p-16 overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <div className="absolute inset-x-0 -top-20 h-60 bg-cyan-500/10 blur-3xl" />
            </div>

            <span className="inline-block mb-4 text-2xl">🛡️</span>
            <h2 id="cta-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Ready to transform your surveillance workflow?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed">
              Upload your first video in under 60 seconds. No configuration, no vendor lock-in, no credit card needed.
            </p>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto text-left">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {primaryCta}
              {!user && (
                <HeroButtonSecondary onClick={() => openAuthModal('signin')} className="w-full sm:w-auto min-h-[48px]">
                  Sign in to existing account
                </HeroButtonSecondary>
              )}
            </div>

            <p className="mt-6 text-[11px] text-gray-600">
              University of Central Punjab · BSAI FYP · Group F25AI009 · Built with Nexariza AI
            </p>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
