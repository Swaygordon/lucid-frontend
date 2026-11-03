// @backend-handoff-delete Local Preview provider, route gate, and development notices are removed/replaced at auth integration.
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
import InspectorPreviewSetupGate from "./layout/InspectorPreviewSetupGate.jsx";
import WorkspaceShell from "./layout/WorkspaceShell.jsx";
import WorkflowModeBanner from "../components/workflow/WorkflowModeBanner.jsx";

// ─── Admin Dashboard — statically imported (not route-level code-split) ──────

// ─── Per-route loading skeletons ──────────────────────────────────────────────
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
} from "./components/RouteSkeletons.jsx";

// ─── Page-level code splitting ────────────────────────────────────────────────
// lazy() defers route modules until they are needed; Vite may share dependencies
// across output chunks. Route modules are dynamically imported below.

// Public pages
const Home = lazy(() => import("../pages/public/HomePage.jsx"));
const About = lazy(() => import("../pages/public/AboutPage.jsx"));
const HelpSupport = lazy(() => import("../pages/public/HelpSupportPage.jsx"));

// Auth & onboarding (Phase 1)
const Signup = lazy(() => import("../pages/auth/SignUpPage.jsx"));
const Signin = lazy(() => import("../pages/auth/SignInPage.jsx"));
// Services discovery (Phase 2)
const Service = lazy(() => import("../pages/catalog/ServicesPage.jsx"));
const AllCategories = lazy(
  () => import("../pages/catalog/AllCategoriesPage.jsx"),
);
const Category = lazy(() => import("../pages/catalog/CategoryPage.jsx"));
const Selected_service = lazy(
  () => import("../pages/catalog/ServiceDetailsPage.jsx"),
);

// Provider profile (Phase 3)
const PreviewAccountSetup = lazy(
  () => import("../pages/accounts/PreviewAccountSetupPage.jsx"),
);
const PreviewAccountProfile = lazy(
  () => import("../pages/accounts/PreviewAccountProfilePage.jsx"),
);
const PreviewAccountSettings = lazy(
  () => import("../pages/accounts/PreviewAccountSettingsPage.jsx"),
);

// Bookings (Phase 4)
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
const ManagedWorkflowPreviewRoute = lazy(
  () => import("../dev/ManagedWorkflowPreviewRoute.jsx"),
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
// Preview notification surface.
const PreviewNotificationsPage = lazy(
  () => import("../pages/notifications/PreviewNotificationsPage.jsx"),
);
const PreviewNotificationSettingsPage = lazy(
  () => import("../pages/notifications/PreviewNotificationSettingsPage.jsx"),
);

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Wrap any <Route> element with this to require authentication.
// Optionally pass allowedRoles={['service_provider']} to also enforce role.
//
// Local Preview identity and role checks guard authenticated prototype routes.
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
  const { user, role } = useWorkflowMode();
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
  return <InspectorPreviewSetupGate>{children}</InspectorPreviewSetupGate>;
};

const PreviewSetupRoute = () => {
  const { role } = useWorkflowMode();
  if (role === "inspector")
    return <Navigate to="/lucid/inspector/profile" replace />;
  if (role === "admin") return <Navigate to="/lucid/admin/workflow" replace />;
  return <PreviewAccountSetup />;
};

