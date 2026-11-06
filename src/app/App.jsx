// Application route map and authenticated entry point. Supabase protects workspace actions.
// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root of the Lucid application
//
// Responsibilities:
//   1. Wrap the app tree in global context providers, including notifications
//   2. Set up React Router with a shared Layout (Navbar + Footer where enabled)
//   3. Declare every route and protect authenticated-only routes
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, lazy, Suspense } from "react";

// React Router — BrowserRouter uses the HTML5 history API (clean URLs, no #hash).
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// Global notification system — wraps the whole app so any page can call
// useNotification() to show toast messages without prop drilling.
import { NotificationProvider } from "../contexts/NotificationContext.jsx";
import { LocationProvider } from "../contexts/LocationContext.jsx";
import { ThemeProvider } from "../contexts/ThemeContext.jsx";
import {
  WorkflowModeProvider,
  useWorkflowMode,
} from "../contexts/WorkflowModeContext.jsx";

// ─── Shared layout components — eagerly loaded; rendered where the shell is enabled ──
import Navbar from "./layout/Navbar.jsx";
import Footer from "./layout/Footer.jsx";
import ProfileSetupBanner from "./layout/ProfileSetupBanner.jsx";
import CancellationFeeRecoveryBanner from "./layout/CancellationFeeRecoveryBanner.jsx";
import AccountSetupGate from "./layout/AccountSetupGate.jsx";
import WorkspaceShell from "./layout/WorkspaceShell.jsx";

// ─── Admin Dashboard — statically imported (not route-level code-split) ──────

// ─── Per-route loading skeletons ──────────────────────────────────────────────
// Each lazy route element gets a Suspense boundary with a tailored fallback,
// so navigating to /signin doesn't briefly flash a home-shaped skeleton.
import {
  HomeSkeleton,
  ServicesSkeleton,
  ContentPageSkeleton,
  NotificationsSkeleton,
  AuthPageSkeleton,
  AllCategoriesPageSkeleton,
  CategoryPageSkeleton,
  ServiceDetailPageSkeleton,
  WorkspaceOverviewSkeleton,
  AdminWorkbenchSkeleton,
  AdminRecordsSkeleton,
  FinancePageSkeleton,
  RequestQueueSkeleton,
  CaseDetailSkeleton,
  RequestFormSkeleton,
  AccountProfilePageSkeleton,
  ProfileEditorPageSkeleton,
  AccountSettingsPageSkeleton,
  NotificationSettingsPageSkeleton,
  TransactionsPageSkeleton,
  ChatSkeleton,
} from "./components/RouteSkeletons.jsx";

// ─── Page-level code splitting ────────────────────────────────────────────────
// lazy() defers route modules until they are needed; Vite may share dependencies
// across output chunks. Route modules are dynamically imported below.

// Public pages
const Home = lazy(() => import("../pages/public/HomePage.jsx"));
const About = lazy(() => import("../pages/public/AboutPage.jsx"));
const HelpSupport = lazy(() => import("../pages/public/HelpSupportPage.jsx"));

// Authentication and onboarding
const Signup = lazy(() => import("../pages/auth/SignUpPage.jsx"));
const Signin = lazy(() => import("../pages/auth/SignInPage.jsx"));
// Service discovery
const Service = lazy(() => import("../pages/catalog/ServicesPage.jsx"));
const AllCategories = lazy(
  () => import("../pages/catalog/AllCategoriesPage.jsx"),
);
const Category = lazy(() => import("../pages/catalog/CategoryPage.jsx"));
const Selected_service = lazy(
  () => import("../pages/catalog/ServiceDetailsPage.jsx"),
);

// Account profiles and settings
const AccountSetup = lazy(
  () => import("../pages/accounts/AccountSetupPage.jsx"),
);
const AccountProfile = lazy(
  () => import("../pages/accounts/AccountProfilePage.jsx"),
);
const AccountSettings = lazy(
  () => import("../pages/accounts/AccountSettingsPage.jsx"),
);

