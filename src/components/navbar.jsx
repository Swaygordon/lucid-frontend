// src/components/navbar.jsx
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
import { getUnreadMessageCount, subscribeToMessages } from '../lib/chatService';
import { onActivateKey } from '../utils/a11y';
import { Sun, Moon } from 'lucide-react';
import Logo from "../assets/Lucid.webp";
import LogoWhite from "../assets/Lucid white.webp";

const USER_PROFILE_CACHE_KEY = 'lucid:userProfile';
const PROVIDER_PROFILE_CACHE_KEY = 'lucid:providerProfile';
const CLIENT_PROFILE_CACHE_KEY = 'lucid:clientProfile';

const readProfileCache = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
};
const writeProfileCache = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
};
const clearProfileCache = () => {
  try {
    localStorage.removeItem(USER_PROFILE_CACHE_KEY);
    localStorage.removeItem(PROVIDER_PROFILE_CACHE_KEY);
    localStorage.removeItem(CLIENT_PROFILE_CACHE_KEY);
  } catch { }
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

const AccountTypeBadge = ({ role, occupation, alsoClient, className = "" }) => {
  if (!role) return null;

  if (role === 'admin') {
    return (
      <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ${className}`}>
        <Shield className="w-4 h-4" />
        Admin
      </span>
    );
  }

  if (role === 'service_provider') {
    const label = occupation ? `Provider · ${occupation}` : 'Service Provider';
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-none text-blue-700 dark:bg-none dark:text-blue-300 ${className}`}>
          {label}
        </span>
        {alsoClient && (
          <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-none text-emerald-700 dark:bg-none dark:text-emerald-300 ${className}`}>
            Also a Client
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-none text-emerald-700 dark:bg-none dark:text-emerald-300 ${className}`}>
      
      Client
    </span>
  );
};

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(() => readProfileCache(USER_PROFILE_CACHE_KEY));
  const [providerProfile, setProviderProfile] = useState(() => readProfileCache(PROVIDER_PROFILE_CACHE_KEY));
  const [clientProfile, setClientProfile] = useState(() => readProfileCache(CLIENT_PROFILE_CACHE_KEY));
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alsoClient, setAlsoClient] = useState(false);
  const dropdownRef = useRef(null);
  const { showNotification } = useNotification();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchRoleProfile(session.user.id);
        fetchNotificationCounts(session.user.id);
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchRoleProfile(session.user.id);
        fetchNotificationCounts(session.user.id);
        checkAdminStatus(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setUserProfile(null);
        setProviderProfile(null);
        setClientProfile(null);
        setNotificationCount(0);
        setMessageCount(0);
        setIsAdmin(false);
        setAlsoClient(false);
        clearProfileCache();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Poll notification counts + subscribe to real-time messages
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    fetchNotificationCounts(user.id);

    const pollInterval = setInterval(() => {
      fetchNotificationCounts(user.id);
    }, 30000);

    const unsubscribeMsgs = subscribeToMessages(user.id, () => {
      setMessageCount(prev => prev + 1);
    });

    return () => {
      clearInterval(pollInterval);
      if (unsubscribeMsgs) unsubscribeMsgs();
    };
  }, [isLoggedIn, user]);

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

  // Always fetch base profile (source of truth for avatar_url and role)
  const fetchUserProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setUserProfile(data);
      writeProfileCache(USER_PROFILE_CACHE_KEY, data);

      if (data.role === 'service_provider') {
        checkAlsoClient(userId);
      } else {
        setAlsoClient(false);
      }
    }
  };

  // Role-specific profile (provider_profiles OR client_profiles)
  const fetchRoleProfile = async (userId) => {
    const { data: baseProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const role = baseProfile?.role;

    if (role === 'service_provider') {
      const { data } = await supabase
        .from('provider_profiles')
        .select('avatar_url, first_name, last_name, occupation')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        setProviderProfile(data);
        writeProfileCache(PROVIDER_PROFILE_CACHE_KEY, data);
      }
      setClientProfile(null);
    } else if (role === 'client') {
      const { data } = await supabase
        .from('client_profiles')
        .select('avatar_url, first_name, last_name')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        setClientProfile(data);
        writeProfileCache(CLIENT_PROFILE_CACHE_KEY, data);
      }
      setProviderProfile(null);
    } else {
      setProviderProfile(null);
      setClientProfile(null);
    }
  };

  const checkAlsoClient = async (userId) => {
    const { count, error } = await supabase
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', userId);

    if (!error) setAlsoClient((count || 0) > 0);
  };

  const fetchNotificationCounts = async (userId) => {
    try {
      const [{ count: notifCount }, unreadMsgs] = await Promise.all([
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false),
        getUnreadMessageCount(userId),
      ]);
      setNotificationCount(notifCount || 0);
      setMessageCount(unreadMsgs || 0);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
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

  const getRoleProfile = () => {
    if (userProfile?.role === 'service_provider') return providerProfile;
    if (userProfile?.role === 'client')          return clientProfile;
    return null;
  };

  const getUserDisplayName = () => {
    const rp = getRoleProfile();
    if (rp?.first_name) return rp.first_name;
    if (userProfile?.first_name) return userProfile.first_name;
    return 'User';
  };

  const getFullName = () => {
    const rp = getRoleProfile();
    if (rp?.first_name || rp?.last_name) {
      return [rp.first_name, rp.last_name].filter(Boolean).join(' ') || 'User';
    }
    if (userProfile?.first_name || userProfile?.last_name) {
      return [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || 'User';
    }
    return 'User';
  };

  // Priority: role-specific table → base profiles table
  const getAvatarUrl = () => {
    const rp = getRoleProfile();
    if (rp?.avatar_url) return rp.avatar_url;
    if (userProfile?.avatar_url) return userProfile.avatar_url;
    return null;
  };

  const getDashboardPath = () => '/lucid/dashboard';

  const getProfilePath = () => {
    if (userProfile?.role === 'service_provider') {
      return '/lucid/account/profile';
    } else if (userProfile?.role === 'client') {
      return '/lucid/account/client-profile';
    }
    return '/lucid/account/profile';
  };

  const navLinks = [
    { to: "/lucid/become-provider", label: "Join as a worker", icon: BriefcaseBusiness },
    { to: "/lucid/services",        label: "Services",          icon: Hammer },
    { to: "/lucid/about",           label: "About",             icon: Info },
  ];

  if (isAdmin) {
    navLinks.push({ to: "/lucid/admin", label: "Admin", icon: Shield });
  }

  const userMenuLinks = [
    { to: getProfilePath(), label: "My Profile", icon: User },
    { to: getDashboardPath(), label: "Dashboard", icon: LayoutDashboard },
    { to: "/lucid/messages",       label: "Messages",      icon: MessageCircle, badge: messageCount },
    { to: "/lucid/notifications",  label: "Notifications", icon: Bell,          badge: notificationCount },
  ];

  const mobileUserLinks = [
    { to: getProfilePath(), label: "My Profile", icon: User },
    { to: getDashboardPath(),     label: "Dashboard",     icon: LayoutDashboard },
    { to: "/lucid/messages",      label: "Messages",      icon: MessageCircle, badge: messageCount },
    { to: "/lucid/notifications", label: "Notifications", icon: Bell,          badge: notificationCount },
  ];

  if (isAdmin) {
    mobileUserLinks.push({ to: "/lucid/admin", label: "Admin", icon: Shield });
  }

  const accountRole       = userProfile?.role;
  const accountOccupation = providerProfile?.occupation;

  return (
    <>
      <nav className="flex items-center justify-between bg-white dark:bg-[#1a1f2e] h-20 border-b border-gray-200 dark:border-[#1e293b] sticky top-0 z-30">
        <div className="flex items-center ml-4 md:ml-12">
          <Link to="/lucid/" className="flex items-center">
            <img src={isDark ? LogoWhite : Logo} alt="Lucid Logo" className="h-5 w-20 object-cover" width="80" height="20" loading="eager" />
          </Link>
        </div>

        <div className="flex items-center ml-auto mr-4">
          <div className="hidden lg:flex items-center gap-2">
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
                className="relative flex items-center space-x-2 cursor-pointer  p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={getFullName()}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Avatar name={getFullName()} size="md" />
                )}
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-medium text-xl  text-gray-800 dark:text-slate-100">{getUserDisplayName()}</span>
                  <AccountTypeBadge
                    role={accountRole}
                    occupation={accountOccupation}
                    alsoClient={alsoClient}
                    className="mt-1"
                  />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>

              {isDropdownOpen && (
                <ul className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1a1f2e] rounded-lg z-50 w-56 p-2 shadow-lg border border-gray-200 dark:border-[#1e293b]">
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

          <button
            onClick={toggleTheme}
            className="p-2 ml-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

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

      <div
        onClick={toggleMenu}
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`fixed top-0 left-0 h-dvh w-72 bg-white dark:bg-[#1a1f2e] shadow-2xl z-50 transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-dvh flex flex-col">
          <div className="mb-6">
            <img src={isDark ? LogoWhite : Logo} alt="Lucid Logo" className="h-5 w-28 object-cover m-1" width="112" height="20" loading="lazy" />
          </div>

          {isLoggedIn && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-[#1e293b]">
              <div className="flex items-start space-x-3">
                {getAvatarUrl() ? (
                  <img
  src={getAvatarUrl()}
  alt={getFullName()}
  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
  width="48"
  height="48"
  loading="lazy"
/>
                ) : (
                  <div className="flex-shrink-0">
  <Avatar name={getFullName()} size="lg" />
</div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-2xl  text-gray-900 dark:text-slate-100 truncate">{getUserDisplayName()}</p>
                  <AccountTypeBadge
                    role={accountRole}
                    occupation={accountOccupation}
                    alsoClient={alsoClient}
                    className="mt-3"
                  />
                </div>
              </div>
            </div>
          )}

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