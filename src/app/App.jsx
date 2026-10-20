// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// App.jsx â€” Root of the Lucid application
//
// Responsibilities:
//   1. Wrap the app tree in global context providers, including notifications
//   2. Set up React Router with a shared Layout (Navbar + Footer where enabled)
//   3. Declare every route and protect authenticated-only routes
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import React, { useEffect, useState, lazy, Suspense } from 'react';

// React Router â€” BrowserRouter uses the HTML5 history API (clean URLs, no #hash).
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';

// Global notification system â€” wraps the whole app so any page can call
// useNotification() to show toast messages without prop drilling.
import { NotificationProvider, useNotification } from '../contexts/NotificationContext.jsx';
import { LocationProvider } from '../contexts/LocationContext.jsx';
import { ThemeProvider } from '../contexts/ThemeContext.jsx';
import { FavouritesProvider } from '../contexts/FavouritesContext.jsx';
import { WorkflowModeProvider, useWorkflowMode } from '../contexts/WorkflowModeContext.jsx';
// Shared Supabase client â€” used by ProtectedRoute for session/profile checks.
// Feature pages import the same singleton from ../services/supabaseClient directly.
import { supabase } from '../services/supabaseClient.js';

// â”€â”€â”€ Shared layout components â€” eagerly loaded; rendered where the shell is enabled â”€â”€
import Navbar from './layout/Navbar.jsx';
import Footer from './layout/Footer.jsx';
import ProfileSetupBanner from './layout/ProfileSetupBanner.jsx';
import WorkflowModeBanner from '../components/workflow/WorkflowModeBanner.jsx';
import { SignInRequiredModal } from '../components/shared/SignInRequiredModal.jsx';

// â”€â”€â”€ Admin Dashboard â€” statically imported (not route-level code-split) â”€â”€â”€â”€â”€â”€
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';

// â”€â”€â”€ Per-route loading skeletons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each lazy route element gets a Suspense boundary with a tailored fallback,
// so navigating to /signin doesn't briefly flash a home-shaped skeleton.
import {
  HomeSkeleton,
  AuthFormSkeleton,
  ServicesSkeleton,
  ProfileSkeleton,
  BookingsSkeleton,
  ContentPageSkeleton,
  DashboardSkeleton,
  NotificationsSkeleton,
} from './components/RouteSkeletons.jsx';


// â”€â”€â”€ Page-level code splitting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// lazy() defers route modules until they are needed; Vite may share dependencies
// across output chunks. AdminDashboard above is static, so it is part of the
// initial module graph. Other route modules are dynamically imported below.

// Public pages
const Home               = lazy(() => import('../pages/public/HomePage.jsx'));
const About              = lazy(() => import('../pages/public/AboutPage.jsx'));
const HelpSupport        = lazy(() => import('../pages/public/HelpSupportPage.jsx'));

// Auth & onboarding (Phase 1)
const Signup             = lazy(() => import('../pages/auth/SignUpPage.jsx'));
const Signin             = lazy(() => import('../pages/auth/SignInPage.jsx'));
// Services discovery (Phase 2)
const Service            = lazy(() => import('../pages/catalog/ServicesPage.jsx'));
const AllCategories      = lazy(() => import('../pages/catalog/AllCategoriesPage.jsx'));
const Category           = lazy(() => import('../pages/catalog/CategoryPage.jsx'));
const Selected_service   = lazy(() => import('../pages/catalog/ServiceDetailsPage.jsx'));

// Provider profile (Phase 3)
const UserProfile           = lazy(() => import('../pages/accounts/ProviderProfilePage.jsx'));
const EditProfile           = lazy(() => import('../pages/accounts/EditProfilePage.jsx'));
const ProviderProfileSetup  = lazy(() => import('../pages/accounts/ProviderProfileSetupPage.jsx'));

