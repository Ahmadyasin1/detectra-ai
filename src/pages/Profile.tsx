import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Edit2, Save, X, LogOut, UserCircle, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';

export default function Profile() {
  const { user, profile, loading: authLoading, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setGithubUsername(profile.github_username || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    const { error } = await updateProfile({
      full_name: fullName,
      github_username: githubUsername,
    });

    if (error) {
      setError(error.message || 'Failed to update profile');
    } else {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setGithubUsername(profile.github_username || '');
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const displayEmail = profile?.email || user.email || '';

  return (
    <>
      <SEO
        title="Profile - Detectra AI"
        description="Manage your Detectra AI profile and account settings."
      />
      <div className="min-h-screen px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass-effect-premium rounded-2xl shadow-2xl p-8 sm:p-10">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <UserCircle className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gradient-premium mb-1">
                      {displayName}
                    </h1>
                    <p className="text-slate-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {displayEmail}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </motion.button>
              </div>

              {/* Success/Error Messages */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
                >
                  Profile updated successfully!
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
                >
                  {error}
                </motion.div>
              )}

              {/* Profile Information */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </h2>
                    {!isEditing ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </motion.button>
                    ) : (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCancel}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-slate-900"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-900">
                          {profile?.full_name || 'Not set'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-600">
                        {displayEmail}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        GitHub Username
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-slate-900"
                          placeholder="Enter your GitHub username"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-900">
                          {profile?.github_username || 'Not set'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Member Since
                      </label>
                      <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-600">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Stats */}
                <div className="pt-6 border-t border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Status</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Account Type</p>
                      <p className="text-lg font-semibold text-blue-600">Free Account</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Email Verified</p>
                      <p className="text-lg font-semibold text-green-600">
                        {user.email_confirmed_at ? 'Verified' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

