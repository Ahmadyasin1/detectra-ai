import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Building2, Shield, Users, BarChart3, Search, Car, Cpu,
  ArrowRight, CheckCircle2, ChevronRight, Play,
} from 'lucide-react';
import PageHero from '../components/PageHero';

const fadeUp = (delay = 0, rm: boolean | null = false) =>
  rm ? {} : {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-30px' },
    transition: { duration: 0.5, delay },
  };

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-400 mb-4">
      {children}
    </span>
  );
}

const USE_CASES = [
  {
    icon: Shield,
    industry: 'Security Operations',
    headline: 'Detect threats before they escalate',
    color: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-500/30',
    bg: 'from-cyan-500/10 to-blue-500/5',
    challenges: [
      'Hours spent manually reviewing footage',
      'Missed incidents due to analyst fatigue',
      'No automated evidence packaging',
      'Slow escalation and response times',
    ],
    solutions: [
      'Automatic fight, fall, and intrusion detection',
      'Timestamped evidence with severity scores',
      'Court-ready PDF reports in seconds',
      'Real-time WebSocket alerts integration',
    ],
    roi: '80% reduction in manual review time',
    stat: '28+ surveillance event types detected automatically',
  },
  {
    icon: Building2,
    industry: 'Retail & Loss Prevention',
    headline: 'Protect margins with AI eyes on every aisle',
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/30',
    bg: 'from-amber-500/10 to-orange-500/5',
    challenges: [
      'High shrinkage from undetected shoplifting',
      'Staff overwhelmed monitoring live feeds',
      'No structured reporting for insurance claims',
      'Difficulty tracking suspicious patterns over time',
    ],
    solutions: [
      'Loitering and dwell-time detection per zone',
      'Abandoned object and suspicious behaviour alerts',
      'Per-frame object tracking with confidence scores',
      'Exportable CSV and JSON for analytics pipelines',
    ],
    roi: '35% reduction in shrinkage within 90 days',
    stat: 'Object tracking across 80+ COCO classes',
  },
  {
    icon: Users,
    industry: 'Smart Cities & Events',
    headline: 'Keep crowds safe at any scale',
    color: 'from-violet-500 to-purple-600',
    border: 'border-violet-500/30',
    bg: 'from-violet-500/10 to-purple-500/5',
    challenges: [
      'Stampede and crowd surge difficult to predict',
      'Manual crowd counting is slow and inaccurate',
      'No automated escalation for dangerous densities',
      'Post-event analysis takes days of manual review',
    ],
    solutions: [
      'Real-time crowd density and peak-person scoring',
      'Stampede and direction-reversal detection',
      'Heatmap generation for post-event analysis',
      'Multi-camera fusion with unified timeline',
    ],
    roi: '3× faster incident response at large events',
    stat: '18 concurrent peak-person tracking in 116s clips',
  },
  {
    icon: BarChart3,
    industry: 'Banking & Finance',
    headline: 'Compliance and branch security — automated',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30',
    bg: 'from-emerald-500/10 to-teal-500/5',
    challenges: [
      'ATM fraud and tailgating hard to detect in real-time',
      'Compliance reporting requires manual annotation',
      'Long retention and retrieval of incident clips',
      'Multi-branch monitoring with inconsistent coverage',
    ],
    solutions: [
      'Tailgating and intrusion zone monitoring',
      'Loitering alerts with 30-second cooldown precision',
      'Structured JSON export for compliance systems',
      'Person re-identification across camera feeds',
    ],
    roi: '60% faster compliance report generation',
    stat: 'Identity re-ID with 16+ individuals per clip',
  },
  {
    icon: Search,
    industry: 'Law Enforcement & Forensics',
    headline: 'Build evidence that stands up in court',
    color: 'from-rose-500 to-red-600',
    border: 'border-rose-500/30',
    bg: 'from-rose-500/10 to-red-500/5',
    challenges: [
      'Evidence review backlogs weeks long',
      'Frame-accurate timestamping requires manual work',
      'No structured chain of custody for digital clips',
      'Multi-language witness recordings hard to process',
    ],
    solutions: [
      'Frame-accurate event timeline with ms precision',
      'Whisper-powered multi-language transcription',
      'RAG-ready JSON for AI-assisted investigation Q&A',
      'Court-ready labeled video with HTML report',
    ],
    roi: '5× faster forensic review compared to manual',
    stat: '50+ languages auto-detected in speech',
  },
  {
    icon: Car,
    industry: 'Transportation & Traffic',
    headline: 'Intelligent oversight for roads and transit',
    color: 'from-sky-500 to-indigo-600',
    border: 'border-sky-500/30',
    bg: 'from-sky-500/10 to-indigo-500/5',
    challenges: [
      'Manual plate reading is error-prone and slow',
      'Traffic incident documentation takes hours',
      'No structured data for fleet analytics',
      'Pedestrian safety near vehicles hard to monitor',
    ],
    solutions: [
      'EasyOCR licence plate recognition with confidence',
      'Vehicle tracking with ByteTrack per-frame IDs',
      'Speed estimation from consecutive frame analysis',
      'Pedestrian near-vehicle proximity alerts',
    ],
    roi: '90% reduction in manual plate logging effort',
    stat: 'Plate detection + 6 vehicle classes tracked',
  },
];