const ClientRequestRoute = () => {
  const { user, role } = useWorkflowMode();
  const location = useLocation();
  if (!user) return <Navigate to="/lucid/signin" replace state={{ from: location }} />;
  if (role === "client") return withFallback(<ManagedServiceRequest />, BookingsSkeleton);
  if (role === "provider" || role === "inspector") {
    return withFallback(<ClientRequestAccountPrompt />, BookingsSkeleton);
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
  const workspacePrefixes = ["/lucid/dashboard", "/lucid/cases", "/lucid/provider", "/lucid/client", "/lucid/messages", "/lucid/notifications", "/lucid/account", "/lucid/earnings", "/lucid/transactions", "/lucid/inspector", "/lucid/admin", "/lucid/staff/operations", "/lucid/preview", "/lucid/bookings"];
  const isWorkspaceRoute = Boolean(user) && workspacePrefixes.some(prefix => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));
  if (isWorkspaceRoute) return <WorkspaceShell>{children}</WorkspaceShell>;

  // Exact paths where the shared Navbar/Footer are hidden.
  const hideNavAndFooterExact = [
    "/lucid/dashboard", // DashboardPage (Phase 5)
    "/lucid/earnings", // EarningsPayments (Phase 5)
    "/lucid/transactions", // TransactionsPage (Phase 5)
    "/lucid/favourites", // Favourites (Phase 5)
    "/lucid/account", // AccountPage (Phase 6)
    "/lucid/account/settings", // AccountSettings (Phase 6)
    "/lucid/notifications", // NotificationsPage (Phase 6)
    "/lucid/notifications/settings", // NotificationSettings (Phase 6)
    "/lucid/messages", // Messages (Phase 7)
    "/lucid/preview", // Public preview app
    "/lucid/bookings", // BookingsPage (Phase 4)
    "/lucid/bookings/history", // BookingHistoryPage (Phase 4)
    "/lucid/bookings/confirmation", // BookingConfirmation (Phase 4)
    "/lucid/cases", // Client's LUCID-managed request list
    "/lucid/account/profile", // UserProfile (Phase 3)
    "/lucid/account/profile/edit", // EditProfile (Phase 3)
    "/lucid/account/profile/setup", // ProviderProfileSetup (Phase 3)
    "/lucid/help", // Help & Support (public, shell hidden)
    "/lucid/account/client-profile", // ClientProfile
    "/lucid/admin", // Admin Dashboard
    "/lucid/staff/operations", // LUCID operations queue
    "/lucid/inspector/visits", // Inspector visit list
    "/lucid/signin", // Sign-in page (public, shell hidden)
    "/lucid/signup", // Sign-up page (public, shell hidden)
    "/lucid/preview", // Shared public workflow walkthrough
  ];

  // Prefix-based hide — catches full-screen dynamic routes. Provider-profile
  // and provider-specific booking paths now redirect to service discovery.
  const hideNavAndFooterPrefix = [
    "/lucid/providers/", // Legacy provider IDs redirect to service discovery
    "/lucid/bookings/new/", // BookingRequest — dynamic :providerId segment (Phase 4)
    "/lucid/bookings/request/", // Managed service request — category/service route
  ];

  const shouldHideLayout =
    hideNavAndFooterExact.includes(location.pathname) ||
    hideNavAndFooterPrefix.some((prefix) =>
      location.pathname.startsWith(prefix),
    );

  return (
    <>
      {!shouldHideLayout && <Navbar />}{" "}
      {/* shown wherever the shared shell is enabled */}
      <WorkflowModeBanner />
      <ProfileSetupBanner />{" "}
      <CancellationFeeRecoveryBanner />
      {/* renders for incomplete providers on eligible routes */}
      <main>{children}</main> {/* landmark required for screen readers */}
      {!shouldHideLayout && <Footer />}{" "}
      {/* shown wherever the shared shell is enabled */}
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
        <LocationProvider>
          {/* basename matches vite's production base ("/lucid-frontend"), so URLs    */}
          {/* like /lucid-frontend/lucid/bookings resolve to the /lucid/bookings route. */}
          {/* In dev (base "/lucid/") import.meta.env.PROD is false → basename is "".   */}
          <Router basename={import.meta.env.PROD ? "/lucid-frontend" : ""}>
            {/* ScrollToTop resets scroll position on every route change */}
            <ScrollToTop />
            {/* Layout reads location from Router context — must be inside <Router> */}
            <WorkflowModeProvider>
              <Layout>
                <Routes>
                  {/* ── PUBLIC ROUTES ─────────────────────────────────────────────
                No authentication needed. Anyone can reach these pages.      */}

                  <Route
                    path="/lucid/"
                    element={withFallback(<Home />, HomeSkeleton)}
                  />
                  {/* Landing page. Entry point for new visitors. */}

                  <Route
                    path="/lucid/signup"
                    element={withFallback(<Signup />, AuthFormSkeleton)}
                  />
                  {/* New user registration — both client and provider accounts. */}

                  <Route
                    path="/lucid/signin"
                    element={withFallback(<Signin />, AuthFormSkeleton)}
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
                        {withFallback(<AdminWorkflowHub />, DashboardSkeleton)}
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
                        {withFallback(<AdminFinancialRecords />, DashboardSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/admin"
                    element={
                      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                        {withFallback(<AdminWorkflowHub />, DashboardSkeleton)}
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
                        {withFallback(<AdminWorkflowHub />, DashboardSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/preview"
                    element={
                      <ProtectedRoute>
                        {withFallback(
                          <ManagedWorkflowPreviewRoute />,
                          DashboardSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/staff/workflow-preview"
                    element={<Navigate to="/lucid/admin/workflow" replace />}
                  />

                  <Route
                    path="/lucid/inspector/visits"
                    element={
                      <ProtectedRoute staffRoles={INSPECTOR_ONLY}>
                        {withFallback(
                          <InspectorDashboard />,
                          DashboardSkeleton,
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
                        {withFallback(<InspectorProfile />, ProfileSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/client/profile/setup"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        {withFallback(<PreviewAccountSetup />, ProfileSkeleton)}
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
                        {withFallback(<InspectorFinance />, DashboardSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/inspector/workflow-preview"
                    element={<Navigate to="/lucid/inspector/visits" replace />}
                  />

                  <Route
                    path="/lucid/become-provider"
                    element={withFallback(<Signup />, AuthFormSkeleton)}
                  />
                  {/* Same sign-up page, different entry point from marketing CTAs.
                The Signup component can detect this path to pre-select "provider". */}

                  {/* Client-only profile route. */}
                  <Route
                    path="/lucid/account/client-profile"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        {withFallback(
                          <PreviewAccountProfile />,
                          ProfileSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />
                  {/* ── SERVICES DISCOVERY (Phase 2) ──────────────────────────────
                /lucid/services/all is more specific than /lucid/services/:category.
                React Router ranks static segments above dynamic segments, so this
                declaration order is for readability rather than match precedence. */}

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
                    element={withFallback(<AllCategories />, ServicesSkeleton)}
                  />
                  {/* Grid of all 10 categories. The static "all" route outranks :category. */}

                  <Route
                    path="/lucid/services/:category"
                    element={withFallback(<Category />, ServicesSkeleton)}
                  />
                  {/* :category = slug from categories.js, e.g. "home-repairs".
                category.jsx calls getCategoryBySlug(params.category) to find the data. */}

                  <Route
                    path="/lucid/services/:category/:service"
                    element={withFallback(
                      <Selected_service />,
                      ServicesSkeleton,
                    )}
                  />
                  {/* :service = service slug within the category, e.g. "electrical-repairs".
                Selecting a service leads to the client-only LUCID intake. */}

                  {/* ── PROVIDER PROFILE (Phase 3) ────────────────────────────────
                Public — a client can view any provider's profile without logging in. */}

                  <Route
                    path="/lucid/providers/:id"
                    element={<Navigate to="/lucid/services" replace />}
                  />
                  {/* Provider identities are private in the managed-service model. */}

                  {/* ── PROTECTED — ANY AUTHENTICATED USER ────────────────────────
                ProtectedRoute checks the local Preview identity and selected role. */}

                  {/* Phase 5 — Dashboard */}
                  <Route
                    path="/lucid/dashboard"
                    element={
                      <ProtectedRoute>
                        {withFallback(<DashboardPage />, DashboardSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  {/* Role-aware: routes to client_dashboard or provider_dashboard based on profile.role. */}

                  {/* Phase 6 — Account overview */}
                  <Route
                    path="/lucid/account"
                    element={
                      <ProtectedRoute>
                        {withFallback(
                          <PreviewAccountProfile />,
                          ProfileSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />
                  {/* Role-aware hub: client_account_overview or provider_account_overview. */}

                  {/* Phase 6 — Account settings */}
                  <Route
                    path="/lucid/account/settings"
                    element={
                      <ProtectedRoute>
                        {withFallback(<PreviewAccountSettings />, ProfileSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/account/profile"
                    element={
                      <ProtectedRoute>
                        {withFallback(
                          <PreviewAccountProfile />,
                          ProfileSkeleton,
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
                        {withFallback(<PreviewSetupRoute />, ProfileSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  {/* Shared profile editor; on save it routes clients/providers to their own profile page. */}

                  <Route
                    path="/lucid/account/profile/setup"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<PreviewAccountSetup />, ProfileSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  {/* Provider-only onboarding. Skip → /lucid/. Save → /lucid/account/profile. */}

                  {/* ── BOOKINGS (Phase 4) ────────────────────────────────────
                Keep the booking routes grouped for readability. React Router
                ranks the more specific paths above the exact /bookings path. */}

                  {/* LUCID-managed intake. This stores no provider ID and is client-only. */}
                  <Route
                    path="/lucid/bookings/request/:category/:service"
                    element={<ClientRequestRoute />}
                  />

                  <Route
                    path="/lucid/cases"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        {withFallback(<ManagedCases />, BookingsSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/cases/:caseId"
                    element={
                      <ProtectedRoute>
                        {withFallback(<ManagedCaseDetail />, BookingsSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/cases/preview"
                    element={<Navigate to="/lucid/cases" replace />}
                  />

                  <Route
                    path="/lucid/provider/work"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<ProviderWork />, BookingsSkeleton)}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lucid/provider/work/:caseId"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<ManagedCaseDetail />, BookingsSkeleton)}
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

                  {/* Phase 5 — Favourites (client only) */}
                  <Route
                    path="/lucid/favourites"
                    element={
                      <ProtectedRoute allowedRoles={CLIENT_ONLY}>
                        <Navigate to="/lucid/services" replace />
                      </ProtectedRoute>
                    }
                  />

                  {/* Phase 7 — Messaging */}
                  <Route
                    path="/lucid/messages"
                    element={
                      <ProtectedRoute>
                        {withFallback(<MessagesPage />, BookingsSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* Phase 6 — Notifications */}
                  <Route
                    path="/lucid/notifications"
                    element={
                      <ProtectedRoute>
                        {withFallback(
                          <PreviewNotificationsPage />,
                          BookingsSkeleton,
                        )}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lucid/notifications/settings"
                    element={
                      <ProtectedRoute>
                        {withFallback(<PreviewNotificationSettingsPage />, ProfileSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* ── PROTECTED — SERVICE_PROVIDER ONLY ─────────────────────────
                ProtectedRoute checks session AND role.
                Clients hitting this route are bounced to /lucid/ with a toast. */}

                  {/* Phase 5 — Earnings (provider only) */}
                  <Route
                    path="/lucid/earnings"
                    element={
                      <ProtectedRoute allowedRoles={PROVIDER_ONLY}>
                        {withFallback(<EarningsPayments />, DashboardSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* Phase 5 — Transactions (provider only) */}
                  <Route
                    path="/lucid/transactions"
                    element={
                      <ProtectedRoute>
                        {withFallback(<TransactionsPage />, BookingsSkeleton)}
                      </ProtectedRoute>
                    }
                  />

                  {/* ── CATCH-ALL ─────────────────────────────────────────────────
                Any URL not matched above redirects to the home page.
                Prevents blank "not found" screens on mistyped URLs. */}

                  <Route path="*" element={<Navigate to="/lucid/" replace />} />
                </Routes>
              </Layout>
            </WorkflowModeProvider>
          </Router>
        </LocationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
