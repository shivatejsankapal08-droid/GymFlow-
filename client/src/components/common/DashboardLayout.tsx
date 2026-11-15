import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { RoleSwitcher } from './RoleSwitcher';
import { QuickQRScannerModal } from './QuickQRScannerModal';

// Quick Action Modals
import { GenerateQRModal } from '../modals/GenerateQRModal';
import { SendNotificationModal } from '../modals/SendNotificationModal';
import { AddMemberModal } from '../modals/AddMemberModal';
import { AddTrainerModal } from '../modals/AddTrainerModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';

// Dashboards
import { GymOwnerDashboard } from '../dashboards/GymOwnerDashboard';
import { SuperAdminDashboard } from '../dashboards/SuperAdminDashboard';
import { TrainerDashboard } from '../dashboards/TrainerDashboard';
import { MemberDashboard } from '../dashboards/MemberDashboard';

// Modules
import { MemberManagement } from '../modules/MemberManagement';
import { QRAttendanceStation } from '../modules/QRAttendanceStation';
import { TrainerManagement } from '../modules/TrainerManagement';
import { MembershipPlansView } from '../modules/MembershipPlansView';
import { PaymentManagement } from '../modules/PaymentManagement';
import { WorkoutPlansView } from '../modules/WorkoutPlansView';
import { WorkoutDietManagement } from '../modules/WorkoutDietManagement';
import { AIAssistant } from '../modules/AIAssistant';
import { AutomationHub } from '../modules/AutomationHub';
import { AnalyticsView } from '../modules/AnalyticsView';
import { SettingsView } from '../modules/SettingsView';
import { SaaSSubscriptionView } from '../modules/SaaSSubscriptionView';
import { UserProfileModal } from '../profile/UserProfileModal';
import { ProtectedRoute } from './ProtectedRoute';

export const DashboardLayout: React.FC = () => {
  const { currentUser, currentGym, activePage, setActivePage } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  if (!currentUser) return null;

  // Render role-specific or page-specific main view
  const renderContent = () => {
    // If user is Super Admin
    if (currentUser.role === 'super_admin') {
      if (activePage === 'automations') return <AutomationHub />;
      if (activePage === 'analytics') return <AnalyticsView />;
      return <SuperAdminDashboard />;
    }

    // If user is Trainer
    if (currentUser.role === 'trainer') {
      if (activePage === 'members') return <MemberManagement />;
      if (activePage === 'attendance') return <QRAttendanceStation />;
      if (activePage === 'workouts') return <WorkoutDietManagement />;
      if (activePage === 'ai-assistant') return <AIAssistant />;
      if (activePage === 'overview' || activePage === 'dashboard') return <TrainerDashboard />;
    }

    // If user is Member
    if (currentUser.role === 'member') {
      if (activePage === 'attendance') return <QRAttendanceStation />;
      if (activePage === 'payments') return <PaymentManagement />;
      if (activePage === 'workouts') return <WorkoutDietManagement />;
      if (activePage === 'ai-assistant') return <AIAssistant />;
      if (activePage === 'overview' || activePage === 'dashboard') return <MemberDashboard />;
    }

    // Default / Gym Owner routes
    switch (activePage) {
      case 'members':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin', 'trainer']} pageName="Member Management">
            <MemberManagement />
          </ProtectedRoute>
        );
      case 'trainers':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin']} pageName="Trainer Management">
            <TrainerManagement />
          </ProtectedRoute>
        );
      case 'plans':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin']} pageName="Membership Plans Configuration">
            <MembershipPlansView />
          </ProtectedRoute>
        );
      case 'attendance':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin', 'trainer', 'member']} pageName="Attendance Station">
            <QRAttendanceStation />
          </ProtectedRoute>
        );
      case 'payments':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin', 'member']} pageName="Financial & Invoicing Hub">
            <PaymentManagement />
          </ProtectedRoute>
        );
      case 'workouts':
        return <WorkoutDietManagement />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'automations':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin']} pageName="Automation Engine">
            <AutomationHub />
          </ProtectedRoute>
        );
      case 'analytics':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin']} pageName="Platform Analytics">
            <AnalyticsView />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin']} pageName="Gym Tenant Settings">
            <SettingsView />
          </ProtectedRoute>
        );
      case 'subscription':
      case 'billing':
        return (
          <ProtectedRoute allowedRoles={['gym_owner', 'super_admin']} pageName="SaaS Subscription Management">
            <SaaSSubscriptionView />
          </ProtectedRoute>
        );
      case 'dashboard':
      case 'overview':
      default:
        return <GymOwnerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090B0A] text-white flex flex-col selection:bg-[#B6FF45] selection:text-[#090B0A]">
      {/* Interactive Role Switcher Banner */}
      <RoleSwitcher />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-64 h-full bg-[#090B0A]"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                isCollapsed={false}
                setIsCollapsed={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#090B0A]">
          <Topbar
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Suspended Gym Notice Banner */}
          {(currentGym?.planStatus === 'suspended' || (currentGym as any)?.status === 'suspended') && currentUser?.role !== 'super_admin' && (
            <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-200">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <div>
                  <span className="font-bold uppercase tracking-wider text-red-400 mr-2">Tenant Suspended:</span>
                  <span>
                    Operational and member management features for <strong>{currentGym.name}</strong> are locked.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActivePage('subscription')}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors shrink-0 uppercase tracking-wider self-start sm:self-auto"
              >
                Manage Subscription
              </button>
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Global Quick Action Modals */}
      <QuickQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />

      <GenerateQRModal />
      <SendNotificationModal />
      <AddMemberModal />
      <AddTrainerModal />
      <RecordPaymentModal />
      <UserProfileModal />
    </div>
  );
};
