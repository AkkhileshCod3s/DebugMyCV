import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingNav from './components/LandingNav.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { LoadingSpinner } from './components/ui.jsx';
import Landing from './pages/Landing.jsx';
import CookieBanner from './components/CookieBanner.jsx';

const SampleReport = lazy(() => import('./pages/SampleReport.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Cookies = lazy(() => import('./pages/Cookies.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Analyze = lazy(() => import('./pages/Analyze.jsx'));
const AnalysisResult = lazy(() => import('./pages/AnalysisResult.jsx'));
const History = lazy(() => import('./pages/History.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

function PageFallback() {
  return (
    <div className="container page">
      <LoadingSpinner label="Loading…" />
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isLanding =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/sample' ||
    pathname === '/privacy' ||
    pathname === '/cookies';

  return (
    <>
      {!isLanding && (
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
      )}
      {!isLanding && <LandingNav variant="app" />}
      <main id="main">
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Landing />} />
              <Route path="/register" element={<Landing />} />
              <Route path="/sample" element={<SampleReport />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyze"
                element={
                  <ProtectedRoute>
                    <Analyze />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyses/:id"
                element={
                  <ProtectedRoute>
                    <AnalysisResult />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/index.html" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <CookieBanner />
    </>
  );
}