// Bookings (Phase 4)
// ClientBookings / ProviderBookings / ClientHistory / ProviderHistory are sub-components
// imported directly by BookingsPage and BookingHistoryPage â€” not lazy-loaded here.
const ManagedServiceRequest = lazy(() => import('../pages/cases/ManagedServiceRequestPage.jsx'));
const ManagedCases = lazy(() => import('../pages/cases/ManagedCasesPage.jsx'));
const ManagedCaseDetail = lazy(() => import('../pages/cases/ManagedCaseDetailPage.jsx'));
const ProviderWork = lazy(() => import('../pages/bookings/ProviderWorkPage.jsx'));
const MessagesPage = lazy(() => import('../pages/bookings/MessagesPage.jsx'));
const OperationsDashboard = lazy(() => import('../pages/operations/OperationsDashboard.jsx'));
const InspectorDashboard = lazy(() => import('../pages/inspections/InspectorDashboard.jsx'));
const InspectorProfile = lazy(() => import('../pages/inspections/InspectorProfilePage.jsx'));
const InspectorFinance = lazy(() => import('../pages/inspections/InspectorFinancePage.jsx'));
const AdminWorkflowHub = lazy(() => import('../pages/admin/AdminWorkflowHubPage.jsx'));
const ManagedWorkflowPreviewRoute = lazy(() => import('../dev/ManagedWorkflowPreviewRoute.jsx'));

// Dashboard and provider finance pages.
// Client/Provider dashboards are sub-components of DashboardPage and don't need their own routes.
const DashboardPage      = lazy(() => import('../pages/dashboard/DashboardPage.jsx'));
const EarningsPayments   = lazy(() => import('../pages/finance/EarningsPage.jsx'));
const TransactionsPage   = lazy(() => import('../pages/finance/TransactionsPage.jsx'));
const Favourites         = lazy(() => import('../pages/accounts/FavouritesPage.jsx'));
const ClientProfile = lazy(() => import('../pages/accounts/ClientProfilePage.jsx'));
// Account & settings pages.
// Client/Provider account overviews are sub-components of AccountPage.
const AccountPage          = lazy(() => import('../pages/accounts/AccountPage.jsx'));
const AccountSettings      = lazy(() => import('../pages/accounts/AccountSettingsPage.jsx'));
const NotificationsPage    = lazy(() => import('../pages/notifications/NotificationsPage.jsx'));
const NotificationSettings = lazy(() => import('../pages/notifications/NotificationSettingsPage.jsx'));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ProtectedRoute
//
// Wrap any <Route> element with this to require authentication.
// Optionally pass allowedRoles={['service_provider']} to also enforce role.
//
// Flow:
//   1. On mount, asks Supabase for the current session.
//   2. No session  â†’ show SignInRequiredModal (user picks Go home or Sign in)
//   3. Session + no role requirement â†’ render children
//   4. Session + role requirement â†’ fetch role from profiles table
//        Role matches â†’ render children
//        Role mismatch â†’ toast + redirect to /lucid/ (home)
//   5. While checking â†’ render nothing (null) to avoid flash of wrong content
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NO_REQUIRED_ROLES = Object.freeze([]);
const CLIENT_ONLY = Object.freeze(['client']);
const PROVIDER_ONLY = Object.freeze(['service_provider']);
const ADMIN_ONLY = Object.freeze(['admin']);
const OPERATIONS_STAFF = Object.freeze(['hr', 'operations_admin', 'super_admin']);
const INSPECTOR_ONLY = Object.freeze(['inspector']);
const INSPECTOR_PROFILE_ACCESS = Object.freeze(['inspector', ...OPERATIONS_STAFF]);

const previewRoleCanVisit = (pathname, role) => {
  if (pathname === '/lucid/admin/workflow') return role === 'admin';
  if (pathname === '/lucid/inspector/visits') return role === 'inspector';
  if (pathname === '/lucid/inspector/profile' || pathname === '/lucid/inspector/finance') return ['inspector', 'admin'].includes(role);
  if (pathname === '/lucid/cases') return role === 'client';
  if (pathname === '/lucid/provider/work' || pathname.startsWith('/lucid/provider/work/')) return role === 'provider';
  return false;
};

