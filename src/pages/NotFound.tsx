import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Upload, PlayCircle, Search } from 'lucide-react';

const QUICK_LINKS = [
  { icon: Home,       label: 'Home page',      href: '/',             desc: 'Back to the start' },
  { icon: Upload,     label: 'Video analyzer', href: '/analyze',      desc: 'Upload and analyse footage' },
  { icon: PlayCircle, label: 'Live demo',       href: '/demo',         desc: 'See it in action' },
  { icon: Search,     label: 'Capabilities',   href: '/capabilities', desc: 'What Detectra can do' },
];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="relative mb-6 select-none"
          aria-hidden
        >
          <span className="block text-[9rem] sm:text-[11rem] font-black leading-none text-white/[0.05]">
            404
          </span>
          <motion.div
            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent"
            style={{ top: '50%' }}
            animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Page not found</h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
            This page has been moved or doesn't exist. Try one of these instead:
          </p>
        </motion.div>

        {/* Quick links grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {QUICK_LINKS.map(({ icon: Icon, label, href, desc }) => (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/15 group-hover:border-cyan-500/30 transition-colors">
                <Icon className="h-4 w-4 text-cyan-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition min-h-[48px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white hover:opacity-90 transition min-h-[48px]"
          >
            <Home className="h-4 w-4" />
            Home page
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
