// Public navigation and signed-in account controls.
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useWorkflowMode } from "../../contexts/WorkflowModeContext.jsx";
import Logo from "../../assets/brand/Lucid.webp";
import LogoWhite from "../../assets/brand/Lucid white.webp";

const dashboardFor = (role) =>
  ({
    client: "/lucid/dashboard",
    provider: "/lucid/dashboard",
    inspector: "/lucid/inspector/visits",
    admin: "/lucid/admin/workflow",
  })[role] || "/lucid/dashboard";

const publicLinks = [
  ["Home", "/lucid/", Home],
  ["Browse services", "/lucid/services", Search],
  ["About", "/lucid/about", Info],
];

const roleLabel = {
  client: "Client account",
  provider: "Service provider account",
  service_provider: "Service provider account",
  inspector: "Inspector account",
  admin: "LUCID operations",
  hr: "LUCID operations",
  operations_admin: "LUCID operations",
  super_admin: "LUCID operations",
};

export default function Navbar() {
  const { user, role, signOut } = useWorkflowMode();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const name = user?.name || user?.email?.split("@")[0] || "Account holder";

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const logout = () => {
    signOut();
    setAccountOpen(false);
    closeMenu();
    navigate("/lucid/", { replace: true });
  };

  return (
    <>
      <header className="relative z-40 border-b border-gray-100 bg-white dark:border-[#252b3b] dark:bg-[#141923]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/lucid/"
            aria-label="Lucid home"
            className="inline-flex shrink-0 items-center"
          >
            <img
              src={Logo}
              alt="Lucid"
              className="h-5 w-20 object-cover dark:hidden"
              width="80"
              height="20"
            />
            <img
              src={LogoWhite}
              alt="Lucid"
              className="hidden h-5 w-20 object-cover dark:block"
              width="80"
              height="20"
            />
          </Link>

          <nav
            className="hidden items-center gap-7 md:flex"
            aria-label="Public pages"
          >
            {publicLinks.slice(1).map(([label, href]) => (
              <Link
                key={href}
                to={href}
                className="text-sm font-medium text-gray-700 hover:text-primary dark:text-slate-200"
              >
                {label}
              </Link>
            ))}
            {user && (
              <Link
                to={dashboardFor(role)}
                className="text-sm font-medium text-gray-700 hover:text-primary dark:text-slate-200"
              >
                Workspace
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-[#252b3b]"
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                >
                  <Avatar name={name} size="sm" />
                  <span className="max-w-36 truncate text-left">
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      {name}
                    </span>
                    <span className="block text-xs capitalize text-gray-500 dark:text-slate-400">
                      {roleLabel[role] || "Account"}
                    </span>
                  </span>
                  <ChevronDown size={16} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl dark:border-[#303a4c] dark:bg-[#1a1f2e]">
                    <Link
                      onClick={() => setAccountOpen(false)}
                      to="/lucid/account/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <UserRound size={16} /> My profile
                    </Link>
                    <Link
                      onClick={() => setAccountOpen(false)}
                      to="/lucid/account/settings"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <Settings size={16} /> Account settings
                    </Link>
                    <Link
                      onClick={() => setAccountOpen(false)}
                      to="/lucid/messages"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <MessageCircle size={16} /> Messages
                    </Link>
                    <Link
                      onClick={() => setAccountOpen(false)}
                      to="/lucid/notifications"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <Bell size={16} /> Notifications
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/lucid/signin"
                className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-200 dark:hover:bg-[#252b3b] md:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
            className="absolute inset-0 bg-gray-950/40"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Public navigation"
            className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col overflow-y-auto overscroll-contain bg-white p-4 shadow-2xl dark:bg-[#141923]"
          >
            <div className="mb-6 flex items-center justify-between">
              <Link
                to="/lucid/"
                aria-label="Lucid home"
                onClick={closeMenu}
                className="inline-flex items-center"
              >
                <img
                  src={Logo}
                  alt="Lucid"
                  className="h-5 w-20 object-cover dark:hidden"
                  width="80"
                  height="20"
                />
                <img
                  src={LogoWhite}
                  alt="Lucid"
                  className="hidden h-5 w-20 object-cover dark:block"
                  width="80"
                  height="20"
                />
              </Link>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#252b3b]"
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-[#1a1f2e]">
                <Avatar name={name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    {roleLabel[role] || "Account"}
                  </p>
                </div>
              </div>
            )}

            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Explore LUCID
            </p>
            <nav aria-label="Public pages" className="space-y-1">
              {publicLinks.map(([label, href, Icon]) => (
                <Link
                  key={href}
                  to={href}
                  onClick={closeMenu}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-[#252b3b]"
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {user ? (
              <>
                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-[#303a4c]">
                  <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    Your account
                  </p>
                  <nav aria-label="Account pages" className="space-y-1">
                    <Link
                      to={dashboardFor(role)}
                      onClick={closeMenu}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <LayoutDashboard size={18} />
                      Workspace
                    </Link>
                    <Link
                      to="/lucid/account/profile"
                      onClick={closeMenu}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <UserRound size={18} />
                      My profile
                    </Link>
                    <Link
                      to="/lucid/account/settings"
                      onClick={closeMenu}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <Settings size={18} />
                      Account settings
                    </Link>
                    <Link
                      to="/lucid/messages"
                      onClick={closeMenu}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <MessageCircle size={18} />
                      Messages
                    </Link>
                    <Link
                      to="/lucid/notifications"
                      onClick={closeMenu}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b]"
                    >
                      <Bell size={18} />
                      Notifications
                    </Link>
                  </nav>
                </div>
              </>
            ) : null}

            <div className="mt-auto border-t border-gray-100 pt-4 dark:border-[#303a4c]">
              <Link
                to="/lucid/help"
                onClick={closeMenu}
                className="mb-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b]"
              >
                <BriefcaseBusiness size={18} />
                Get support
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              ) : (
                <Link
                  to="/lucid/signin"
                  onClick={closeMenu}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
