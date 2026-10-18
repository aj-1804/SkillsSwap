import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { DemoUserSwitcher } from './components/DemoUserSwitcher.tsx';

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { SkillDetailPage } from './pages/SkillDetailPage.tsx';
import { HowItWorksPage } from './pages/HowItWorksPage.tsx';
import { StudentDashboard } from './pages/StudentDashboard.tsx';
import { ExchangesPage } from './pages/ExchangesPage.tsx';
import { BookingsPage } from './pages/BookingsPage.tsx';
import { MyListingsPage } from './pages/MyListingsPage.tsx';
import { MessagesPage } from './pages/MessagesPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppLayout() {
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar onOpenDemoSwitcher={() => setIsDemoSwitcherOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/skill/:id" element={<SkillDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchanges"
            element={
              <ProtectedRoute>
                <ExchangesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <MyListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Administrator Routes (Amit Jha) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <div className="max-w-md mx-auto py-24 px-4 text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-mono">404</h1>
                <p className="text-sm text-slate-600 mb-6">Page not found on SkillSwap Global.</p>
                <a
                  href="/"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  Return Home
                </a>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />

      <DemoUserSwitcher
        isOpen={isDemoSwitcherOpen}
        onClose={() => setIsDemoSwitcherOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}
