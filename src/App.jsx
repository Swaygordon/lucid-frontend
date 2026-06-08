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
import { NotificationProvider } from './contexts/NotificationContext';
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

// Dashboard (Phase 5) — not in scope yet
// const ClientDashboard    = lazy(() => import('./pages/client_dashboard.jsx'));
// const ProviderDashboard  = lazy(() => import('./pages/provider_dashboard.jsx'));
// const DashboardPage      = lazy(() => import('./pages/DashboardPage.jsx'));
// const EarningsPayments   = lazy(() => import('./pages/earnings.jsx'));
// const TransactionsPage   = lazy(() => import('./pages/transactions.jsx'));
// const Favourites         = lazy(() => import('./pages/favourites.jsx'));

// Account & settings (Phase 6) — not in scope yet
// const ClientAccountOverview   = lazy(() => import('./pages/client_account_overview.jsx'));
// const ProviderAccountOverview = lazy(() => import('./pages/provider_account_overview.jsx'));
// const AccountPage             = lazy(() => import('./pages/AccountPage.jsx'));
// const AccountSettings         = lazy(() => import('./pages/user_info.jsx'));
// const NotificationsPage       = lazy(() => import('./pages/notification_page.jsx'));
// const NotificationSettings    = lazy(() => import('./pages/notificationSettings.jsx'));

// Messaging (Phase 7) — not in scope yet
// const MessagesListPage  = lazy(() => import('./pages/messagelist.jsx'));
// const ChatMessagingPage = lazy(() => import('./pages/messaging.jsx'));



// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Wrap any <Route> element with this to require authentication.
// Optionally pass allowedRoles={['service_provider']} to also enforce role.
//
// Flow:
//   1. On mount, asks Supabase for the current session.
//   2. No session  → redirect to /lucid/signin
//   3. Session + no role requirement → render children
//   4. Session + role requirement → fetch role from profiles table
//        Role matches → render children
//        Role mismatch → redirect to /lucid/ (home)
//   5. While checking → render nothing (null) to avoid flash of wrong content
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Status drives what gets rendered. Starts as 'loading' to block render
  // until the async session check resolves.
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'redirect-signin' | 'redirect-home'
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      // Step 1: check if there is an active Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus('redirect-signin'); return; }

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
        setStatus('redirect-home'); // authenticated but wrong role
      }
    };
    check();
  }, []); // runs once on mount — re-run not needed since navigation remounts the route

  if (status === 'loading') return null;                                      // blank while checking
  if (status === 'redirect-signin') return <Navigate to="/lucid/signin" replace />; // not logged in
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

