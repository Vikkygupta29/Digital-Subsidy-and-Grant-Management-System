import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SchemesPage from './pages/SchemesPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import BeneficiariesPage from './pages/BeneficiariesPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected App Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/schemes" element={<SchemesPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route
                path="/review-queue"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      'ADMIN',
                      'FIELD_OFFICER',
                      'DISTRICT_OFFICER',
                      'FINANCE_APPROVER',
                    ]}
                  >
                    <ReviewQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/beneficiaries"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      'ADMIN',
                      'FIELD_OFFICER',
                      'DISTRICT_OFFICER',
                      'FINANCE_APPROVER',
                    ]}
                  >
                    <BeneficiariesPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch All 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