// Requests and managed cases
// ClientBookings / ProviderBookings / ClientHistory / ProviderHistory are sub-components
// imported directly by BookingsPage and BookingHistoryPage — not lazy-loaded here.
const ManagedServiceRequest = lazy(
  () => import("../pages/cases/ManagedServiceRequestPage.jsx"),
);
const ClientRequestAccountPrompt = lazy(
  () => import("../pages/cases/ClientRequestAccountPrompt.jsx"),
);
const ManagedCases = lazy(() => import("../pages/cases/ManagedCasesPage.jsx"));
const ManagedCaseDetail = lazy(
  () => import("../pages/cases/ManagedCaseDetailPage.jsx"),
);
const ProviderWork = lazy(
  () => import("../pages/bookings/ProviderWorkPage.jsx"),
);
const MessagesPage = lazy(() => import("../pages/bookings/MessagesPage.jsx"));
const InspectorDashboard = lazy(
  () => import("../pages/inspections/InspectorDashboard.jsx"),
);
const InspectorProfile = lazy(
  () => import("../pages/inspections/InspectorProfilePage.jsx"),
);
const InspectorFinance = lazy(
  () => import("../pages/inspections/InspectorFinancePage.jsx"),
);
const AdminWorkflowHub = lazy(
  () => import("../pages/admin/AdminWorkflowHubPage.jsx"),
);
const AdminFinancialRecords = lazy(
  () => import("../pages/admin/AdminFinancialRecordsPage.jsx"),
);

// Dashboard and provider finance pages.
// Client/Provider dashboards are sub-components of DashboardPage and don't need their own routes.
const DashboardPage = lazy(
  () => import("../pages/dashboard/DashboardPage.jsx"),
);
const EarningsPayments = lazy(
  () => import("../pages/finance/EarningsPage.jsx"),
);
const TransactionsPage = lazy(
  () => import("../pages/finance/TransactionsPage.jsx"),
);
// Account & settings pages.
const NotificationsPage = lazy(
  () => import("../pages/notifications/NotificationsPage.jsx"),
);
const NotificationSettingsPage = lazy(
  () => import("../pages/notifications/NotificationSettingsPage.jsx"),
);

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Wrap any <Route> element with this to require authentication.
// Optionally pass allowedRoles={['service_provider']} to also enforce role.
//
// Client-side checks guide navigation. Supabase RLS and RPC authorization are authoritative.
const NO_REQUIRED_ROLES = Object.freeze([]);
const CLIENT_ONLY = Object.freeze(["client"]);
const PROVIDER_ONLY = Object.freeze(["service_provider"]);
const ADMIN_ONLY = Object.freeze(["admin"]);
const OPERATIONS_STAFF = Object.freeze([
  "hr",
  "operations_admin",
  "super_admin",
]);
const INSPECTOR_ONLY = Object.freeze(["inspector"]);
const INSPECTOR_PROFILE_ACCESS = Object.freeze([
  "inspector",
  ...OPERATIONS_STAFF,
]);

const ProtectedRoute = ({
  children,
  allowedRoles = NO_REQUIRED_ROLES,
  staffRoles = NO_REQUIRED_ROLES,
}) => {
  const location = useLocation();
  const { user, role, authLoading } = useWorkflowMode();
  if (authLoading) {
    return (
      <main
        role="status"
        className="min-h-[45vh] px-4 py-16 text-center text-sm text-gray-600"
      >
        Checking your account...
      </main>
    );
  }
  if (!user)
    return <Navigate to="/lucid/signin" replace state={{ from: location }} />;
  const roleMap = {
    client: ["client"],
    provider: ["service_provider", "provider"],
    inspector: ["inspector"],
    admin: ["admin", "hr", "operations_admin", "super_admin"],
  };
  const permitted =
    (allowedRoles.length === 0 && staffRoles.length === 0) ||
    [...allowedRoles, ...staffRoles].some((required) =>
      roleMap[role]?.includes(required),
    );
  if (!permitted) return <Navigate to="/lucid/dashboard" replace />;
  return <AccountSetupGate>{children}</AccountSetupGate>;
};

