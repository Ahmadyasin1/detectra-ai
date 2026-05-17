import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Eye,
  Film,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PremiumDemoShowcase from '../components/demo/PremiumDemoShowcase';
import PageHero, { HeroButtonPrimary, HeroButtonSecondary } from '../components/PageHero';

const DEMO_STATS = [
  { icon: Film, value: '3', label: 'Sample scenes', color: 'text-cyan-400' },
  { icon: Cpu, value: '6', label: 'AI models', color: 'text-indigo-400' },
  { icon: Zap, value: 'Full', label: 'Pipeline output', color: 'text-emerald-400' },
  { icon: CheckCircle, value: 'Export', label: 'Report + JSON', color: 'text-blue-400' },
];

const PIPELINE = [
  { icon: Eye, title: 'Detection & tracking', desc: 'YOLOv8 + ByteTrack with persistent IDs' },
  { icon: Sparkles, title: 'Fusion & scoring', desc: 'Cross-modal events with severity tags' },
  { icon: Film, title: 'Deliverables', desc: 'Labeled video, HTML report, structured JSON' },
];

const TIERS = [
  {
    name: 'Free',
    highlight: '3 videos / month',
    detail: 'Up to 5 minutes each — perfect to validate your workflow.',
    cta: 'Start free',
    to: '/signup',
    featured: true,
  },
  {
    name: 'Pro',
    highlight: '50 videos / month',
    detail: 'Longer clips, priority queue, PDF reports, and API access.',
    cta: 'View pricing',
    to: '/pricing',
    featured: false,
  },
];

export default function DetectionDemo() {
  const { user } = useAuth();

  return (
    <motion.div className="min-h-screen bg-transparent">
      <PageHero
        badge="Product demo"
        title="See what"
        titleAccent="Detectra delivers"
        description="Watch real labeled outputs from our multimodal pipeline — the same results your team gets in the analyzer. Create a free account to run your own footage; upgrade when you need more volume."
        stats={DEMO_STATS}
        actions={
          user ? (
            <>
              <HeroButtonPrimary to="/analyze" className="gap-2">
                Start free tier
                <ArrowRight className="h-4 w-4" />
              </HeroButtonPrimary>
              <HeroButtonSecondary to="/pricing">Compare plans</HeroButtonSecondary>
            </>
          ) : (
            <>
              <HeroButtonPrimary to="/signup" className="gap-2">
                Get 3 videos free
                <ArrowRight className="h-4 w-4" />
              </HeroButtonPrimary>
              <HeroButtonSecondary to="/pricing">View pricing</HeroButtonSecondary>
            </>
          )
        }
      />

      <div className="py-12 sm:py-16">
        <PremiumDemoShowcase />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mx-8" />

      {/* Pipeline strip */}
      <section className="py-14 sm:py-16">
        <div className="page-shell">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <p className="elite-label mb-3">Under the hood</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              One upload, six models, three exports
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Vision, audio, and fusion run together — then you receive assets ready for review and compliance.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-3">
            {PIPELINE.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06 * i }}
                className="elite-card p-6 text-center sm:text-left"
              >
                <span className="mx-auto sm:mx-0 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
                  <item.icon className="h-5 w-5 text-cyan-400" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <motion.div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mx-8" />

      {/* Free vs paid */}
      <section className="py-14 sm:py-20">
        <div className="page-shell">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <p className="elite-label mb-3">Simple pricing</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Try free, scale when you&apos;re ready
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Every account includes a monthly video allowance. This demo shows finished outputs — your analyzer runs the same pipeline on private uploads.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {TIERS.map((tier) => (
              <motion.div
                key={tier.name}
                whileHover={{ y: -2 }}
                className={`elite-card p-6 sm:p-8 ${
                  tier.featured ? 'border-cyan-500/30 ring-1 ring-cyan-500/20' : ''
                }`}
              >
                {tier.featured && (
                  <span className="inline-block mb-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    Most popular to start
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="mt-2 text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {tier.highlight}
                </p>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{tier.detail}</p>
                <Link
                  to={user && tier.featured ? '/analyze' : tier.to}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {user && tier.featured ? 'Open analyzer' : tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 border-t border-white/10 bg-gradient-to-b from-gray-950/80 via-transparent to-gray-950">
        <div className="page-shell max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to run your{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                own footage?
              </span>
            </h2>
            <p className="mt-4 text-gray-400 text-base max-w-lg mx-auto">
              {user
                ? 'Your free tier includes 3 videos per month. Upload in the analyzer to get labeled video, reports, and JSON — stored privately in your account.'
                : 'Sign up free for 3 videos per month. No credit card required to see full pipeline results on your uploads.'}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? '/analyze' : '/signup'}>
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-xl shadow-cyan-500/25"
                >
                  {user ? 'Go to analyzer' : 'Create free account'}
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
              <Link to="/pricing">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 text-gray-300 rounded-xl font-semibold hover:border-white/40 hover:text-white transition-colors"
                >
                  Compare all plans
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
