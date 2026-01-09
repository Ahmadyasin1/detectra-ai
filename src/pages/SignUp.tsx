import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';

const SocialButton = ({ provider, onClick, loading }: { provider: string; onClick: () => void; loading: boolean }) => {
  const styles = {
    google: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
    github: 'bg-gray-800 text-white hover:bg-gray-900 border border-gray-700',
  };
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${styles[provider as keyof typeof styles] || 'bg-slate-700 text-white'}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{provider === 'google' ? 'Google' : 'GitHub'}</span>
      )}
    </button>
  );
};

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signUp, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/demo';

  // Save redirect path for OAuth
  useEffect(() => {
    if (from && from !== '/signup') {
      sessionStorage.setItem('oauth_redirect_path', from);
    }
  }, [from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email.trim(), password, fullName.trim());

      if (error) {
        let errorMessage = error.message || 'Failed to create account. Please try again.';
        
        if (error.message?.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message?.includes('Password')) {
          errorMessage = 'Password does not meet requirements. Please choose a stronger password.';
        } else if (error.message?.includes('Email')) {
          errorMessage = 'Invalid email address. Please check and try again.';
        }
        
        setError(errorMessage);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/signin', { state: { from: { pathname: from } } });
        }, 2000);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Sign Up - Detectra AI"
        description="Create a new Detectra AI account to access demo features and project resources."
      />
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-2xl">D</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h1>
              <p className="text-slate-600 text-sm">Join Detectra AI and explore our demo</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 flex-1">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-semibold">Account created successfully!</p>
                  <p className="text-xs text-green-700 mt-0.5">Redirecting to sign in...</p>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && password.length < 6 && (
                  <p className="mt-1 text-xs text-slate-500">Must be at least 6 characters</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password && (
                  <div className="mt-1">
                    {password === confirmPassword ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Passwords match
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Passwords do not match
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Social Auth */}
            <div className="mt-5">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-500">Or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SocialButton
                  provider="google"
                  onClick={async () => {
                    setSocialLoading('google');
                    setError(null);
                    const { error } = await signInWithProvider('google');
                    if (error) {
                      setError(error.message || 'Failed to sign up with Google');
                      setSocialLoading(null);
                    }
                  }}
                  loading={socialLoading === 'google'}
                />
                <SocialButton
                  provider="github"
                  onClick={async () => {
                    setSocialLoading('github');
                    setError(null);
                    const { error } = await signInWithProvider('github');
                    if (error) {
                      setError(error.message || 'Failed to sign up with GitHub');
                      setSocialLoading(null);
                    }
                  }}
                  loading={socialLoading === 'github'}
                />
              </div>
            </div>

            {/* Links */}
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/signin"
                  state={{ from: location.state?.from || { pathname: '/demo' } }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