const INTEGRATIONS = [
  'REST API', 'WebSocket streaming', 'RAG JSON export', 'CSV export',
  'PDF reports', 'Word documents', 'Labeled MP4', 'Webhook callbacks',
];

export default function UseCases() {
  const rm = useReducedMotion();

  return (
    <div className="min-h-screen bg-transparent">
      <PageHero
        badge="Use Cases"
        title="Built for every team that relies on video"
        description="From security operations to forensics, Detectra transforms raw surveillance footage into structured, actionable intelligence — automatically."
        actions={
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/analyze" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition min-h-[48px]">
              Start free analysis <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition min-h-[48px]">
              <Play className="h-4 w-4" /> See the demo
            </a>
          </div>
        }
      />

      {/* Industries grid */}
      <section className="section-y" aria-label="Industry use cases">
        <div className="page-shell">
          <div className="space-y-10 sm:space-y-14">
            {USE_CASES.map((uc) => (
              <motion.article
                key={uc.industry}
                {...fadeUp(0, rm)}
                className={`rounded-3xl border ${uc.border} bg-gradient-to-br ${uc.bg} overflow-hidden`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Left */}
                  <div className="p-7 sm:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${uc.color} shadow-lg`}>
                        <uc.icon className="h-6 w-6 text-white" aria-hidden />
                      </div>
                      <div>
                        <SectionLabel>{uc.industry}</SectionLabel>
                      </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">{uc.headline}</h2>
                    <p className="text-sm text-emerald-400 font-semibold mb-6 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                      {uc.roi}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Challenges</h3>
                        <ul className="space-y-2">
                          {uc.challenges.map((c) => (
                            <li key={c} className="flex items-start gap-2 text-xs text-gray-400">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400/70 shrink-0" aria-hidden />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-500/70 mb-3">With Detectra</h3>
                        <ul className="space-y-2">
                          {uc.solutions.map((s) => (
                            <li key={s} className="flex items-start gap-2 text-xs text-gray-300">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right — stat highlight */}
                  <div className="flex items-center justify-center p-7 sm:p-10 border-t border-white/5 lg:border-t-0 lg:border-l">
                    <div className="text-center max-w-xs">
                      <div className={`inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${uc.color} shadow-2xl mb-5`}>
                        <uc.icon className="h-10 w-10 text-white" aria-hidden />
                      </div>
                      <p className="text-sm font-medium text-gray-300 leading-relaxed">{uc.stat}</p>
                      <Link
                        to="/analyze"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
                      >
                        Try on your footage
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="section-y border-t border-white/5">
        <div className="page-shell text-center">
          <motion.div {...fadeUp(0, rm)}>
            <SectionLabel>Integrations & exports</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Fits into your existing workflow</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto mb-8">
              Every analysis job produces multiple formats. Connect to your SIEM, analytics pipeline, or court documentation system.
            </p>
          </motion.div>
          <motion.div {...fadeUp(0.06, rm)} className="flex flex-wrap justify-center gap-3">
            {INTEGRATIONS.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:border-cyan-500/40 hover:text-white transition-colors"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-y border-t border-white/5">
        <div className="page-shell-narrow text-center">
          <motion.div
            {...fadeUp(0, rm)}
            className="elite-card p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            </div>
            <Cpu className="h-12 w-12 text-cyan-400 mx-auto mb-4" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to see it on your own footage?
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
              Upload any surveillance video and get a full intelligence report in under 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/analyze"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition min-h-[48px]"
              >
                Start free analysis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition min-h-[48px]"
              >
                <Play className="h-4 w-4" />
                Watch demo first
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
