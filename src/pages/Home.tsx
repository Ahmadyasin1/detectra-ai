import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Mic,
  FileText,
  Film,
  Upload,
  PlayCircle,
  BookOpen,
} from 'lucide-react';
import Hero from '../components/Hero';
import { HeroButtonPrimary, HeroButtonSecondary } from '../components/PageHero';
import { useAuth } from '../contexts/AuthContext';
import { openAuthModal } from '../lib/openAuth';

const fadeUp = (delay = 0, reduceMotion: boolean | null = false) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-48px' },
        transition: { duration: 0.45, delay },
      };

const STEPS = [
  {
    title: 'Upload your video',
    desc: 'MP4 or MOV from CCTV, body-cam, or archive. Drag and drop in the analyzer.',
    icon: Upload,
  },
  {
    title: 'AI runs the full pipeline',
    desc: 'Vision, audio, speech, and fusion on one timeline — with live progress you can follow.',
    icon: Brain,
  },
  {
    title: 'Review and export',
    desc: 'Labeled video, HTML report, and JSON — ready for briefings and handoffs.',
    icon: FileText,
  },
];

const FEATURES = [
  {
    icon: Eye,
    title: 'Objects & people',
    desc: 'Detection, tracking, and confidence on every frame.',
  },
  {
    icon: Mic,
    title: 'Speech & audio',
    desc: 'Transcripts with language detection and scene audio cues.',
  },
  {
    icon: ShieldCheck,
    title: 'Explainable alerts',
    desc: 'Events ranked by severity with timestamps you can verify.',
  },
  {
    icon: Film,
    title: 'Trusted exports',
    desc: 'Video overlays, reports, and structured JSON in one job.',
  },
];

const QUICK_LINKS = [
  { to: '/demo', label: 'Live demo', icon: PlayCircle },
  { to: '/capabilities', label: 'Capabilities', icon: BookOpen },
  { to: '/analyze', label: 'Analyzer', icon: Upload },
];

function SectionHeader({
  label,
  title,
  description,
  titleId,
  className = '',
}: {
  label: string;
  title: string;
  description?: string;
  titleId?: string;
  className?: string;
}) {
  return (
    <header className={`text-center max-w-2xl mx-auto ${className}`}>
      <p className="elite-label mb-3">{label}</p>
      <h2
        id={titleId}
        className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>
      )}
    </header>
  );
}

export default function Home() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const primaryCta = user ? (
    <HeroButtonPrimary to="/analyze" className="w-full sm:w-auto min-h-[48px]">
      Open analyzer <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </HeroButtonPrimary>
  ) : (
    <HeroButtonPrimary
      onClick={() => openAuthModal('signup')}
      className="w-full sm:w-auto min-h-[48px]"
    >
      Get started free <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </HeroButtonPrimary>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <Hero />

      {/* Quick navigation — scannable on mobile */}
      <nav
        aria-label="Explore Detectra"
        className="relative border-b border-white/10"
      >
        <motion.div
          {...fadeUp(0, reduceMotion)}
          className="page-shell py-4 sm:py-5"
        >
          <ul className="flex gap-2 sm:gap-3 overflow-x-auto overscroll-x-contain pb-0.5 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <li key={to} className="snap-start shrink-0">
                <Link
                  to={to}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-cyan-500/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 min-h-[44px]"
                >
                  <Icon className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </nav>

      {/* How it works */}
      <section id="how-it-works" className="section-y scroll-mt-24" aria-labelledby="how-heading">
        <div className="page-shell">
          <SectionHeader
            label="How it works"
            titleId="how-heading"
            title="Three steps from footage to evidence"
            description="No complex setup. Upload, wait for analysis, then review exports in your dashboard."
            className="mb-10 sm:mb-14"
          />
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 list-none p-0 m-0">
            {STEPS.map((item, idx) => (
              <motion.li
                key={item.title}
                {...fadeUp(idx * 0.06, reduceMotion)}
                className="elite-card flex flex-col p-5 sm:p-6 h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <item.icon className="h-5 w-5 text-cyan-400" aria-hidden />
                  </span>
                  <span className="text-xs font-bold text-cyan-400/90 tabular-nums">
                    Step {idx + 1}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-1">{item.desc}</p>
              </motion.li>
            ))}
          </ol>
          <motion.div
            {...fadeUp(0.15, reduceMotion)}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {primaryCta}
            <HeroButtonSecondary to="/demo" className="w-full sm:w-auto min-h-[48px]">
              See a demo first
            </HeroButtonSecondary>
          </motion.div>
        </div>
      </section>

      {/* Core features */}
      <section className="section-y border-t border-white/5" aria-labelledby="features-heading">
        <motion.div className="page-shell">
          <SectionHeader
            label="What you get"
            titleId="features-heading"
            title="Everything on one timeline"
            description="Multimodal analysis designed for security and operations teams — not a generic chat bot."
            className="mb-10 sm:mb-12"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {FEATURES.map((cap, idx) => (
              <motion.article
                key={cap.title}
                {...fadeUp(idx * 0.05, reduceMotion)}
                className="elite-card p-5 sm:p-6 flex gap-4 items-start"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <cap.icon className="h-5 w-5 text-cyan-400" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{cap.desc}</p>
                </div>
              </motion.article>
            ))}
          </div>
          <motion.p
            {...fadeUp(0.12, reduceMotion)}
            className="mt-8 text-center"
          >
            <Link
              to="/capabilities"
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors min-h-[44px]"
            >
              View full capability list <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.p>
        </motion.div>
      </section>

      {/* Trust + CTA */}
      <section className="section-y border-t border-white/5" aria-labelledby="cta-heading">
        <motion.div
          {...fadeUp(0, reduceMotion)}
          className="page-shell-narrow text-center"
        >
          <div className="elite-card p-6 sm:p-10 lg:p-12">
            <h2
              id="cta-heading"
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight"
            >
              Ready to analyze your first clip?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed">
              Sign in, upload a video, and receive labeled output plus a report — typically within minutes.
            </p>

            <ul className="mt-6 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 sm:gap-4 text-left sm:text-center max-w-xl mx-auto">
              {[
                'Progress updates while you wait',
                'Private to your account',
                'Video, report, and JSON exports',
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 sm:flex-1 sm:justify-center sm:min-w-[10rem]"
                >
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {primaryCta}
              {!user && (
                <HeroButtonSecondary
                  onClick={() => openAuthModal('signin')}
                  className="w-full sm:w-auto min-h-[48px]"
                >
                  Sign in
                </HeroButtonSecondary>
              )}
            </div>
          </div>

          <p className="mt-8 text-[11px] sm:text-xs text-gray-600">
            University of Central Punjab · BSAI FYP · Built by Nexariza AI
          </p>
        </motion.div>
      </section>
    </div>
  );
}
