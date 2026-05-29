import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Twitter, Shield, CheckCircle2, ArrowRight, Cpu, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DetectraLogo from './DetectraLogo';
import { openAuthModal } from '../lib/openAuth';
import { CONTACT_EMAIL } from '../constants/contact';

const NAV_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Video Analyzer',  href: '/analyze' },
      { label: 'Live Demo',       href: '/demo' },
      { label: 'Capabilities',    href: '/capabilities' },
      { label: 'Use Cases',       href: '/use-cases' },
      { label: 'Pricing',         href: '/pricing' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'AI Pipeline',     href: '/pipeline' },
      { label: 'Architecture',    href: '/architecture' },
      { label: 'Research',        href: '/research' },
      { label: 'FAQ',             href: '/faq' },
      { label: 'Contact',         href: '/contact' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'FYP Overview',    href: '/fyp-project' },
      { label: 'Business Case',   href: '/business-case' },
      { label: 'Timeline',        href: '/timeline' },
      { label: 'Team',            href: '/team' },
    ],
  },
];

const TRUST_CHIPS = [
  { icon: Shield,       text: 'CPU-optimised inference' },
  { icon: Lock,         text: 'Private video uploads' },
  { icon: Cpu,          text: '15+ AI modules' },
  { icon: CheckCircle2, text: 'Evidence-grade reports' },
];

const SOCIALS = [
  { icon: Mail,     href: `mailto:${CONTACT_EMAIL}`,          label: 'Email' },
  { icon: Github,   href: 'https://github.com/Ahmadyasin1',   label: 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com',         label: 'LinkedIn' },
  { icon: Twitter,  href: 'https://twitter.com',              label: 'Twitter / X' },
];

export default function Footer() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [subSent, setSubSent] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubSent(true);
    setEmail('');
  }

  return (
    <footer className="relative bg-[#050505] text-gray-400 border-t border-white/10 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[120px] bg-cyan-500/8 blur-[100px] rounded-full pointer-events-none" />

      {/* Newsletter strip */}
      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg mb-1">Stay updated on Detectra AI</h3>
              <p className="text-sm text-gray-500">New models, features, and research — delivered monthly.</p>
            </div>
            {subSent ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                You're subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto" aria-label="Newsletter signup">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  aria-label="Email address for newsletter"
                  className="flex-1 sm:w-56 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition min-h-[44px]"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition min-h-[44px] shrink-0"
                >
                  Subscribe <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand col */}
          <div className="lg:col-span-2">
            <DetectraLogo size="lg" linkToHome className="mb-4" />
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
              Enterprise-grade multimodal video intelligence. Detectra turns surveillance footage into
              structured evidence — automatically.
            </p>

            {/* Trust chips */}
            <ul className="space-y-2">
              {TRUST_CHIPS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-xs text-gray-500">
                  <Icon className="h-3.5 w-3.5 text-cyan-500/60 shrink-0" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">{col.heading}</h4>
              <nav className="space-y-2.5" aria-label={col.heading}>
                {col.links.map(({ label, href }) => (
                  <Link
                    key={href}
                    to={href}
                    className="block text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-12 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-sm sm:text-base">Ready to analyse your first video?</p>
            <p className="text-xs text-gray-500 mt-0.5">No credit card · No GPU · Results in minutes</p>
          </div>
          {user ? (
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition shrink-0 min-h-[44px]"
            >
              Open analyzer <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition shrink-0 min-h-[44px]"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Bottom row */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Detectra AI &middot; University of Central Punjab &middot; BSAI FYP F25AI009
          </p>

          {/* Socials */}
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <motion.a
                key={label}
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href={href}
                aria-label={label}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
              >
                <Icon className="h-4 w-4" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