// Page-level skeleton shown while a lazy route chunk is loading.
// Fills the viewport so the Footer doesn't pull up to the top on first paint.
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] animate-pulse">
      {/* Hero — mimics the home hero height and content layout */}
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center">
        {/* CyclingBadge */}
        <div className="h-9 w-48 bg-gray-200 dark:bg-[#252b3b] rounded-full mb-6" />
        {/* Heading — two lines */}
        <div className="h-10 sm:h-12 w-3/4 max-w-lg bg-gray-200 dark:bg-[#252b3b] rounded-lg mb-3" />
        <div className="h-10 sm:h-12 w-1/2 max-w-xs bg-gray-200 dark:bg-[#252b3b] rounded-lg mb-6" />
        {/* Paragraph */}
        <div className="h-4 w-full max-w-md bg-gray-200 dark:bg-[#252b3b] rounded mb-2" />
        <div className="h-4 w-3/4 max-w-sm bg-gray-200 dark:bg-[#252b3b] rounded mb-8" />
        {/* Search bar */}
        <div className="w-full max-w-2xl h-12 bg-gray-200 dark:bg-[#252b3b] rounded-xl mb-14" />
        {/* Category icons row */}
        <div className="flex justify-center gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-[#252b3b]" />
              <div className="w-12 h-3 rounded bg-gray-200 dark:bg-[#252b3b]" />
            </div>
          ))}
        </div>
      </div>
      {/* ProviderCTA / section stand-in */}
      <div className="bg-gray-50 dark:bg-[#1a1f2e] px-4 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-[#252b3b] rounded" />
            <div className="h-4 w-full bg-gray-200 dark:bg-[#252b3b] rounded" />
            <div className="h-4 w-4/5 bg-gray-200 dark:bg-[#252b3b] rounded" />
            <div className="h-10 w-36 bg-gray-200 dark:bg-[#252b3b] rounded-lg mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-[#252b3b] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation(); // current URL — re-evaluates on every navigation

  // Pages that manage their own full-screen layout (no shared Navbar/Footer)
  const hideNavAndFooterExact = [
    // '/lucid/account',                 // AccountPage (Phase 6)
    // '/lucid/notifications',           // NotificationsPage (Phase 6)
    // '/lucid/dashboard',               // DashboardPage (Phase 5)
    '/lucid/bookings',                // BookingsPage (Phase 4)
    '/lucid/bookings/history',        // BookingHistoryPage (Phase 4)
    '/lucid/bookings/confirmation',   // BookingConfirmation (Phase 4)
    // '/lucid/bookings/new',         // BookingRequest — now a prefix route, handled below
    // '/lucid/notifications/settings',  // NotificationSettings (Phase 6)
    // '/lucid/earnings',                // EarningsPayments (Phase 5)
    // '/lucid/transactions',            // TransactionsPage (Phase 5)
    // '/lucid/messages',                // MessagesListPage (Phase 7)
    '/lucid/account/profile',         // UserProfile (Phase 3)
    '/lucid/account/profile/edit',    // EditProfile (Phase 3)
    '/lucid/account/profile/setup',   // ProviderProfileSetup (Phase 3)
    '/lucid/help',                    // Help & Support (public)
    '/lucid/admin',                   // Admin Dashboard
    // '/lucid/account/settings',        // AccountSettings (Phase 6)
    // '/lucid/favourites',              // Favourites (Phase 5)
  ];

  // Prefix-based hide — catches dynamic segments like /lucid/providers/:id
  const hideNavAndFooterPrefix = [
    '/lucid/providers/',      // GeneralProfile — any provider UUID or "me" (Phase 3)
    '/lucid/bookings/new/',   // BookingRequest — dynamic :providerId segment (Phase 4)
    // '/lucid/messages/', // individual chat threads (Phase 7)
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
      <Router>
        {/* ScrollToTop resets scroll position on every route change */}
        <ScrollToTop />
        {/* Layout reads location from Router context — must be inside <Router> */}
        <Layout>
          <Suspense fallback={<PageSkeleton />}>
          <Routes>

            {/* ── PUBLIC ROUTES ─────────────────────────────────────────────
                No authentication needed. Anyone can reach these pages.      */}

            <Route path="/lucid/"              element={<Home />} />
            {/* Landing page. Entry point for new visitors. */}

            <Route path="/lucid/signup"        element={<Signup />} />
            {/* New user registration — both client and provider accounts. */}

            <Route path="/lucid/signin"        element={<Signin />} />
            {/* Login. ProtectedRoute redirects here when session is missing. */}

            <Route path="/lucid/about"         element={<About />} />
            {/* Static about page — company info, mission, team. */}

            <Route path="/lucid/help"          element={<HelpSupport />} />
            {/* Help & support — FAQs, contact form. */}

            {/* Admin Dashboard - Only accessible by admin users */}
            <Route path="/lucid/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/lucid/become-provider" element={<Signup />} />
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

            <Route path="/lucid/search"                      element={<Service />} />
            {/* Alias for /lucid/services — the navbar search bar routes here.
                Service.jsx handles both paths identically. */}

            <Route path="/lucid/services"                    element={<Service />} />
            {/* Services landing page: hero search, popular services, featured categories. */}

            <Route path="/lucid/services/all"                element={<AllCategories />} />
            {/* Grid of all 10 categories. "all" is a literal — must be before /:category. */}

            <Route path="/lucid/services/:category"          element={<Category />} />
            {/* :category = slug from categories.js, e.g. "home-repairs".
                category.jsx calls getCategoryBySlug(params.category) to find the data. */}

            <Route path="/lucid/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />
            <Route path="/lucid/services/:category/:service" element={<Selected_service />} />
            {/* :service = service slug within the category, e.g. "electrical-repairs".
                Provider cards here link to /lucid/providers/:id (Phase 3). */}


            {/* ── PROVIDER PROFILE (Phase 3) ────────────────────────────────
                Public — a client can view any provider's profile without logging in. */}

            <Route path="/lucid/providers/:id"               element={<GeneralProfile />} />
            {/* Public provider profile. :id is the provider's Supabase user ID.
                selected_service.jsx links here after the user picks a provider. */}


            {/* ── PROTECTED — ANY AUTHENTICATED USER ────────────────────────
                ProtectedRoute checks Supabase session. Redirects to /lucid/signin
                if the user is not logged in. No role restriction on this group.  */}

            {/* Phase 5 — Dashboard (not in scope yet) */}
            {/* <Route path="/lucid/dashboard"
              element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /> */}

            {/* Phase 6 — Account overview (not in scope yet) */}
            {/* <Route path="/lucid/account"
              element={<ProtectedRoute><AccountPage /></ProtectedRoute>} /> */}

            {/* Phase 6 — Account settings (not in scope yet) */}
            {/* <Route path="/lucid/account/settings"
              element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} /> */}

            <Route path="/lucid/account/profile"
              element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            {/* Provider's own profile view (what they see, not what clients see).
                Edit button links to /lucid/account/profile/edit. */}

            <Route path="/lucid/account/profile/edit"
              element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            {/* Provider edits their profile. On save, navigates to /lucid/dashboard. */}

            <Route path="/lucid/account/profile/setup"
              element={<ProtectedRoute><ProviderProfileSetup /></ProtectedRoute>} />
            {/* Post-signup onboarding step for providers. Back → /lucid/. Save → /lucid/dashboard. */}

            {/* ── BOOKINGS (Phase 4) ────────────────────────────────────
                Order matters: /bookings/new, /bookings/confirmation,
                and /bookings/history must come before /bookings so
                they are not shadowed by the parent route.            */}

            <Route path="/lucid/bookings/new/:providerId"
              element={<ProtectedRoute><BookingRequest /></ProtectedRoute>} />

            <Route path="/lucid/bookings/confirmation"
              element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />

            <Route path="/lucid/bookings/history"
              element={<ProtectedRoute><BookingHistoryPage /></ProtectedRoute>} />

            <Route path="/lucid/bookings"
              element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />

            {/* Phase 5 — Favourites (not in scope yet) */}
            {/* <Route path="/lucid/favourites"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <Favourites />
                </ProtectedRoute>
              } /> */}

            {/* Phase 7 — Messaging (not in scope yet) */}
            {/* <Route path="/lucid/messages"
              element={<ProtectedRoute><MessagesListPage /></ProtectedRoute>} /> */}

            {/* <Route path="/lucid/messages/:id"
              element={<ProtectedRoute><ChatMessagingPage /></ProtectedRoute>} /> */}

            {/* Phase 6 — Notifications (not in scope yet) */}
            {/* <Route path="/lucid/notifications"
              element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} /> */}

            {/* <Route path="/lucid/notifications/settings"
              element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} /> */}


            {/* ── PROTECTED — SERVICE_PROVIDER ONLY ─────────────────────────
                ProtectedRoute checks session AND role.
                Clients hitting this route are redirected to /lucid/ (home). */}

            {/* Phase 5 — Earnings (not in scope yet) */}
            {/* <Route path="/lucid/earnings"
              element={
                <ProtectedRoute allowedRoles={['service_provider']}>
                  <EarningsPayments />
                </ProtectedRoute>
              } /> */}

            {/* Phase 5 — Transactions (not in scope yet) */}
            {/* <Route path="/lucid/transactions"
              element={
                <ProtectedRoute allowedRoles={['service_provider']}>
                  <TransactionsPage />
                </ProtectedRoute>
              } /> */}


            {/* ── CATCH-ALL ─────────────────────────────────────────────────
                Any URL not matched above redirects to the home page.
                Prevents blank "not found" screens on mistyped URLs. */}

            <Route path="*" element={<Navigate to="/lucid/" replace />} />

          </Routes>
          </Suspense>
        </Layout>
      </Router>
      </LocationProvider>
      </FavouritesProvider>
    </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;