// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root of the Lucid application
//
// Responsibilities:
//   1. Wrap the whole app in NotificationProvider (global toast/alert system)
//   2. Set up React Router with a shared Layout (Navbar + Footer)
//   3. Declare every route and protect authenticated-only routes
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, lazy, Suspense } from 'react';

// React Router — BrowserRouter uses the HTML5 history API (clean URLs, no #hash).
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Global notification system — wraps the whole app so any page can call
// useNotification() to show toast messages without prop drilling.
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { LocationProvider } from './contexts/LocationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavouritesProvider } from './contexts/FavouritesContext';
import NotificationsPage from './pages/NotificationsPage.jsx';
// Supabase client — used here only in ProtectedRoute to check the session.
// Pages import it directly from this same file when they need auth operations.
import { supabase } from './lib/supabaseClient';

// ─── Shared layout components — eagerly loaded (present on every page) ────────
import Navbar from "./components/navbar";
import Footer from './components/footer';
import ProfileSetupBanner from './components/ProfileSetupBanner.jsx';
import { SignInRequiredModal } from './components/shared';

// ─── Per-route loading skeletons ──────────────────────────────────────────────
// Each lazy route gets its own Suspense boundary with a tailored fallback,
// so navigating to /signin doesn't briefly flash a home-shaped skeleton.
import {
  HomeSkeleton,
  AuthFormSkeleton,
  ServicesSkeleton,
  ProfileSkeleton,
  BookingsSkeleton,
  ContentPageSkeleton,
  DashboardSkeleton,
  MessagesListSkeleton,
  ChatSkeleton,
} from './components/route_skeletons.jsx';

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ClientProfile from './pages/client_profile.jsx';

// ─── Page-level code splitting ────────────────────────────────────────────────
// Each lazy() call creates a separate chunk. Vite only downloads a chunk when
// the user first navigates to that route — the home page visit doesn't pull in
// dashboard, messaging, or booking code.

// Public pages
const Home               = lazy(() => import('./pages/home.jsx'));
const About              = lazy(() => import('./pages/about.jsx'));
const HelpSupport        = lazy(() => import('./pages/help_support.jsx'));

// Auth & onboarding (Phase 1)
const Signup             = lazy(() => import('./pages/sign_up.jsx'));
const Signin             = lazy(() => import('./pages/sign_in.jsx'));
// Services discovery (Phase 2)
const Service            = lazy(() => import('./pages/Services.jsx'));
const AllCategories      = lazy(() => import('./pages/AllCategories.jsx'));
const Category           = lazy(() => import('./pages/category.jsx'));
const Selected_service   = lazy(() => import('./pages/selected_service.jsx'));

// Provider profile (Phase 3)
const GeneralProfile        = lazy(() => import('./pages/general_profilePage.jsx'));
const UserProfile           = lazy(() => import('./pages/user_Profile.jsx'));
const EditProfile           = lazy(() => import('./pages/edit.jsx'));
const ProviderProfileSetup  = lazy(() => import('./pages/provider_profile_setup.jsx'));

// Bookings (Phase 4)
// ClientBookings / ProviderBookings / ClientHistory / ProviderHistory are sub-components
// imported directly by BookingsPage and BookingHistoryPage — not lazy-loaded here.
const BookingsPage        = lazy(() => import('./pages/BookingsPage.jsx'));
const BookingHistoryPage  = lazy(() => import('./pages/BookingHistoryPage.jsx'));
const BookingRequest      = lazy(() => import('./pages/booking_request.jsx'));
const BookingConfirmation = lazy(() => import('./pages/booking_confirmation.jsx'));

// Dashboard (Phase 5) — page files are gitignored; uncomment-in-place for local prod nav.
// Client/Provider dashboards are sub-components of DashboardPage and don't need their own routes.
const DashboardPage      = lazy(() => import('./pages/DashboardPage.jsx'));
const EarningsPayments   = lazy(() => import('./pages/earnings.jsx'));
const TransactionsPage   = lazy(() => import('./pages/transactions.jsx'));
const Favourites         = lazy(() => import('./pages/favourites.jsx'));

// Account & settings (Phase 6) — gitignored, see note above.
// Client/Provider account overviews are sub-components of AccountPage.
const AccountPage          = lazy(() => import('./pages/AccountPage.jsx'));
const AccountSettings      = lazy(() => import('./pages/user_info.jsx'));
const NotificationsPage    = lazy(() => import('./pages/notification_page.jsx'));
const NotificationSettings = lazy(() => import('./pages/notificationSettings.jsx'));

// Messaging (Phase 7) — gitignored, see note above.
const MessagesListPage  = lazy(() => import('./pages/messagelist.jsx'));
const ChatMessagingPage = lazy(() => import('./pages/messaging.jsx'));



// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Wrap any <Route> element with this to require authentication.
// Optionally pass allowedRoles={['service_provider']} to also enforce role.
//
// Flow:
//   1. On mount, asks Supabase for the current session.
//   2. No session  → show SignInRequiredModal (user picks Go home or Sign in)
//   3. Session + no role requirement → render children
//   4. Session + role requirement → fetch role from profiles table
//        Role matches → render children
//        Role mismatch → toast + redirect to /lucid/ (home)
//   5. While checking → render nothing (null) to avoid flash of wrong content
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Status drives what gets rendered. Starts as 'loading' to block render
  // until the async session check resolves.
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'signin-required' | 'redirect-home'
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const check = async () => {
      // Step 1: check if there is an active Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No toast — the SignInRequiredModal handles the message instead.
        setStatus('signin-required');
        return;
      }

      // Step 2: if no role restriction, allow any authenticated user through
      if (allowedRoles.length === 0) { setStatus('allowed'); return; }

      // Step 3: role check — fetch the user's role from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')           // only fetch the role column, not the whole row
        .eq('id', session.user.id)
        .single();

      if (profile && allowedRoles.includes(profile.role)) {
        setStatus('allowed');
      } else {
        // Authenticated but wrong role — toast and bounce (no modal needed since
        // they're already signed in; there's nothing to confirm).
        const need = allowedRoles.join(' or ');
        showNotification(`This page is for ${need} accounts only.`, 'warning');
        setStatus('redirect-home');
      }
    };
    check();
  }, []); // runs once on mount — re-run not needed since navigation remounts the route

  if (status === 'loading') return null;                                      // blank while checking
  if (status === 'signin-required') {
    // Show a confirm prompt instead of redirecting immediately, so users typing
    // a protected URL or following a stale link have a chance to bail out.
    return (
      <SignInRequiredModal
        isOpen
        onCancel={() => navigate('/lucid/', { replace: true })}
        onConfirm={() => navigate('/lucid/signin', { replace: true })}
      />
    );
  }
  if (status === 'redirect-home') return <Navigate to="/lucid/" replace />;   // wrong role
  return children;                                                            // all checks passed
};


// ─────────────────────────────────────────────────────────────────────────────
// Layout
//
// Wraps every page. Decides whether to show the shared Navbar and Footer.
//
// Dashboard, account, booking, and messaging pages have their own full-screen
// layouts (they manage their own headers/navigation) so the global Navbar and
// Footer would duplicate controls and break the design.
//
// Two hide lists:
//   hideNavAndFooterExact   — exact pathname matches (e.g. /lucid/dashboard)
//   hideNavAndFooterPrefix  — prefix matches (e.g. /lucid/messages/123)
//
// To hide nav/footer on a new page: add its path to the appropriate list.
// ─────────────────────────────────────────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Helper: wraps a lazy page in its own Suspense boundary with a tailored fallback.
// This is what stops the home-shaped skeleton from flashing on every route.
const withFallback = (element, Fallback) => (
  <Suspense fallback={<Fallback />}>{element}</Suspense>
);