const ProtectedRoute = ({ children, allowedRoles = NO_REQUIRED_ROLES, staffRoles = NO_REQUIRED_ROLES }) => {
  // Status drives what gets rendered. Starts as 'loading' to block render
  // until the async session check resolves.
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'signin-required' | 'redirect-home'
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { mode, role, canEnablePreview } = useWorkflowMode();

  useEffect(() => {
    const check = async () => {
      // Step 1: check if there is an active Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No toast â€” the SignInRequiredModal handles the message instead.
        setStatus('signin-required');
        return;
      }

      // Preview personas may enter only the simulated workflow surfaces below.
      // This bypass is dev-only and never grants access in Live mode or to real
      // account, staff-management, or operations routes.
      if (mode === 'preview' && canEnablePreview && previewRoleCanVisit(location.pathname, role)) {
        setStatus('allowed');
        return;
      }

      // Routes without a role restriction accept any authenticated session.
      if (allowedRoles.length === 0 && staffRoles.length === 0) { setStatus('allowed'); return; }

      let roleAllowed = false;

      // Existing client/provider/admin routes use the profile role column.
      if (allowedRoles.length > 0) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          // HR and inspector identities may be staff-only accounts without a
          // marketplace profile row. Treat that as no marketplace role and
          // continue to the separately authorized staff-membership check.
          .maybeSingle();

        if (profileError) throw profileError;
        roleAllowed = !!profile && allowedRoles.includes(profile.role);
      }

      // LUCID staff access is separately provisioned; a profile role alone
      // must not grant access to operations, inspection, or finance data.
      if (!roleAllowed && staffRoles.length > 0) {
        const { data: memberships, error: membershipError } = await supabase
          .from('lucid_staff_memberships')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('is_active', true);

        if (membershipError) throw membershipError;
        roleAllowed = (memberships || []).some(item => staffRoles.includes(item.role));
      }

      if (roleAllowed) {
        setStatus('allowed');
      } else {
        const need = [...allowedRoles, ...staffRoles].join(' or ');
        showNotification(`This page is for ${need} accounts only.`, 'warning');
        setStatus('redirect-home');
      }
    };
    check().catch(error => {
      console.error('Protected route access check failed:', error);
      showNotification('We could not verify access to this page. Please try again.', 'error');
      setStatus('redirect-home');
    });
  }, [allowedRoles, staffRoles, showNotification, mode, role, canEnablePreview, location.pathname]);

  if (status === 'loading') return null;                                      // blank while checking
  if (status === 'signin-required') {
    // Show a confirm prompt instead of redirecting immediately, so users typing
    // a protected URL or following a stale link have a chance to bail out.
    // Preserve the requested route so a client can resume a service request.
    return (
      <SignInRequiredModal
        isOpen
        onCancel={() => navigate('/lucid/', { replace: true })}
        onConfirm={() => navigate('/lucid/signin', { replace: true, state: { from: location } })}
      />
    );
  }
  if (status === 'redirect-home') return <Navigate to="/lucid/" replace />;   // wrong role
  return children;                                                            // all checks passed
};


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Layout
//
// Wraps every page. Decides whether to show the shared Navbar and Footer.
//
// The exact and prefix lists below are the source of truth for hidden routes;
// a route may hide the shared shell without rendering its own navigation.
//
// Two hide lists:
//   hideNavAndFooterExact   â€” exact pathname matches (e.g. /lucid/dashboard)
//   hideNavAndFooterPrefix  â€” prefix matches (e.g. /lucid/providers/:id)
//
// To hide nav/footer on a new page: add its path to the appropriate list.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Helper: wraps a route element in Suspense with a tailored fallback.
// Lazy route modules suspend while loading; static route elements render immediately.
const withFallback = (element, Fallback) => (
  <Suspense fallback={React.createElement(Fallback)}>{element}</Suspense>
);

