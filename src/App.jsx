// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Lucid frontend (Phases 1 + 3)
//
// Phase 1 — Public shell: Home, Sign In, Sign Up, Navbar, Footer
// Phase 3 — Provider profile flow: public profile view, provider's own profile,
//            edit profile, and the post-signup profile setup onboarding
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { NotificationProvider } from './contexts/NotificationContext';
import { supabase }             from './lib/supabaseClient';

// ─── Shared layout ────────────────────────────────────────────────────────────
import Navbar  from './components/navbar';
import Footer  from './components/footer';

// ─── Phase 1 — Public pages ───────────────────────────────────────────────────
import Home        from './pages/home.jsx';         // /lucid/
import About       from './pages/about.jsx';        // /lucid/about
import HelpSupport from './pages/help_support.jsx'; // /lucid/help
import Signup      from './pages/sign_up.jsx';      // /lucid/signup  +  /lucid/become-provider
import Signin      from './pages/sign_in.jsx';      // /lucid/signin

// ─── Phase 3 — Provider profile flow ─────────────────────────────────────────
import GeneralProfile      from './pages/general_profilePage.jsx';    // /lucid/providers/:id          (public)
import UserProfile         from './pages/user_Profile.jsx';           // /lucid/account/profile        (protected)
import EditProfile         from './pages/edit.jsx';                   // /lucid/account/profile/edit   (protected)
import ProviderProfileSetup from './pages/provider_profile_setup.jsx'; // /lucid/account/profile/setup  (protected, post-signup)
import ProfileSetupBanner  from './components/ProfileSetupBanner.jsx'; // sitewide nudge until setup is done


// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — gates any route behind a valid Supabase session.
// Optionally restricts by role: allowedRoles={['service_provider']}
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [status, setStatus] = useState('loading');
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

      setStatus(profile && allowedRoles.includes(profile.role) ? 'allowed' : 'redirect-home');
    };
    check();
  }, []);

  if (status === 'loading')          return null;
  if (status === 'redirect-signin')  return <Navigate to="/lucid/signin" replace />;
  if (status === 'redirect-home')    return <Navigate to="/lucid/"       replace />;
  return children;
};


// ─────────────────────────────────────────────────────────────────────────────
// ScrollToTop — resets scroll position on every route change
// ─────────────────────────────────────────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}


// ─────────────────────────────────────────────────────────────────────────────
// Layout — conditionally shows Navbar + Footer.
// Phase 3 profile pages manage their own headers so the global nav is hidden.
// ─────────────────────────────────────────────────────────────────────────────
function Layout({ children }) {
  const location = useLocation();

  const hideNavAndFooter = [
    '/lucid/account/profile',        // UserProfile — provider's own view
    '/lucid/account/profile/edit',   // EditProfile
    '/lucid/account/profile/setup',  // ProviderProfileSetup — post-signup onboarding
    '/lucid/help',                   // HelpSupport — full-screen layout
  ];

  const shouldHide = hideNavAndFooter.includes(location.pathname);

  return (
    <>
      {!shouldHide && <Navbar />}
      <ProfileSetupBanner />   {/* visible on every page until provider completes setup */}
      {children}
      {!shouldHide && <Footer />}
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <NotificationProvider>
        <Router>
          <ScrollToTop />
          <Layout>
            <Routes>

              {/* ── Phase 1 — Public shell ───────────────────────────────── */}

              <Route path="/lucid/"              element={<Home />} />
              <Route path="/lucid/about"         element={<About />} />
              <Route path="/lucid/help"          element={<HelpSupport />} />
              <Route path="/lucid/signup"        element={<Signup />} />
              <Route path="/lucid/become-provider" element={<Signup />} />
              <Route path="/lucid/signin"        element={<Signin />} />



              {/* ── Phase 3 — Provider profile ───────────────────────────
                  /lucid/providers/:id is public — no login needed.
                  The three /account/profile routes are protected.        */}

              <Route path="/lucid/providers/:id" element={<GeneralProfile />} />

              <Route path="/lucid/account/profile"
                element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

              <Route path="/lucid/account/profile/edit"
                element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

              <Route path="/lucid/account/profile/setup"
                element={<ProtectedRoute><ProviderProfileSetup /></ProtectedRoute>} />


              {/* ── Catch-all ────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/lucid/" replace />} />

            </Routes>
          </Layout>
        </Router>
    </NotificationProvider>
  );
}

export default App;
