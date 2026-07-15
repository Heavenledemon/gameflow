import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

import HomePage from '../pages/app/HomePage';
import ExplorePage from '../pages/app/ExplorePage';
import UploadPage from '../pages/app/UploadPage';
import NotificationsPage from '../pages/app/NotificationsPage';
import InboxPage from '../pages/app/InboxPage';
import ProfilePage from '../pages/app/ProfilePage';
import ProjectDetailPage from '../pages/app/ProjectDetailPage';
import CreatorProfilePage from '../pages/app/CreatorProfilePage';
import NotFoundPage from '../pages/app/NotFoundPage';

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
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
          <Route path="/app/home" element={<HomePage />} />
          <Route path="/app/explore" element={<ExplorePage />} />
          <Route path="/app/upload" element={<UploadPage />} />
          <Route path="/app/notifications" element={<NotificationsPage />} />
          <Route path="/app/inbox" element={<InboxPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/project/:projectId" element={<ProjectDetailPage />} />
          <Route path="/app/creator/:creatorId" element={<CreatorProfilePage />} />
        </Route>
      </Route>

      {/* Wildcard 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