const ProfileEditRoute = () => {
  const { mode } = useWorkflowMode();
  if (mode === 'preview') return <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-[#0f1117]"><section className="mx-auto max-w-xl rounded-2xl bg-white p-7 dark:bg-[#1a1f2e]"><h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Profile editing is paused in Preview mode</h1><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">This page edits your real account profile. Switch to Live mode to make changes.</p><Link to="/lucid/account/profile" className="mt-5 inline-block font-semibold text-primary">Return to profile</Link></section></main>;
  return <EditProfile />;
};

function Layout({ children }) {
  const location = useLocation(); // current URL â€” re-evaluates on every navigation

  // Exact paths where the shared Navbar/Footer are hidden.
  const hideNavAndFooterExact = [
    '/lucid/dashboard',               // DashboardPage (Phase 5)
    '/lucid/earnings',                // EarningsPayments (Phase 5)
    '/lucid/transactions',            // TransactionsPage (Phase 5)
    '/lucid/favourites',              // Favourites (Phase 5)
    '/lucid/account',                 // AccountPage (Phase 6)
    '/lucid/account/settings',        // AccountSettings (Phase 6)
    '/lucid/notifications',           // NotificationsPage (Phase 6)
    '/lucid/notifications/settings',  // NotificationSettings (Phase 6)
    '/lucid/messages',                // Messages (Phase 7)
    '/lucid/preview',                 // Public preview app
    '/lucid/bookings',                // BookingsPage (Phase 4)
    '/lucid/bookings/history',        // BookingHistoryPage (Phase 4)
    '/lucid/bookings/confirmation',   // BookingConfirmation (Phase 4)
    '/lucid/cases',                   // Client's LUCID-managed request list
    '/lucid/account/profile',         // UserProfile (Phase 3)
    '/lucid/account/profile/edit',    // EditProfile (Phase 3)
    '/lucid/account/profile/setup',   // ProviderProfileSetup (Phase 3)
    '/lucid/help',                    // Help & Support (public, shell hidden)
    '/lucid/account/client-profile',  // ClientProfile
    '/lucid/admin',                   // Admin Dashboard
    '/lucid/staff/operations',        // LUCID operations queue
    '/lucid/inspector/visits',        // Inspector visit list
    '/lucid/preview',                  // Shared public workflow walkthrough
  ];

  // Prefix-based hide â€” catches full-screen dynamic routes. Provider-profile
  // and provider-specific booking paths now redirect to service discovery.
  const hideNavAndFooterPrefix = [
    '/lucid/providers/',      // Legacy provider IDs redirect to service discovery
    '/lucid/bookings/new/',   // BookingRequest â€” dynamic :providerId segment (Phase 4)
    '/lucid/bookings/request/', // Managed service request â€” category/service route
  ];

  const shouldHideLayout =
    hideNavAndFooterExact.includes(location.pathname) ||
    hideNavAndFooterPrefix.some(prefix => location.pathname.startsWith(prefix));

  return (
    <>
      {!shouldHideLayout && <Navbar />}   {/* shown wherever the shared shell is enabled */}
      <WorkflowModeBanner />
      <ProfileSetupBanner />              {/* renders for incomplete providers on eligible routes */}
      <main>{children}</main>             {/* landmark required for screen readers */}
      {!shouldHideLayout && <Footer />}   {/* shown wherever the shared shell is enabled */}
    </>
  );
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// App â€” root component
//
// Tree:
//   NotificationProvider         â€” global toast system (outermost, wraps everything)
//     Router (BrowserRouter)     â€” enables client-side routing
//       Layout                   â€” conditionally renders Navbar + Footer
//         Routes                 â€” matches current URL to a page component
//           Route ...            â€” each URL pattern mapped to a component
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function App() {
  return (
    // NotificationProvider must be outside Router so navbar and pages
    // can both call useNotification() for the same notification queue.
    <ThemeProvider>
    <NotificationProvider>
      <FavouritesProvider>
      <LocationProvider>
      {/* basename matches vite's production base ("/lucid-frontend"), so URLs    */}
      {/* like /lucid-frontend/lucid/bookings resolve to the /lucid/bookings route. */}
      {/* In dev (base "/lucid/") import.meta.env.PROD is false â†’ basename is "".   */}
      <Router basename={import.meta.env.PROD ? '/lucid-frontend' : ''}>
        {/* ScrollToTop resets scroll position on every route change */}
        <ScrollToTop />
        {/* Layout reads location from Router context â€” must be inside <Router> */}
        <WorkflowModeProvider>
        <Layout>
          <Routes>

            {/* â”€â”€ PUBLIC ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                No authentication needed. Anyone can reach these pages.      */}

            <Route path="/lucid/"              element={withFallback(<Home />, HomeSkeleton)} />
            {/* Landing page. Entry point for new visitors. */}

            <Route path="/lucid/signup"        element={withFallback(<Signup />, AuthFormSkeleton)} />
            {/* New user registration â€” both client and provider accounts. */}

            <Route path="/lucid/signin"        element={withFallback(<Signin />, AuthFormSkeleton)} />
            {/* Login. ProtectedRoute redirects here when session is missing. */}

            <Route path="/lucid/about"         element={withFallback(<About />, ContentPageSkeleton)} />
            {/* Static about page â€” company info, mission, team. */}

            <Route path="/lucid/help"          element={withFallback(<HelpSupport />, ContentPageSkeleton)} />
            {/* Help & support â€” FAQs, contact form. */}

            {/* Admin Dashboard - Only accessible by admin users */}
            <Route path="/lucid/admin/workflow" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} staffRoles={OPERATIONS_STAFF}>{withFallback(<AdminWorkflowHub />, DashboardSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/admin" element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                {withFallback(<AdminDashboard />, DashboardSkeleton)}
              </ProtectedRoute>
            } />

            <Route path="/lucid/staff/operations" element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY} staffRoles={OPERATIONS_STAFF}>
                {withFallback(<OperationsDashboard />, DashboardSkeleton)}
              </ProtectedRoute>
            } />

            <Route path="/lucid/preview" element={<ProtectedRoute>{withFallback(<ManagedWorkflowPreviewRoute />, DashboardSkeleton)}</ProtectedRoute>} />
            <Route path="/lucid/staff/workflow-preview" element={<Navigate to="/lucid/admin/workflow" replace />} />

            <Route path="/lucid/inspector/visits" element={
              <ProtectedRoute staffRoles={INSPECTOR_ONLY}>
                {withFallback(<InspectorDashboard />, DashboardSkeleton)}
              </ProtectedRoute>
            } />

            <Route path="/lucid/inspector/profile" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} staffRoles={INSPECTOR_PROFILE_ACCESS}>{withFallback(<InspectorProfile />, ProfileSkeleton)}</ProtectedRoute>} />
            <Route path="/lucid/inspector/finance" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} staffRoles={INSPECTOR_PROFILE_ACCESS}>{withFallback(<InspectorFinance />, DashboardSkeleton)}</ProtectedRoute>} />
            <Route path="/lucid/inspector/workflow-preview" element={<Navigate to="/lucid/inspector/visits" replace />} />

            <Route path="/lucid/become-provider" element={withFallback(<Signup />, AuthFormSkeleton)} />
            {/* Same sign-up page, different entry point from marketing CTAs.
                The Signup component can detect this path to pre-select "provider". */}

            {/* Client-only profile route. */}
             <Route path="/lucid/account/client-profile" element={
                <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                  {withFallback(<ClientProfile />, ProfileSkeleton)}
                </ProtectedRoute>
              } />
            {/* â”€â”€ SERVICES DISCOVERY (Phase 2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                /lucid/services/all is more specific than /lucid/services/:category.
                React Router ranks static segments above dynamic segments, so this
                declaration order is for readability rather than match precedence. */}

            <Route path="/lucid/search"                      element={withFallback(<Service />, ServicesSkeleton)} />
            {/* Alias for /lucid/services â€” the navbar search bar routes here.
                Service.jsx handles both paths identically. */}

            <Route path="/lucid/services"                    element={withFallback(<Service />, ServicesSkeleton)} />
            {/* Services landing page: hero search, popular services, featured categories. */}

            <Route path="/lucid/services/all"                element={withFallback(<AllCategories />, ServicesSkeleton)} />
            {/* Grid of all 10 categories. The static "all" route outranks :category. */}

            <Route path="/lucid/services/:category"          element={withFallback(<Category />, ServicesSkeleton)} />
            {/* :category = slug from categories.js, e.g. "home-repairs".
                category.jsx calls getCategoryBySlug(params.category) to find the data. */}

            <Route path="/lucid/services/:category/:service" element={withFallback(<Selected_service />, ServicesSkeleton)} />
            {/* :service = service slug within the category, e.g. "electrical-repairs".
                Selecting a service leads to the client-only LUCID intake. */}


            {/* â”€â”€ PROVIDER PROFILE (Phase 3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                Public â€” a client can view any provider's profile without logging in. */}

            <Route path="/lucid/providers/:id" element={<Navigate to="/lucid/services" replace />} />
            {/* Provider identities are private in the managed-service model. */}


            {/* â”€â”€ PROTECTED â€” ANY AUTHENTICATED USER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                ProtectedRoute checks the Supabase session. With no session it
                shows SignInRequiredModal; confirming there navigates to /lucid/signin.
                Routes here may still add a role restriction individually. */}

            {/* Phase 5 â€” Dashboard */}
            <Route path="/lucid/dashboard"
              element={<ProtectedRoute>{withFallback(<DashboardPage />, DashboardSkeleton)}</ProtectedRoute>} />
            {/* Role-aware: routes to client_dashboard or provider_dashboard based on profile.role. */}

            {/* Phase 6 â€” Account overview */}
            <Route path="/lucid/account"
              element={<ProtectedRoute>{withFallback(<AccountPage />, ProfileSkeleton)}</ProtectedRoute>} />
            {/* Role-aware hub: client_account_overview or provider_account_overview. */}

            {/* Phase 6 â€” Account settings */}
            <Route path="/lucid/account/settings"
              element={<ProtectedRoute>{withFallback(<AccountSettings />, AuthFormSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/account/profile"
              element={<ProtectedRoute>{withFallback(<UserProfile />, ProfileSkeleton)}</ProtectedRoute>} />
            {/* Authenticated profile view. The page redirects clients to their
                client-profile route; providers can edit via the linked route. */}

            <Route path="/lucid/account/profile/edit"
              element={<ProtectedRoute>{withFallback(<ProfileEditRoute />, ProfileSkeleton)}</ProtectedRoute>} />
            {/* Shared profile editor; on save it routes clients/providers to their own profile page. */}

            <Route path="/lucid/account/profile/setup"
              element={
                <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                  {withFallback(<ProviderProfileSetup />, ProfileSkeleton)}
                </ProtectedRoute>
              } />
            {/* Provider-only onboarding. Skip â†’ /lucid/. Save â†’ /lucid/account/profile. */}

            {/* â”€â”€ BOOKINGS (Phase 4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                Keep the booking routes grouped for readability. React Router
                ranks the more specific paths above the exact /bookings path. */}

            {/* LUCID-managed intake. This stores no provider ID and is client-only. */}
            <Route path="/lucid/bookings/request/:category/:service"
              element={
                <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                  {withFallback(<ManagedServiceRequest />, BookingsSkeleton)}
                </ProtectedRoute>
              } />

            <Route path="/lucid/cases"
              element={
                <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                  {withFallback(<ManagedCases />, BookingsSkeleton)}
                </ProtectedRoute>
              } />

            <Route path="/lucid/cases/:caseId" element={<ProtectedRoute>{withFallback(<ManagedCaseDetail />, BookingsSkeleton)}</ProtectedRoute>} />
            <Route path="/lucid/cases/preview" element={<Navigate to="/lucid/cases" replace />} />

            <Route path="/lucid/provider/work" element={<ProtectedRoute allowedRoles={PROVIDER_ONLY}>{withFallback(<ProviderWork />, BookingsSkeleton)}</ProtectedRoute>} />
            <Route path="/lucid/provider/work/:caseId" element={<ProtectedRoute allowedRoles={PROVIDER_ONLY}>{withFallback(<ManagedCaseDetail />, BookingsSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/bookings/new/:providerId" element={<Navigate to="/lucid/services" replace />} />
            {/* Legacy provider-specific booking URLs return to service discovery. */}

            <Route path="/lucid/bookings/confirmation" element={<Navigate to="/lucid/cases" replace />} />
            <Route path="/lucid/bookings/history" element={<Navigate to="/lucid/cases" replace />} />
            <Route path="/lucid/bookings" element={<Navigate to="/lucid/cases" replace />} />
            {/* Legacy marketplace booking pages are no longer client entry points. */}

            {/* Phase 5 â€” Favourites (client only) */}
            <Route path="/lucid/favourites"
              element={
                <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                  {withFallback(<Favourites />, ServicesSkeleton)}
                </ProtectedRoute>
              } />

            {/* Phase 7 â€” Messaging */}
            <Route path="/lucid/messages" element={<ProtectedRoute>{withFallback(<MessagesPage />, BookingsSkeleton)}</ProtectedRoute>} />

            {/* Phase 6 â€” Notifications */}
            <Route path="/lucid/notifications"
              element={<ProtectedRoute>{withFallback(<NotificationsPage />, BookingsSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/notifications/settings"
              element={<ProtectedRoute>{withFallback(<NotificationSettings />, AuthFormSkeleton)}</ProtectedRoute>} />


            {/* â”€â”€ PROTECTED â€” SERVICE_PROVIDER ONLY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                ProtectedRoute checks session AND role.
                Clients hitting this route are bounced to /lucid/ with a toast. */}

            {/* Phase 5 â€” Earnings (provider only) */}
            <Route path="/lucid/earnings"
              element={
                <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                  {withFallback(<EarningsPayments />, DashboardSkeleton)}
                </ProtectedRoute>
              } />

            {/* Phase 5 â€” Transactions (provider only) */}
            <Route path="/lucid/transactions"
              element={
                <ProtectedRoute>
                  {withFallback(<TransactionsPage />, BookingsSkeleton)}
                </ProtectedRoute>
              } />


            {/* â”€â”€ CATCH-ALL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                Any URL not matched above redirects to the home page.
                Prevents blank "not found" screens on mistyped URLs. */}

            <Route path="*" element={<Navigate to="/lucid/" replace />} />

          </Routes>
        </Layout>
        </WorkflowModeProvider>
      </Router>
      </LocationProvider>
      </FavouritesProvider>
    </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