const AccountSetupRoute = () => {
  const { role } = useWorkflowMode();
  if (role === "inspector")
    return <Navigate to="/lucid/inspector/profile" replace />;
  if (role === "admin") return <Navigate to="/lucid/admin/workflow" replace />;
  return <AccountSetup />;
};

const ClientRequestRoute = () => {
  const { user, role } = useWorkflowMode();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/lucid/signin" replace state={{ from: location }} />;
  }
  if (role === "client") {
    return withFallback(<ManagedServiceRequest />, RequestFormSkeleton);
  }
  if (role === "provider" || role === "inspector") {
    return withFallback(<ClientRequestAccountPrompt />, RequestFormSkeleton);
  }
  return <Navigate to="/lucid/dashboard" replace />;
};
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Helper: wraps a route element in Suspense with a tailored fallback.
// Lazy route modules suspend while loading; static route elements render immediately.
const withFallback = (element, Fallback) => (
  <Suspense fallback={React.createElement(Fallback)}>{element}</Suspense>
);

function Layout({ children }) {
  const location = useLocation();
  const { user } = useWorkflowMode();
  const workspacePrefixes = [
    "/lucid/dashboard",
    "/lucid/cases",
    "/lucid/provider",
    "/lucid/client",
    "/lucid/messages",
    "/lucid/notifications",
    "/lucid/account",
    "/lucid/earnings",
    "/lucid/transactions",
    "/lucid/inspector",
    "/lucid/admin",
    "/lucid/staff/operations",
    "/lucid/bookings",
  ];
  const isWorkspaceRoute =
    Boolean(user) &&
    workspacePrefixes.some(
      (prefix) =>
        location.pathname === prefix ||
        location.pathname.startsWith(`${prefix}/`),
    );
  if (isWorkspaceRoute) return <WorkspaceShell>{children}</WorkspaceShell>;

  // Exact paths where the shared Navbar/Footer are hidden.
  const hideNavAndFooterExact = [
    "/lucid/dashboard", // DashboardPage
    "/lucid/earnings", // EarningsPayments
    "/lucid/transactions", // TransactionsPage
    "/lucid/favourites", // Favourites
    "/lucid/account", // AccountPage
    "/lucid/account/settings", // AccountSettings
    "/lucid/notifications", // NotificationsPage
    "/lucid/notifications/settings", // NotificationSettings
    "/lucid/messages", // Messages
    "/lucid/bookings", // BookingsPage
    "/lucid/bookings/history", // BookingHistoryPage
    "/lucid/bookings/confirmation", // BookingConfirmation
    "/lucid/cases", // Client's LUCID-managed request list
    "/lucid/account/profile", // UserProfile
    "/lucid/account/profile/edit", // EditProfile
    "/lucid/account/profile/setup", // ProviderProfileSetup
    "/lucid/help", // Help & Support (public, shell hidden)
    "/lucid/account/client-profile", // ClientProfile
    "/lucid/admin", // Admin Dashboard
    "/lucid/staff/operations", // LUCID operations queue
    "/lucid/inspector/visits", // Inspector visit list
    "/lucid/signin", // Sign-in page (public, shell hidden)
    "/lucid/signup", // Sign-up page (public, shell hidden)
  ];

  // Prefix-based hide — catches full-screen dynamic routes. Provider-profile
  // and provider-specific booking paths now redirect to service discovery.
  const hideNavAndFooterPrefix = [
    "/lucid/providers/", // Legacy provider IDs redirect to service discovery
    "/lucid/bookings/new/", // BookingRequest — dynamic :providerId segment
    "/lucid/bookings/request/", // Managed service request — category/service route
  ];

  const isAuthRoute = ["/lucid/signin", "/lucid/signup"].includes(
    location.pathname,
  );

  const shouldHideLayout =
    hideNavAndFooterExact.includes(location.pathname) ||
    hideNavAndFooterPrefix.some((prefix) =>
      location.pathname.startsWith(prefix),
    );

  return (
    <>
      {!shouldHideLayout && <Navbar />}{" "}
      {/* shown wherever the shared shell is enabled */}
      {!isAuthRoute && <ProfileSetupBanner />}{" "}
      {!isAuthRoute && <CancellationFeeRecoveryBanner />}
      {/* renders for incomplete providers on eligible routes */}
      <main>{children}</main> {/* landmark required for screen readers */}
      {!shouldHideLayout && <Footer />}{" "}
      {/* shown wherever the shared shell is enabled */}
    </>
  );
}
// Root application: global providers, router, layout, and route definitions.

