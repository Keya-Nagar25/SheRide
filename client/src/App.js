// src/App.js
// The router - decides which page to show based on the URL

import React from 'react';
// ADD this line with the other driver imports

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Auth pages
import Login from './pages/Login';
import RegisterPassenger from './pages/RegisterPassenger';
import RegisterDriver from './pages/RegisterDriver';

// Passenger pages
import PassengerHome from './pages/passenger/Home';
import PassengerBook from './pages/passenger/Book';
import PassengerTrack from './pages/passenger/Track';
import PassengerHistory from './pages/passenger/History';
import PassengerProfile from './pages/passenger/Profile';

// Driver pages
import DriverDashboard from './pages/driver/Dashboard';
import DriverVerify from './pages/driver/Verify';
import DriverEarnings from './pages/driver/Earnings';
import DriverHistory from './pages/driver/History';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminDrivers from './pages/admin/Drivers';
import AdminUsers from './pages/admin/Users';
import AdminRides from './pages/admin/Rides';

// ---- Protected Route: only logged-in users of the right role ----
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

// ---- Smart redirect based on role after login ----
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'driver') return <Navigate to="/driver" replace />;
  return <Navigate to="/passenger" replace />;
};

const AppRoutes = () => (
  <SocketProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register/passenger" element={<RegisterPassenger />} />
      <Route path="/register/driver" element={<RegisterDriver />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Passenger routes */}
      <Route path="/passenger" element={
        <ProtectedRoute roles={['passenger']}>
          <PassengerHome />
        </ProtectedRoute>
      } />
      <Route path="/passenger/book" element={
        <ProtectedRoute roles={['passenger']}><PassengerBook /></ProtectedRoute>
      } />
      <Route path="/passenger/track/:rideId" element={
        <ProtectedRoute roles={['passenger']}><PassengerTrack /></ProtectedRoute>
      } />
      <Route path="/passenger/history" element={
        <ProtectedRoute roles={['passenger']}><PassengerHistory /></ProtectedRoute>
      } />
      <Route path="/passenger/profile" element={
        <ProtectedRoute roles={['passenger']}><PassengerProfile /></ProtectedRoute>
      } />

      {/* Driver routes */}
      <Route path="/driver" element={
        <ProtectedRoute roles={['driver']}><DriverDashboard /></ProtectedRoute>
      } />
      <Route path="/driver/verify" element={
        <ProtectedRoute roles={['driver']}><DriverVerify /></ProtectedRoute>
      } />
      <Route path="/driver/earnings" element={
        <ProtectedRoute roles={['driver']}><DriverEarnings /></ProtectedRoute>
      } />
      <Route path="/driver/history" element={
        <ProtectedRoute roles={['driver']}><DriverHistory /></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/drivers" element={
        <ProtectedRoute roles={['admin']}><AdminDrivers /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>
      } />
      <Route path="/admin/rides" element={
        <ProtectedRoute roles={['admin']}><AdminRides /></ProtectedRoute>
      } />
    </Routes>
  </SocketProvider>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
