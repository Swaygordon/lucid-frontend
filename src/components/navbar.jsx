import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import {
  ChevronDown, Hammer, BriefcaseBusiness,
  LogOut, MessageCircle, Bell, LayoutDashboard, Info, LogIn, Shield, CalendarCheck, User
} from "lucide-react";
import { Button } from './ui/Button.jsx';
import { Avatar } from './ui/Avatar.jsx';
import { LogoutConfirmModal } from './shared';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { onActivateKey } from '../utils/a11y';
import { Sun, Moon } from 'lucide-react';
import Logo from "../assets/Lucid.webp";
import LogoWhite from "../assets/Lucid white.webp";

// Cache the most recent profile in localStorage so refreshes paint the
// correct name + initials on the first render instead of flashing the email
// or a "U" avatar while Supabase round-trips. Cleared on sign-out.
const USER_PROFILE_CACHE_KEY = 'lucid:userProfile';
const PROVIDER_PROFILE_CACHE_KEY = 'lucid:providerProfile';

const readProfileCache = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
};
const writeProfileCache = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode — silent */ }
};
const clearProfileCache = () => {
  try {
    localStorage.removeItem(USER_PROFILE_CACHE_KEY);
    localStorage.removeItem(PROVIDER_PROFILE_CACHE_KEY);
  } catch { /* noop */ }
};

