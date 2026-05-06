import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { supabase } from './lib/supabaseClient';
import Navbar from "./components/navbar";
import Footer from './components/footer';
import Home from './pages/home.jsx';
import Signup from './pages/sign_up.jsx';
import Signin from './pages/sign_in.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Fetch user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setUserRole(profile?.role);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/lucid/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/lucid/" replace />;
  }

  return children;
};

function Layout({ children }) {
  const location = useLocation();
  const hideNavAndFooter = [
    // Add paths where you don't want navbar/footer
  ];
  const shouldHideLayout = hideNavAndFooter.includes(location.pathname);

  return (
    <>
      {!shouldHideLayout && <Navbar />}
      {children}
      {!shouldHideLayout && <Footer />}
    </>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/lucid/" element={<Home />} />
            <Route path="/lucid/signup" element={<Signup />} />
            <Route path="/lucid/signin" element={<Signin />} />
            
            {/* Protected Routes - Client only */}
            <Route path="/lucid/dashboard" element={
              <ProtectedRoute allowedRoles={['client']}>
                <div>Client Dashboard (Coming Soon)</div>
              </ProtectedRoute>
            } />
            
            {/* Protected Routes - Service Provider only */}
            <Route path="/lucid/provider-dashboard" element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <div>Provider Dashboard (Coming Soon)</div>
              </ProtectedRoute>
            } />
            
            <Route path="/lucid/profile" element={
              <ProtectedRoute>
                <div>User Profile (Coming Soon)</div>
              </ProtectedRoute>
            } />
            
            <Route path="/lucid/services" element={
              <div>Services Page (Coming Soon)</div>
            } />
            
            <Route path="/lucid/all-services" element={
              <div>All Services (Coming Soon)</div>
            } />
            
            <Route path="/lucid/search" element={
              <div>Search Results (Coming Soon)</div>
            } />
            
            <Route path="/lucid/messages" element={
              <ProtectedRoute>
                <div>Messages (Coming Soon)</div>
              </ProtectedRoute>
            } />
            
            <Route path="/lucid/notifications" element={
              <ProtectedRoute>
                <div>Notifications (Coming Soon)</div>
              </ProtectedRoute>
            } />
            
            <Route path="/lucid/become-provider" element={
              <div>Become a Provider (Coming Soon)</div>
            } />
            
            <Route path="/lucid/about" element={
              <div>About Us (Coming Soon)</div>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/lucid/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;