function App() {
  return (
    // NotificationProvider must be outside Router so navbar and pages
    // can both call useNotification() for the same notification queue.
    <ThemeProvider>
      <NotificationProvider>
        {/* basename matches vite's production base ("/lucid-frontend"), so URLs    */}
          {/* like /lucid-frontend/lucid/bookings resolve to the /lucid/bookings route. */}
          {/* In dev (base "/lucid/") import.meta.env.PROD is false → basename is "".   */}
        <Router basename={import.meta.env.PROD ? "/lucid-frontend" : ""}>
          {/* ScrollToTop resets scroll position on every route change */}
          <ScrollToTop />
          {/* Layout reads location from Router context — must be inside <Router> */}
          <WorkflowModeProvider>
            <LocationProvider>
              <Layout>
                <Routes>
                  {/* Public routes are available without authentication. */}
                  <Route
                    path="/lucid/"
                    element={withFallback(<Home />, HomeSkeleton)}
                  />
                  {/* Landing page. Entry point for new visitors. */}

                  <Route
                    path="/lucid/signup"
                    element={withFallback(<Signup />, AuthPageSkeleton)}
                  />
                  {/* New user registration — both client and provider accounts. */}

                  <Route
                    path="/lucid/signin"
                    element={withFallback(<Signin />, AuthPageSkeleton)}
                  />
                  {/* Login. ProtectedRoute redirects here when session is missing. */}

                  <Route
                    path="/lucid/about"
                    element={withFallback(<About />, ContentPageSkeleton)}
                  />
                  {/* Static about page — company info, mission, team. */}

                  <Route
                    path="/lucid/help"
                    element={withFallback(<HelpSupport />, ContentPageSkeleton)}
                  />
                  {/* Help & support — FAQs, contact form. */}

                  {/* Admin Dashboard - Only accessible by admin users */}
                  <Route
                    path="/lucid/admin/workflow"
                    element={
                      <ProtectedRoute
                        allowedRoles={ADMIN_ONLY}
                        staffRoles={OPERATIONS_STAFF}
                      >
                        {withFallback(<AdminWorkflowHub />, AdminWorkbenchSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/admin/records"
                    element={
                      <ProtectedRoute
                        allowedRoles={ADMIN_ONLY}
                        staffRoles={OPERATIONS_STAFF}
                      >
                        {withFallback(<AdminFinancialRecords />, AdminRecordsSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/admin"
                    element={
                      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                        {withFallback(<AdminWorkflowHub />, AdminWorkbenchSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/staff/operations"
                    element={
                      <ProtectedRoute
                        allowedRoles={ADMIN_ONLY}
                        staffRoles={OPERATIONS_STAFF}
                      >
                        {withFallback(<AdminWorkflowHub />, AdminWorkbenchSkeleton)}
                      </ProtectedRoute>
                    }
                  />


                  <Route
                    path="/lucid/inspector/visits"
                    element={
                      <ProtectedRoute staffRoles={INSPECTOR_ONLY}>
                        {withFallback(
                          <InspectorDashboard />,
                          WorkspaceOverviewSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/inspector/profile"
                    element={
                      <ProtectedRoute
                        allowedRoles={ADMIN_ONLY}
                        staffRoles={INSPECTOR_PROFILE_ACCESS}
                      >
                        {withFallback(<InspectorProfile />, ProfileEditorPageSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/client/profile/setup"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        {withFallback(<AccountSetup />, ProfileEditorPageSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/inspector/finance"
                    element={
                      <ProtectedRoute
                        allowedRoles={ADMIN_ONLY}
                        staffRoles={INSPECTOR_PROFILE_ACCESS}
                      >
                        {withFallback(<InspectorFinance />, FinancePageSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/become-provider"
                    element={withFallback(<Signup />, AuthPageSkeleton)}
                  />
                  {/* Same sign-up page, different entry point from marketing CTAs.
                The Signup component can detect this path to pre-select "provider". */}

                  {/* Client-only profile route. */}
                  <Route
                    path="/lucid/account/client-profile"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        {withFallback(
                          <AccountProfile />,
                          AccountProfilePageSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />
                  {/* Service discovery routes. */}

                  <Route
                    path="/lucid/search"
                    element={withFallback(<Service />, ServicesSkeleton)}
                  />
                  {/* Alias for /lucid/services — the navbar search bar routes here.
                Service.jsx handles both paths identically. */}

                  <Route
                    path="/lucid/services"
                    element={withFallback(<Service />, ServicesSkeleton)}
                  />
                  {/* Services landing page: hero search, popular services, featured categories. */}

                  <Route
                    path="/lucid/services/all"
                    element={withFallback(<AllCategories />, AllCategoriesPageSkeleton)}
                  />
                  {/* Grid of the four launch categories. The static "all" route outranks :category. */}

                  <Route
                    path="/lucid/services/:category"
                    element={withFallback(<Category />, CategoryPageSkeleton)}
                  />
                  {/* :category = slug from categories.js, e.g. "home-repairs".
                category.jsx calls getCategoryBySlug(params.category) to find the data. */}

                  <Route
                    path="/lucid/services/:category/:service"
                    element={withFallback(
                      <Selected_service />,
                      ServiceDetailPageSkeleton,
                    )}
                  />
                  {/* :service = service slug within the category, e.g. "electrical-repairs".

                  {/* Provider identities are private in the managed-service model. */}
                  <Route
                    path="/lucid/providers/:id"
                    element={<Navigate to="/lucid/services" replace />}
                  />
                  {/* Provider identities are private in the managed-service model. */}

                  {/* ── PROTECTED — ANY AUTHENTICATED USER ────────────────────────

                  {/* Dashboard */}
                  <Route
                    path="/lucid/dashboard"
                    element={
                      <ProtectedRoute>
                        {withFallback(<DashboardPage />, WorkspaceOverviewSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  {/* Role-aware: routes to client_dashboard or provider_dashboard based on profile.role. */}

                  {/* Account overview */}
                  <Route
                    path="/lucid/account"
                    element={
                      <ProtectedRoute>
                        {withFallback(
                          <AccountProfile />,
                          AccountProfilePageSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />
                  {/* Role-aware hub: client_account_overview or provider_account_overview. */}

                  {/* Account settings */}
                  <Route
                    path="/lucid/account/settings"
                    element={
                      <ProtectedRoute>
                        {withFallback(<AccountSettings />, AccountSettingsPageSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/account/profile"
                    element={
                      <ProtectedRoute>
                        {withFallback(
                          <AccountProfile />,
                          AccountProfilePageSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />
                  {/* Authenticated profile view. The page redirects clients to their
                client-profile route; providers can edit via the linked route. */}

                  <Route
                    path="/lucid/account/profile/edit"
                    element={
                      <ProtectedRoute>
                        {withFallback(<AccountSetupRoute />, ProfileEditorPageSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  {/* Shared profile editor; on save it routes clients/providers to their own profile page. */}

                  <Route
                    path="/lucid/account/profile/setup"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<AccountSetup />, ProfileEditorPageSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  {/* Provider-only onboarding. Skip → /lucid/. Save → /lucid/account/profile. */}

                  {/* Client requests and managed cases. */}

                  {/* LUCID-managed intake. This stores no provider ID and is client-only. */}
                  <Route
                    path="/lucid/bookings/request/:category/:service"
                    element={<ClientRequestRoute />}
                  />

                  <Route
                    path="/lucid/cases"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        {withFallback(<ManagedCases />, RequestQueueSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/cases/:caseId"
                    element={
                      <ProtectedRoute>
                        {withFallback(<ManagedCaseDetail />, CaseDetailSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/provider/work"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<ProviderWork />, RequestQueueSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/provider/work/:caseId"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<ManagedCaseDetail />, CaseDetailSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/bookings/new/:providerId"
                    element={<Navigate to="/lucid/services" replace />}
                  />
                  {/* Legacy provider-specific booking URLs return to service discovery. */}

                  <Route
                    path="/lucid/bookings/confirmation"
                    element={<Navigate to="/lucid/cases" replace />}
                  />
                  <Route
                    path="/lucid/bookings/history"
                    element={<Navigate to="/lucid/cases" replace />}
                  />
                  <Route
                    path="/lucid/bookings"
                    element={<Navigate to="/lucid/cases" replace />}
                  />
                  {/* Legacy marketplace booking pages are no longer client entry points. */}

                  {/* Favourites (client only) */}
                  <Route
                    path="/lucid/favourites"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        <Navigate to="/lucid/services" replace />
                      </ProtectedRoute>
                    }
                  />

                  {/* Messaging */}
                  <Route
                    path="/lucid/messages"
                    element={
                      <ProtectedRoute>
                        {withFallback(<MessagesPage />, ChatSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* Notifications */}
                  <Route
                    path="/lucid/notifications"
                    element={
                      <ProtectedRoute>
                        {withFallback(
                          <NotificationsPage />,
                          NotificationsSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/notifications/settings"
                    element={
                      <ProtectedRoute>
                        {withFallback(<NotificationSettingsPage />, NotificationSettingsPageSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* ── PROTECTED — SERVICE_PROVIDER ONLY ─────────────────────────

                  {/* Earnings (provider only) */}
                  <Route
                    path="/lucid/earnings"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<EarningsPayments />, FinancePageSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* Transactions (provider only) */}
                  <Route
                    path="/lucid/transactions"
                    element={
                      <ProtectedRoute>
                        {withFallback(<TransactionsPage />, TransactionsPageSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* Unknown routes return to the home page. */}

                  <Route path="*" element={<Navigate to="/lucid/" replace />} />
                </Routes>
              </Layout>
            </LocationProvider>
          </WorkflowModeProvider>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;

/*
 * Backend implementation checklist (see docs/backend/BACKEND_WORKFLOW_IMPLEMENTATION_GUIDE.md):
 * - Public catalogue, categories, service search, service detail, support/contact submissions.
 * - Supabase Auth, email confirmation, role provisioning, profile completion, security, consent,
 *   notification preferences, privacy export/deletion requests, suspension and appeals.
 * - Client/provider/Inspector private and public profile reads, updates, verification files,
 *   portfolio media, saved service locations, availability and assignment capacity.
 * - Service request create/read/update/cancel, private addresses, Admin clarification/amendments,
 *   Inspector assignment/reassignment, proximity search and Client no-Inspector consent.
 * - Provider discovery/assignment, acceptance/decline, work start/completion, final bills,
 *   optional bill notes, client accept/reject/negotiation revisions and optional reviews.
 * - Role-authorized messaging, thread/reply/edit history, voice/media storage, read receipts,
 *   notifications, email/SMS/push delivery and audit trail.
 * - Payment-gateway checkout, signed webhook verification, ledger/fees/refunds, receipts,
 *   provider and Inspector secure payout onboarding/status/transfer reconciliation.
 * - Admin account directory, policy actions/notices, credential review, appeals, case audit,
 *   transaction/receipt search, review moderation and message access with explicit audit events.
 * - Enforce every role, case-state and private-field rule in Postgres RLS or trusted Edge Functions.
 *   Never trust client-supplied role, amount, fee, assignment, payment, payout, or lifecycle state.
 */
