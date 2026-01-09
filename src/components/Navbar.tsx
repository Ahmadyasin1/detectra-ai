import { useState, useEffect, useCallback } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserMenuOpen && !target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'FYP Project', href: '/fyp-project' },
    { label: 'Timeline', href: '/timeline' },
    { label: 'Research', href: '/research' },
    { label: 'Demo', href: '/demo' },
    { label: 'Team', href: '/team' },
    { label: 'Business Case', href: '/business-case' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-effect-premium border-b border-slate-200 shadow-lg'
          : 'glass-effect'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight">
                Detectra AI
              </span>
              <span className="text-slate-600 text-xs -mt-1 font-medium">
                by Nexariza AI
              </span>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 transition-all duration-200 relative group rounded-lg ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-700 transition-all duration-200 rounded-full ${
                    isActive(item.href) ? 'w-6' : 'w-0 group-hover:w-6'
                  }`} />
                </motion.button>
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user && (
              <div className="relative user-menu-container">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  {profile?.full_name || user.email?.split('@')[0] || 'Profile'}
                </motion.button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 glass-effect-premium rounded-lg shadow-xl border border-slate-200 overflow-hidden"
                    >
                      <Link to="/profile">
                        <button
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </button>
                      </Link>
                      <button
                        onClick={async () => {
                          await signOut();
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <Link to="/contact">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
              >
                Get in Touch
              </motion.button>
            </Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-slate-700 p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-effect border-b border-slate-200"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.label} to={item.href}>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                </Link>
              ))}
              {user && (
                <>
                  <Link to="/profile">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                    >
                      My Profile
                    </button>
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut();
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              )}
              <Link to="/contact">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full btn-primary mt-2"
                >
                  Get in Touch
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
