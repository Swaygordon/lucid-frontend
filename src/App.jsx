// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Phases 1 + 2
//
// State of the app after Phase 1 (Foundation) and Phase 2 (Services Discovery)
// are integrated. 
//
// What's active here:
//   • Buddy's work  — Home, Sign In, Sign Up, Navbar, Footer
//   • Phase 1       — NotificationProvider, ProtectedRoute stub, Layout
//   • Phase 2       — Services, AllCategories, Category, SelectedService
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';

// React Router — BrowserRouter uses the HTML5 history API (clean URLs, no #hash).
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Phase 1 — Global notification system.
// Wraps the whole app so any page can call useNotification() without prop drilling.
import { NotificationProvider } from './contexts/NotificationContext';

// Supabase client — already set this up.
// ProtectedRoute uses it here; pages import it directly when they need auth operations.
import { supabase } from './lib/supabaseClient';

// ─── already integrated ───────────────────────────────────────
import Navbar from "./components/navbar";          // shared top nav
import Footer from './components/footer';          // shared footer
import Home from './pages/home.jsx';               // /lucid/
import Signup from './pages/sign_up.jsx';          // /lucid/signup
import Signin from './pages/sign_in.jsx';          // /lucid/signin

// ─── Phase 2 — Services discovery ────────────────────────────────────────────
// All public routes. No login required to browse.
import Service from './pages/Services.jsx';                    // /lucid/services  +  /lucid/search
import AllCategories from './pages/AllCategories.jsx';         // /lucid/services/all
import Category from './pages/category.jsx';                   // /lucid/services/:category
import Selected_service from './pages/selected_service.jsx';   // /lucid/services/:category/:service


// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Not used yet in phases 1–2 (all current routes are public).
// Already wired here so future phases can wrap routes without touching this file.
//
// Usage:  <ProtectedRoute>          — any logged-in user
//         <ProtectedRoute allowedRoles={['service_provider']}> — role-restricted
//
// Flow:
//   1. Checks Supabase session on mount.
//   2. No session        → redirect to /lucid/signin
//   3. No role required  → render children
//   4. Role required     → fetch role from profiles table
//        matches         → render children
//        mismatch        → redirect to /lucid/ (home)
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'redirect-signin' | 'redirect-home'
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus('redirect-signin'); return; }
      if (allowedRoles.length === 0) { setStatus('allowed'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile && allowedRoles.includes(profile.role)) {
        setStatus('allowed');
      } else {
        setStatus('redirect-home');
      }
    };
    check();
  }, []);

  if (status === 'loading') return null;
  if (status === 'redirect-signin') return <Navigate to="/lucid/signin" replace />;
  if (status === 'redirect-home') return <Navigate to="/lucid/" replace />;
  return children;
};


// ─────────────────────────────────────────────────────────────────────────────
// Layout
//
// Wraps every page. Shows Navbar + Footer on public pages.
// Dashboard/account/booking pages manage their own headers so they're hidden there.
//
// ⬇ ADD to hideNavAndFooterExact as each phase brings in full-screen pages:
//   Phase 5: '/lucid/dashboard'
//   Phase 6: '/lucid/account', '/lucid/account/settings', '/lucid/notifications', etc.
//   Phase 4: '/lucid/bookings', '/lucid/bookings/history', '/lucid/bookings/new', etc.
//   Phase 7: '/lucid/messages'
// ─────────────────────────────────────────────────────────────────────────────
function Layout({ children }) {
  const location = useLocation();

  // Full-screen pages that manage their own layout — hide the global Navbar/Footer.
  // Currently empty: all Phase 1 + 2 pages are public and use the shared nav.
  const hideNavAndFooterExact = [
    // Phase 3 will add: '/lucid/account/profile', '/lucid/account/profile/edit'
    // Phase 4 will add: '/lucid/bookings', '/lucid/bookings/history', '/lucid/bookings/new', '/lucid/bookings/confirmation'
    // Phase 5 will add: '/lucid/dashboard', '/lucid/earnings'
    // Phase 6 will add: '/lucid/account', '/lucid/account/settings', '/lucid/notifications', '/lucid/notifications/settings'
    // Phase 7 will add: '/lucid/messages'
  ];

  // Prefix-based hide — catches dynamic segments like /lucid/messages/abc123.
  const hideNavAndFooterPrefix = [
    // Phase 7 will add: '/lucid/messages/'
  ];

  const shouldHideLayout =
    hideNavAndFooterExact.includes(location.pathname) ||
    hideNavAndFooterPrefix.some(prefix => location.pathname.startsWith(prefix));

  return (
    <>
      {!shouldHideLayout && <Navbar />}
      {children}
      {!shouldHideLayout && <Footer />}
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// App
//
// Component tree:
//   NotificationProvider  — global toast/alert system
//     Router              — client-side routing (HTML5 history)
//       Layout            — conditionally renders Navbar + Footer
//         Routes          — matches URL to page component
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>

            {/* ── BUDDY'S WORK — already integrated ────────────────────── */}

            <Route path="/lucid/"              element={<Home />} />
            {/* Landing page. */}

            <Route path="/lucid/signup"        element={<Signup />} />
            {/* New user registration. */}

            <Route path="/lucid/signin"        element={<Signin />} />
            {/* Login. ProtectedRoute redirects here when session is missing. */}

            <Route path="/lucid/become-provider" element={<Signup />} />
            {/* Reuses sign-up — entry point from marketing CTAs. */}


            {/* ── PHASE 2 — SERVICES DISCOVERY ─────────────────────────────
                ⚠️  Route ORDER matters here.
                /lucid/services/all MUST come before /lucid/services/:category.
                React Router matches top-to-bottom — if /:category is first,
                "all" is treated as a category slug and AllCategories never renders. */}

            <Route path="/lucid/search"                      element={<Service />} />
            {/* Alias — navbar search bar navigates here. Same component as /services. */}

            <Route path="/lucid/services"                    element={<Service />} />
            {/* Services landing: hero search, popular services, featured categories. */}

            <Route path="/lucid/services/all"                element={<AllCategories />} />
            {/* Grid of all 10 categories. Literal "all" — must be before /:category. */}

            <Route path="/lucid/services/:category"          element={<Category />} />
            {/* :category = slug from categories.js (e.g. "home-repairs").
                category.jsx calls getCategoryBySlug(params.category) to look it up. */}

            <Route path="/lucid/services/:category/:service" element={<Selected_service />} />
            {/* :service = service slug within the category (e.g. "electrical-repairs").
                Provider cards link to /lucid/providers/:id — added in Phase 3. */}


            {/* ── CATCH-ALL ─────────────────────────────────────────────── */}

            <Route path="*" element={<Navigate to="/lucid/" replace />} />
            {/* Any unmatched URL → home. Prevents blank screens on bad links. */}

          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;
