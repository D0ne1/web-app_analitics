import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar: десктоп */}
      <Sidebar isMobile={false} />
      {/* Sidebar: мобильный, с оверлеем */}
      <Sidebar
        isMobile={true}
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onBurgerClick={() => setShowMobileMenu(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;