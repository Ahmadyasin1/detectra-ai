import { Suspense, lazy, type ReactNode, Component, type ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import FYPProject from './pages/FYPProject';
import Timeline from './pages/Timeline';
import ResearchLiterature from './pages/ResearchLiterature';
import DetectionDemo from './pages/DetectionDemo';
import Architecture from './pages/Architecture';
import Pipeline from './pages/Pipeline';
import Capabilities from './pages/Capabilities';
import Pricing from './pages/Pricing';
import Team from './pages/Team';
import BusinessCase from './pages/BusinessCase';
import Contact from './pages/Contact';
import AuthRouteHandler from './pages/AuthRouteHandler';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import UseCases from './pages/UseCases';
import FAQ from './pages/FAQ';
import { useAuth } from './contexts/AuthContext';
import BrandAuthLoader from './components/BrandAuthLoader';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold text-red-400 mb-3">Something went wrong</h1>
            <p className="text-gray-400 mb-6 text-sm break-words">{(this.state.error as Error).message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AnalyzeJob = lazy(() => import('./pages/AnalyzeJob'));
const JobResults = lazy(() => import('./pages/JobResults'));

/**
 * Generic protected route — redirects to /signin when no user.
 * `allowGuest` lets routes opt-in to letting unauthenticated users in when
 * Supabase isn't configured (so the analyzer still works in dev/demo mode).
 */
function ProtectedRoute({
  children,
  allowGuest = false,
}: {
  children: ReactNode;
  allowGuest?: boolean;
}) {
  const { user, loading, isGuest } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <BrandAuthLoader />
    );
  }

  if (!user) {
    if (allowGuest && isGuest) return <>{children}</>;
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/** Old bookmarks / shared links */
function LegacyDashboardAnalyzeRedirect() {
  const { jobId } = useParams();
  return <Navigate to={`/analyze/progress/${jobId}`} replace />;
}

function LegacyDashboardResultsRedirect() {
  const { jobId } = useParams();
  return <Navigate to={`/analyze/results/${jobId}`} replace />;
}

function App() {
  return (
    <ErrorBoundary>
    <Router>
      <Suspense fallback={<BrandAuthLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="project" element={<Navigate to="/fyp-project" replace />} />
          <Route path="fyp-project" element={<FYPProject />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="research" element={<ResearchLiterature />} />
          <Route path="demo" element={<DetectionDemo />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="capabilities" element={<Capabilities />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="team" element={<Team />} />
          <Route path="business-case" element={<BusinessCase />} />
          <Route path="use-cases" element={<UseCases />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="contact" element={<Contact />} />
          <Route path="signin" element={<AuthRouteHandler mode="signin" />} />
          <Route path="signup" element={<AuthRouteHandler mode="signup" />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="analyze"
            element={
              <ProtectedRoute allowGuest>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="analyze/progress/:jobId"
            element={
              <ProtectedRoute allowGuest>
                <AnalyzeJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="analyze/results/:jobId"
            element={
              <ProtectedRoute allowGuest>
                <JobResults />
              </ProtectedRoute>
            }
          />
          <Route path="dashboard" element={<Navigate to="/analyze" replace />} />
          <Route path="dashboard/analyze/:jobId" element={<LegacyDashboardAnalyzeRedirect />} />
          <Route path="dashboard/results/:jobId" element={<LegacyDashboardResultsRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
