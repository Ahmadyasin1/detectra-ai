import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Project from './pages/Project';
import FYPProject from './pages/FYPProject';
import Timeline from './pages/Timeline';
import ResearchLiterature from './pages/ResearchLiterature';
import DetectionDemo from './pages/DetectionDemo';
import Team from './pages/Team';
import BusinessCase from './pages/BusinessCase';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the current location so we can redirect back after sign-in
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="project" element={<Project />} />
          <Route path="fyp-project" element={<FYPProject />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="research" element={<ResearchLiterature />} />
          <Route
            path="demo"
            element={
              <ProtectedRoute>
                <DetectionDemo />
              </ProtectedRoute>
            }
          />
          <Route path="team" element={<Team />} />
          <Route path="business-case" element={<BusinessCase />} />
          <Route path="contact" element={<Contact />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
