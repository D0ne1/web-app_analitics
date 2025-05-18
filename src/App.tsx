//import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import DishesPage from './pages/dishes/DishesPage';
import WaitersPage from './pages/waiters/WaitersPage';
import OrdersPage from './pages/orders/orderspage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import UploadPage from './pages/uploads/UploadPage';
import SettingsPage from './pages/settings/SettingsPage';




function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dishes" element={<DishesPage />} />
            <Route path="/waiters" element={<WaitersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/uploads" element={<UploadPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
          </Route>
          
          {/* Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;