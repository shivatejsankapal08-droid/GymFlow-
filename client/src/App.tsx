import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardLayout } from './components/common/DashboardLayout';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer } from './components/common/ToastContainer';

const MainApp: React.FC = () => {
  const { currentUser, activePage } = useApp();

  const renderCurrentView = () => {
    if (activePage === 'login') {
      return <LoginPage />;
    }
    if (activePage === 'register') {
      return <RegisterPage />;
    }
    if (!currentUser || activePage === 'landing') {
      return <LandingPage />;
    }
    return <DashboardLayout />;
  };

  return (
    <>
      {renderCurrentView()}

      {/* Global Modals & Notifications */}
      <AuthModal />
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
