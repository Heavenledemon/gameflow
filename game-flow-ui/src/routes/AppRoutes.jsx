import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/ui/Feedback';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';

// Protection Guard
import ProtectedRoute from './ProtectedRoute';

// Pages
import OnboardingPage from '../pages/onboarding/OnboardingPage';
import SignUpPage from '../pages/auth/SignUpPage';
import SignInPage from '../pages/auth/SignInPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

import NotFoundPage from '../pages/app/NotFoundPage';

const HomePage = lazy(() => import('../pages/app/HomePage'));
const ExplorePage = lazy(() => import('../pages/app/ExplorePage'));
const UploadPage = lazy(() => import('../pages/app/UploadPage'));
const NotificationsPage = lazy(() => import('../pages/app/NotificationsPage'));
const InboxPage = lazy(() => import('../pages/app/InboxPage'));
const ConversationPage = lazy(() => import('../pages/app/ConversationPage'));
const ProfilePage = lazy(() => import('../pages/app/ProfilePage'));
const PrivateUploadsPage = lazy(() => import('../pages/app/PrivateUploadsPage'));
const ProjectDetailPage = lazy(() => import('../pages/app/ProjectDetailPage'));
const ProjectWorkspacePage = lazy(() => import('../pages/app/ProjectWorkspacePage'));
const CreatorProfilePage = lazy(() => import('../pages/app/CreatorProfilePage'));

function RouteLoading({ label = 'Loading page', viewport = false }) {
  return (
    <main className={`gf-route-loading${viewport ? ' gf-route-loading--viewport' : ''}`}>
      <LoadingState label={label} />
    </main>
  );
}

function ProtectedPage({ children, label }) {
  return <Suspense fallback={<RouteLoading label={label} />}>{children}</Suspense>;
}

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoading label="Restoring your session" viewport />;
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/app/home" replace />
          ) : localStorage.getItem('cv_onboarding_completed') === 'true' ? (
            <Navigate to="/signin" replace />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        }
      />

      {/* Public / Auth Layout Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected App Layout Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app/home" element={<ProtectedPage label="Loading play feed"><HomePage /></ProtectedPage>} />
          <Route path="/app/explore" element={<ProtectedPage label="Loading Discover"><ExplorePage /></ProtectedPage>} />
          <Route path="/app/upload" element={<ProtectedPage label="Loading publish flow"><UploadPage /></ProtectedPage>} />
          <Route path="/app/notifications" element={<ProtectedPage label="Loading notifications"><NotificationsPage /></ProtectedPage>} />
          <Route path="/app/inbox" element={<ProtectedPage label="Loading inbox"><InboxPage /></ProtectedPage>} />
          <Route path="/app/inbox/:conversationId" element={<ProtectedPage label="Loading conversation"><ConversationPage /></ProtectedPage>} />
          <Route path="/app/profile" element={<ProtectedPage label="Loading your portfolio"><ProfilePage /></ProtectedPage>} />
          <Route path="/app/profile/private-uploads" element={<ProtectedPage label="Loading private uploads"><PrivateUploadsPage /></ProtectedPage>} />
          <Route path="/app/project/:projectId" element={<ProtectedPage label="Loading project"><ProjectDetailPage /></ProtectedPage>} />
          <Route path="/app/project/:projectId/workspace" element={<ProtectedPage label="Loading project workspace"><ProjectWorkspacePage /></ProtectedPage>} />
          <Route path="/app/project/:projectId/workspace/:section" element={<ProtectedPage label="Loading project workspace"><ProjectWorkspacePage /></ProtectedPage>} />
          <Route path="/app/creator/:creatorId" element={<ProtectedPage label="Loading creator portfolio"><CreatorProfilePage /></ProtectedPage>} />
        </Route>
      </Route>

      {/* Wildcard 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