function Layout({ children }) {
  const location = useLocation(); // current URL — re-evaluates on every navigation

  // Pages that manage their own full-screen layout (no shared Navbar/Footer)
  const hideNavAndFooterExact = [
    '/lucid/dashboard',               // DashboardPage (Phase 5)
    '/lucid/earnings',                // EarningsPayments (Phase 5)
    '/lucid/transactions',            // TransactionsPage (Phase 5)
    '/lucid/favourites',              // Favourites (Phase 5)
    '/lucid/account',                 // AccountPage (Phase 6)
    '/lucid/account/settings',        // AccountSettings (Phase 6)
    '/lucid/notifications',           // NotificationsPage (Phase 6)
    '/lucid/notifications/settings',  // NotificationSettings (Phase 6)
    '/lucid/messages',                // MessagesListPage (Phase 7)
    '/lucid/bookings',                // BookingsPage (Phase 4)
    '/lucid/bookings/history',        // BookingHistoryPage (Phase 4)
    '/lucid/bookings/confirmation',   // BookingConfirmation (Phase 4)
    '/lucid/account/profile',         // UserProfile (Phase 3)
    '/lucid/account/profile/edit',    // EditProfile (Phase 3)
    '/lucid/account/profile/setup',   // ProviderProfileSetup (Phase 3)
    '/lucid/help',                    // Help & Support (public)
    '/lucid/admin',                   // Admin Dashboard (Phase 8)
  ];

  // Prefix-based hide — catches dynamic segments like /lucid/messages/:id
  // Note: /lucid/providers/:id keeps the navbar — it's a public page where users
  // benefit from being able to search/browse without losing context.
  const hideNavAndFooterPrefix = [
    '/lucid/bookings/new/',   // BookingRequest — dynamic :providerId segment (Phase 4)
    '/lucid/messages/',       // individual chat threads (Phase 7)
  ];

  const shouldHideLayout =
    hideNavAndFooterExact.includes(location.pathname) ||
    hideNavAndFooterPrefix.some(prefix => location.pathname.startsWith(prefix));

  return (
    <>
      {!shouldHideLayout && <Navbar />}   {/* shown on public pages only */}
      <ProfileSetupBanner />              {/* visible sitewide until provider completes setup */}
      <main>{children}</main>             {/* landmark required for screen readers */}
      {!shouldHideLayout && <Footer />}   {/* shown on public pages only */}
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// App — root component
//
// Tree:
//   NotificationProvider         — global toast system (outermost, wraps everything)
//     Router (BrowserRouter)     — enables client-side routing
//       Layout                   — conditionally renders Navbar + Footer
//         Routes                 — matches current URL to a page component
//           Route ...            — each URL pattern mapped to a component
// ─────────────────────────────────────────────────────────────────────────────
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
      {/* In dev (base "/lucid/") import.meta.env.PROD is false → basename is "".   */}
      <Router basename={import.meta.env.PROD ? '/lucid-frontend' : ''}>
        {/* ScrollToTop resets scroll position on every route change */}
        <ScrollToTop />
        {/* Layout reads location from Router context — must be inside <Router> */}
        <Layout>
          <Routes>

            {/* ── PUBLIC ROUTES ─────────────────────────────────────────────
                No authentication needed. Anyone can reach these pages.      */}

            <Route path="/lucid/"              element={withFallback(<Home />, HomeSkeleton)} />
            {/* Landing page. Entry point for new visitors. */}

            <Route path="/lucid/signup"        element={withFallback(<Signup />, AuthFormSkeleton)} />
            {/* New user registration — both client and provider accounts. */}

            <Route path="/lucid/signin"        element={withFallback(<Signin />, AuthFormSkeleton)} />
            {/* Login. ProtectedRoute redirects here when session is missing. */}

            <Route path="/lucid/about"         element={withFallback(<About />, ContentPageSkeleton)} />
            {/* Static about page — company info, mission, team. */}

            <Route path="/lucid/help"          element={withFallback(<HelpSupport />, ContentPageSkeleton)} />
            {/* Help & support — FAQs, contact form. */}

            {/* Admin Dashboard - Only accessible by admin users */}
            <Route path="/lucid/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/lucid/become-provider" element={withFallback(<Signup />, AuthFormSkeleton)} />
            {/* Same sign-up page, different entry point from marketing CTAs.
                The Signup component can detect this path to pre-select "provider". */}

            <Route path="/lucid/account/client-profile" element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientProfile />
                </ProtectedRoute>
              } />
            {/* ── SERVICES DISCOVERY (Phase 2) ──────────────────────────────
                ⚠️  Route ORDER matters in this block.
                /lucid/services/all MUST be declared before /lucid/services/:category.
                React Router matches top-to-bottom — if /:category comes first,
                "all" is treated as a category slug and AllCategories never renders. */}

            <Route path="/lucid/search"                      element={withFallback(<Service />, ServicesSkeleton)} />
            {/* Alias for /lucid/services — the navbar search bar routes here.
                Service.jsx handles both paths identically. */}

            <Route path="/lucid/services"                    element={withFallback(<Service />, ServicesSkeleton)} />
            {/* Services landing page: hero search, popular services, featured categories. */}

            <Route path="/lucid/services/all"                element={withFallback(<AllCategories />, ServicesSkeleton)} />
            {/* Grid of all 10 categories. "all" is a literal — must be before /:category. */}

            <Route path="/lucid/services/:category"          element={withFallback(<Category />, ServicesSkeleton)} />
            {/* :category = slug from categories.js, e.g. "home-repairs".
                category.jsx calls getCategoryBySlug(params.category) to find the data. */}

            <Route path="/lucid/services/:category/:service" element={withFallback(<Selected_service />, ServicesSkeleton)} />
            {/* :service = service slug within the category, e.g. "electrical-repairs".
                Provider cards here link to /lucid/providers/:id (Phase 3). */}


            {/* ── PROVIDER PROFILE (Phase 3) ────────────────────────────────
                Public — a client can view any provider's profile without logging in. */}

            <Route path="/lucid/providers/:id"               element={withFallback(<GeneralProfile />, ProfileSkeleton)} />
            {/* Public provider profile. :id is the provider's Supabase user ID.
                selected_service.jsx links here after the user picks a provider. */}


            {/* ── PROTECTED — ANY AUTHENTICATED USER ────────────────────────
                ProtectedRoute checks Supabase session. Redirects to /lucid/signin
                if the user is not logged in. No role restriction on this group.  */}

            {/* Phase 5 — Dashboard */}
            <Route path="/lucid/dashboard"
              element={<ProtectedRoute>{withFallback(<DashboardPage />, DashboardSkeleton)}</ProtectedRoute>} />
            {/* Role-aware: routes to client_dashboard or provider_dashboard based on profile.role. */}

            {/* Phase 6 — Account overview */}
            <Route path="/lucid/account"
              element={<ProtectedRoute>{withFallback(<AccountPage />, ProfileSkeleton)}</ProtectedRoute>} />
            {/* Role-aware hub: client_account_overview or provider_account_overview. */}

            {/* Phase 6 — Account settings */}
            <Route path="/lucid/account/settings"
              element={<ProtectedRoute>{withFallback(<AccountSettings />, AuthFormSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/account/profile"
              element={<ProtectedRoute>{withFallback(<UserProfile />, ProfileSkeleton)}</ProtectedRoute>} />
            {/* Provider's own profile view (what they see, not what clients see).
                Edit button links to /lucid/account/profile/edit. */}

            <Route path="/lucid/account/profile/edit"
              element={<ProtectedRoute>{withFallback(<EditProfile />, ProfileSkeleton)}</ProtectedRoute>} />
            {/* Provider edits their profile. On save, navigates to /lucid/account/profile. */}

            <Route path="/lucid/account/profile/setup"
              element={<ProtectedRoute>{withFallback(<ProviderProfileSetup />, ProfileSkeleton)}</ProtectedRoute>} />
            {/* Post-signup onboarding step for providers. Skip → /lucid/. Save → /lucid/account/profile. */}

            {/* ── BOOKINGS (Phase 4) ────────────────────────────────────
                Order matters: /bookings/new, /bookings/confirmation,
                and /bookings/history must come before /bookings so
                they are not shadowed by the parent route.            */}

            <Route path="/lucid/bookings/new/:providerId"
              element={<ProtectedRoute>{withFallback(<BookingRequest />, BookingsSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/bookings/confirmation"
              element={<ProtectedRoute>{withFallback(<BookingConfirmation />, BookingsSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/bookings/history"
              element={<ProtectedRoute>{withFallback(<BookingHistoryPage />, BookingsSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/bookings"
              element={<ProtectedRoute>{withFallback(<BookingsPage />, BookingsSkeleton)}</ProtectedRoute>} />

            {/* Phase 5 — Favourites (client only) */}
            <Route path="/lucid/favourites"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  {withFallback(<Favourites />, ServicesSkeleton)}
                </ProtectedRoute>
              } />

            {/* Phase 7 — Messaging */}
            <Route path="/lucid/messages"
              element={<ProtectedRoute>{withFallback(<MessagesListPage />, MessagesListSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/messages/:id"
              element={<ProtectedRoute>{withFallback(<ChatMessagingPage />, ChatSkeleton)}</ProtectedRoute>} />

            {/* Phase 6 — Notifications */}
            <Route path="/lucid/notifications"
              element={<ProtectedRoute>{withFallback(<NotificationsPage />, BookingsSkeleton)}</ProtectedRoute>} />

            <Route path="/lucid/notifications/settings"
              element={<ProtectedRoute>{withFallback(<NotificationSettings />, AuthFormSkeleton)}</ProtectedRoute>} />


            {/* ── PROTECTED — SERVICE_PROVIDER ONLY ─────────────────────────
                ProtectedRoute checks session AND role.
                Clients hitting this route are bounced to /lucid/ with a toast. */}

            {/* Phase 5 — Earnings (provider only) */}
            <Route path="/lucid/earnings"
              element={
                <ProtectedRoute allowedRoles={['service_provider']}>
                  {withFallback(<EarningsPayments />, DashboardSkeleton)}
                </ProtectedRoute>
              } />

            {/* Phase 5 — Transactions (provider only) */}
            <Route path="/lucid/transactions"
              element={
                <ProtectedRoute allowedRoles={['service_provider']}>
                  {withFallback(<TransactionsPage />, BookingsSkeleton)}
                </ProtectedRoute>
              } />


            {/* ── CATCH-ALL ─────────────────────────────────────────────────
                Any URL not matched above redirects to the home page.
                Prevents blank "not found" screens on mistyped URLs. */}

            <Route path="*" element={<Navigate to="/lucid/" replace />} />

          </Routes>
        </Layout>
      </Router>
      </LocationProvider>
      </FavouritesProvider>
    </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;