const NotificationBadge = ({ count = 0, className = "" }) => {
  if (!count || count <= 0) return null;
  return (
    <motion.span
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px]
        px-1 text-xs font-bold text-white bg-error
        rounded-full flex items-center justify-center ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
};

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(() => readProfileCache(USER_PROFILE_CACHE_KEY));
  const [providerProfile, setProviderProfile] = useState(() => readProfileCache(PROVIDER_PROFILE_CACHE_KEY));
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);
  const { showNotification } = useNotification();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchProviderProfile(session.user.id);
        fetchNotificationCounts(session.user.id);
        checkAdminStatus(session.user.id);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchProviderProfile(session.user.id);
        fetchNotificationCounts(session.user.id);
        checkAdminStatus(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setUserProfile(null);
        setProviderProfile(null);
        setNotificationCount(0);
        setMessageCount(0);
        setIsAdmin(false);
        clearProfileCache();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const fetchUserProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setUserProfile(data);
      writeProfileCache(USER_PROFILE_CACHE_KEY, data);
    }
  };

  const fetchProviderProfile = async (userId) => {
    // Only fetch provider profile if the user is a service provider
    const { data: userProfileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // Only fetch provider profile for provider accounts
    if (userProfileData?.role === 'service_provider') {
      const { data } = await supabase
        .from('provider_profiles')
        .select('avatar_url, first_name, last_name')
        .eq('user_id', userId)
        .single();
      if (data) {
        setProviderProfile(data);
        writeProfileCache(PROVIDER_PROFILE_CACHE_KEY, data);
      }
    } else {
      setProviderProfile(null);
    }
  };

  const fetchNotificationCounts = async (userId) => {
    const [{ count: notifCount }, { count: msgCount }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
      supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false),
    ]);
    setNotificationCount(notifCount || 0);
    setMessageCount(msgCount || 0);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    showNotification('Logged out successfully', 'success');
    setShowLogoutConfirm(false);
    navigate('/lucid/', { replace: true });
  };

  const checkAdminStatus = async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(profileData?.role === 'admin');
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const toggleMenu = () => { setIsOpen(!isOpen); };
  const handleLinkClick = () => { setIsOpen(false); };

  const getUserDisplayName = () => {
    if (providerProfile?.first_name) return providerProfile.first_name;
    if (userProfile?.first_name) return userProfile.first_name;
    return 'User';
  };

  const getFullName = () => {
    if (providerProfile?.first_name || providerProfile?.last_name) {
      return [providerProfile.first_name, providerProfile.last_name].filter(Boolean).join(' ') || 'User';
    }
    if (userProfile?.first_name || userProfile?.last_name) {
      return [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || 'User';
    }
    return 'User';
  };

  const getAvatarUrl = () => {
    if (providerProfile?.avatar_url) return providerProfile.avatar_url;
    if (userProfile?.avatar_url) return userProfile.avatar_url;
    return null;
  };

  const getDashboardPath = () => '/lucid/dashboard';

  const getProfilePath = () => {
    // Check user role to determine which profile page to show
    if (userProfile?.role === 'service_provider') {
      return '/lucid/account/profile';
    } else if (userProfile?.role === 'client') {
      return '/lucid/account/client-profile';
    }
    return '/lucid/account/profile';
  };

  const getBookingsPath = () => {
    return '/lucid/bookings';
  };

  const totalNotifications = notificationCount + messageCount;

  // Desktop navigation links
  const navLinks = [
    { to: "/lucid/become-provider", label: "Join as a worker", icon: BriefcaseBusiness },
    { to: "/lucid/services",        label: "Services",          icon: Hammer },
    { to: "/lucid/about",           label: "About",             icon: Info },
  ];
  
  // Add My Bookings link for logged-in users
  if (isLoggedIn) {
    navLinks.push({ to: getBookingsPath(), label: "My Bookings", icon: CalendarCheck });
  }
  
  if (isAdmin) {
    navLinks.push({ to: "/lucid/admin", label: "Admin", icon: Shield });
  }

  // User menu links - now includes Profile for ALL logged-in users
  const userMenuLinks = [
    { to: getProfilePath(), label: "My Profile", icon: User },  // Added for all users
    { to: getDashboardPath(), label: "Dashboard" },
    { to: getBookingsPath(),  label: "My Bookings" },
    { to: "/lucid/messages",       label: "Messages",      badge: messageCount },
    { to: "/lucid/notifications",  label: "Notifications", badge: notificationCount },
  ];

  const mobileUserLinks = [
    { to: getProfilePath(),       label: "My Profile",     icon: User },  // Added for all users
    { to: getDashboardPath(),     label: "Dashboard",     icon: LayoutDashboard },
    { to: getBookingsPath(),      label: "My Bookings",   icon: CalendarCheck },
    { to: "/lucid/messages",      label: "Messages",      icon: MessageCircle, badge: messageCount },
    { to: "/lucid/notifications", label: "Notifications", icon: Bell,          badge: notificationCount },
  ];
  
  if (isAdmin) {
    mobileUserLinks.push({ to: "/lucid/admin", label: "Admin", icon: Shield });
  }

  return (
    <>
      <nav className="flex items-center justify-between bg-white dark:bg-[#1a1f2e] h-20 border-b border-gray-200 dark:border-[#1e293b] sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center ml-4 md:ml-12">
          <Link to="/lucid/" className="flex items-center">
            <img src={isDark ? LogoWhite : Logo} alt="Lucid Logo" className="h-5 w-20 object-cover" width="80" height="20" loading="eager" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="flex items-center ml-auto mr-4">
          <div className="hidden lg:flex items-center gap-2">
            {/* Navigation Links */}
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:text-secondary font-medium transition-colors rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary/10 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Notification Bell */}
          <Link to="/lucid/notifications" className="relative ml-2 hidden lg:block">
            <Bell className="w-5 h-5 text-gray-600 dark:text-slate-300" />
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>

          {/* User Profile / Sign In */}
          {isLoggedIn ? (
            <div ref={dropdownRef} className="relative ml-4 hidden lg:block">
              <div
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
                aria-label="Account menu"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                onKeyDown={onActivateKey(() => setIsDropdownOpen(prev => !prev))}
                className="relative flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252b3b] p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={getFullName()}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <Avatar name={getFullName()} size="md" />
                )}
                <span className="font-medium text-gray-800 dark:text-slate-100">{getUserDisplayName()}</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>

              {isDropdownOpen && (
                <ul className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1a1f2e] rounded-lg z-50 w-52 p-2 shadow-lg border border-gray-200 dark:border-[#1e293b]">
                  {userMenuLinks.map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.to}
                        onClick={() => setIsDropdownOpen(false)}
                        className="text-gray-700 dark:text-slate-300 hover:bg-secondary-50 dark:hover:bg-secondary/10 hover:text-secondary rounded-md transition-colors flex items-center justify-between px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          {link.icon && <link.icon className="w-4 h-4" />}
                          <span>{link.label}</span>
                        </div>
                        {link.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {link.badge > 99 ? '99+' : link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                  <li className="border-t border-gray-200 dark:border-[#1e293b] mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="text-error hover:bg-error-50 dark:hover:bg-red-900/20 rounded-md transition-colors w-full text-left px-3 py-2 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="ml-4 hidden lg:block whitespace-nowrap"
              onClick={() => navigate('/lucid/signin')}
            >
              Sign In
            </Button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 ml-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden z-50 p-2 ml-4 bg-secondary text-white rounded-lg hover:bg-secondary-hover active:scale-95 transition-colors shadow-md relative"
            aria-label="Toggle menu"
          >
            {isLoggedIn && (notificationCount + messageCount) > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                {notificationCount + messageCount > 9 ? '9+' : notificationCount + messageCount}
              </span>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Overlay */}
      <div
        onClick={toggleMenu}
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-dvh w-72 bg-white dark:bg-[#1a1f2e] shadow-2xl z-50 transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-dvh flex flex-col">
          {/* Logo */}
          <div className="mb-6">
            <img src={isDark ? LogoWhite : Logo} alt="Lucid Logo" className="h-5 w-28 object-cover m-1" width="112" height="20" loading="lazy" />
          </div>

          {/* User Profile (Mobile) */}
          {isLoggedIn && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-[#1e293b]">
              <div className="flex items-center space-x-3">
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt={getFullName()} className="w-12 h-12 rounded-full object-cover" width="48" height="48" loading="lazy" />
                ) : (
                  <Avatar name={getFullName()} size="lg" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{getUserDisplayName()}</p>
                  <Link
                    to={getProfilePath()}
                    onClick={handleLinkClick}
                    className="text-sm text-primary hover:text-secondary transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {navLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  to={link.to}
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 text-gray-700 dark:text-slate-300 hover:text-secondary hover:bg-secondary-50 dark:hover:bg-secondary/10 p-3 rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            {isLoggedIn && mobileUserLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  to={link.to}
                  onClick={handleLinkClick}
                  className="flex items-center justify-between text-gray-700 dark:text-slate-300 hover:text-secondary hover:bg-secondary-50 dark:hover:bg-secondary/10 p-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3 relative">
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {link.badge > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {link.badge > 99 ? '99+' : link.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Auth Button */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#1e293b]">
            {isLoggedIn ? (
              <Button variant="danger" fullWidth onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            ) : (
              <Button variant="secondary" fullWidth onClick={() => { handleLinkClick(); navigate('/lucid/signin'); }}>
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}

export default Navbar;