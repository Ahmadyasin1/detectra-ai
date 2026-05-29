import { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Network,
  GitBranch,
  Target,
  Briefcase,
  BookOpen,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandNavLogo } from './BrandNavLogo';
import { openAuthModal } from '../lib/openAuth';

const MAIN_LINKS = [
  { label: 'Home',         href: '/' },
  { label: 'Analyzer',    href: '/analyze' },
  { label: 'Demo',        href: '/demo' },
  { label: 'Use Cases',   href: '/use-cases' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Pricing',     href: '/pricing' },
] as const;

const MORE_LINKS = [
  { label: 'Business Case', href: '/business-case', icon: Briefcase },
  { label: 'Architecture',  href: '/architecture',  icon: Network },
  { label: 'AI Pipeline',   href: '/pipeline',      icon: GitBranch },
  { label: 'Research',      href: '/research',      icon: BookOpen },
  { label: 'FAQ',           href: '/faq',           icon: Target },
  { label: 'Contact',       href: '/contact',       icon: Target },
  { label: 'FYP Project',   href: '/fyp-project',   icon: Target },
] as const;

const MORE_PATHS = MORE_LINKS.map((l) => l.href);

function linkClass(active: boolean) {
  return `inline-flex items-center min-h-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
    active
      ? 'text-cyan-400 bg-cyan-500/10'
      : 'text-gray-400 hover:text-white hover:bg-white/5'
  }`;
}

/** Glass dropdown panel — matches site card-glass / previous navbar menus */
const DROPDOWN_GLASS =
  'rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 12);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (userOpen && !t.closest('[data-nav-user]')) setUserOpen(false);
      if (moreOpen && !t.closest('[data-nav-more]')) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [userOpen, moreOpen]);

  const isActive = (href: string) => {
    if (href === '/analyze') {
      return location.pathname === '/analyze' || location.pathname.startsWith('/analyze/');
    }
    return location.pathname === href;
  };

  const moreActive = MORE_PATHS.some((p) => location.pathname === p);

  const shellClass = isScrolled
    ? 'bg-black/75 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
    : 'bg-transparent border-b border-transparent';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-[background,border,box-shadow] duration-300 ${shellClass}`}>
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <motion.div
          className="flex h-16 items-center justify-between gap-3"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <BrandNavLogo />

          {/* Desktop */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-0.5 min-w-0">
            {MAIN_LINKS.map((item) => (
              <Link key={item.href} to={item.href} className={linkClass(isActive(item.href))}>
                {item.label}
              </Link>
            ))}

            <motion.div className="relative" data-nav-more>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className={`${linkClass(moreActive)} gap-1`}
              >
                More
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute left-0 top-full z-50 mt-1.5 w-56 py-1 ${DROPDOWN_GLASS}`}
                    role="menu"
                  >
                    {MORE_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-3 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {user ? (
              <motion.div className="relative" data-nav-user>
                <button
                  type="button"
                  onClick={() => setUserOpen((v) => !v)}
                  aria-expanded={userOpen}
                  className="flex items-center gap-2 min-h-[40px] max-w-[200px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                    {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="truncate">
                    {profile?.full_name || user.email?.split('@')[0] || 'Account'}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${userOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`absolute right-0 top-full z-50 mt-2 w-48 py-1 ${DROPDOWN_GLASS}`}
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4" aria-hidden />
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await signOut();
                          } catch {
                            /* ignore */
                          }
                          setUserOpen(false);
                          navigate('/');
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/10"
                      >
                        <LogOut className="h-4 w-4" aria-hidden />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="min-h-[40px] px-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="min-h-[40px] rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-shadow"
                >
                  Get started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </motion.div>
      </nav>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-white/10 bg-black/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-1">
              {user ? (
                <Link to="/analyze" onClick={() => setMobileOpen(false)}>
                  <span className="mb-3 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white">
                    Open analyzer
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('signup');
                  }}
                  className="mb-3 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white"
                >
                  Get started free
                </button>
              )}

              {MAIN_LINKS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium ${linkClass(isActive(item.href))}`}
                >
                  {item.label}
                </Link>
              ))}

              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                More
              </p>
              {MORE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium ${linkClass(isActive(item.href))}`}
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-white/10 pt-3 mt-2">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await signOut();
                        } catch {
                          /* ignore */
                        }
                        setMobileOpen(false);
                        navigate('/');
                      }}
                      className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openAuthModal('signin');
                    }}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-white/10 text-sm font-medium text-gray-300"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
