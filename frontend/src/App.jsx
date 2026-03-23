import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import {
  ProtectedRoute,
  PublicRoute,
} from './components/layout/ProtectedRoute';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Pages
import RegisterPage from './pages/user/RegisterPage';
import LoginPage from './pages/user/LoginPage';
import DashboardPage from './pages/user/DashboardPage';
import QuizPage from './pages/user/QuizPage';
import AdminPage from './pages/admin/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>

        <Toaster
          position="top-center"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0d1240',
              color: '#e8eaf6',
              border: '1px solid #00d4ff22',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: '"DM Sans", sans-serif',
              maxWidth: '380px',
            },
            success: {
              iconTheme: { primary: '#00f5a0', secondary: '#0d1240' },
            },
            error: { iconTheme: { primary: '#ff4d6d', secondary: '#0d1240' } },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
