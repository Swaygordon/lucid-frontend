import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import {
  ChevronDown, Hammer, BriefcaseBusiness,
  LogOut, MessageCircle, Bell, LayoutDashboard, Info, LogIn,
} from "lucide-react";
import { Button } from './ui/Button.jsx';
import { Avatar } from './ui/Avatar.jsx';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabaseClient';
import Logo from "../assets/Lucid.png";

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
  const [userProfile, setUserProfile] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const { showNotification } = useNotification();
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
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setUserProfile(null);
        setProviderProfile(null);
        setNotificationCount(0);
        setMessageCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setUserProfile(data);
  };

  const fetchProviderProfile = async (userId) => {
    const { data } = await supabase
      .from('provider_profiles')
      .select('avatar_url, first_name, last_name')
      .eq('user_id', userId)
      .single();
    if (data) setProviderProfile(data);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showNotification('Logged out successfully', 'success');
    handleLinkClick();
    navigate('/lucid/', { replace: true });
  };

  const toggleMenu = () => { setIsOpen(!isOpen); };
  const handleLinkClick = () => { setIsOpen(false); };

  const getUserDisplayName = () => {
    if (providerProfile?.first_name) return providerProfile.first_name;
    if (userProfile?.first_name) return userProfile.first_name;
    return user?.email?.split('@')[0] || 'User';
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
    // Priority: provider_profile avatar > profile avatar > null
    if (providerProfile?.avatar_url) return providerProfile.avatar_url;
    if (userProfile?.avatar_url) return userProfile.avatar_url;
    return null;
  };

  const getDashboardPath = () => {
    if (userProfile?.role === 'service_provider') {
      return '/lucid/account/profile';
    }
    return '/lucid/dashboard';
  };

  const totalNotifications = notificationCount + messageCount;

  const navLinks = [
    { to: "/lucid/become-provider", label: "Join as a worker", icon: BriefcaseBusiness },
    { to: "/lucid/services",        label: "Services",          icon: Hammer },
    { to: "/lucid/about",           label: "About",             icon: Info },
  ];

  const userMenuLinks = [
    ...(userProfile?.role === 'service_provider'
      ? [{ to: '/lucid/account/profile', label: "My Profile" }]
      : []),
    { to: getDashboardPath(), label: "Dashboard" },
    { to: "/lucid/messages",       label: "Messages",      badge: messageCount },
    { to: "/lucid/notifications",  label: "Notifications", badge: notificationCount },
  ];

  const mobileUserLinks = [
    { to: "/lucid/messages",      label: "Messages",      icon: MessageCircle, badge: messageCount },
    { to: "/lucid/notifications", label: "Notifications", icon: Bell,          badge: notificationCount },
    { to: getDashboardPath(),     label: "Dashboard",     icon: LayoutDashboard },
  ];

  return (
    <>
      <nav className="navbar bg-white h-20 border-b border-gray-200 sticky top-0 z-30">
        {/* Logo */}
        <div className="navbar-start ml-4 md:ml-12">
          <Link to="/lucid/" className="flex items-center">
            <img src={Logo} alt="Lucid Logo" className="h-5 w-20 object-cover" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-end mr-4">
          <div className="hidden lg:flex items-center gap-2">
            {/* Navigation Links */}
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="px-4 py-2 text-gray-700 hover:text-secondary font-medium transition-colors rounded-lg hover:bg-secondary-50 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Profile / Sign In */}
          {isLoggedIn ? (
            <div className="dropdown dropdown-end ml-4 hidden lg:block relative">
              <div
                tabIndex={0}
                role="button"
                className="relative flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <NotificationBadge count={totalNotifications} className="top-1 right-20" />
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={getFullName()}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <Avatar name={getFullName()} size="md" />
                )}
                <span className="font-medium text-gray-800">{getUserDisplayName()}</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>

              <ul
                tabIndex={0}
                className="dropdown-content menu bg-white rounded-lg z-50 w-52 p-2 shadow-lg border border-gray-200 mt-2"
              >
                {userMenuLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className="text-gray-700 hover:bg-secondary-50 hover:text-secondary rounded-md transition-colors relative flex items-center justify-between"
                    >
                      <span>{link.label}</span>
                      <NotificationBadge count={link.badge} className="relative top-0 right-0 w-4 h-4 p-2" />
                    </Link>
                  </li>
                ))}
                <li className="border-t border-gray-200 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="text-error hover:bg-error-50 rounded-md transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/lucid/signin">
              <Button variant="secondary" size="sm" className="ml-4 hidden lg:block whitespace-nowrap">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden z-50 p-2 ml-4 bg-secondary text-white rounded-lg hover:bg-secondary-hover active:scale-95 transition-colors shadow-md relative"
            aria-label="Toggle menu"
          >
            {isLoggedIn && <NotificationBadge count={totalNotifications} />}
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
        className={`fixed top-0 left-0 h-dvh w-72 bg-white shadow-2xl z-50 transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-dvh flex flex-col">
          {/* Logo */}
          <div className="mb-6">
            <img src={Logo} alt="Lucid Logo" className="h-5 w-28 object-cover m-1" />
          </div>

          {/* User Profile (Mobile) */}
          {isLoggedIn && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt={getFullName()} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <Avatar name={getFullName()} size="lg" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{getUserDisplayName()}</p>
                  {userProfile?.role === 'service_provider' && (
                    <Link
                      to="/lucid/account/profile"
                      onClick={handleLinkClick}
                      className="text-sm text-primary hover:text-secondary transition-colors"
                    >
                      View Profile
                    </Link>
                  )}
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
                  className="flex items-center space-x-3 text-gray-700 hover:text-secondary hover:bg-secondary-50 p-3 rounded-lg transition-colors"
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
                  className="flex items-center justify-between text-gray-700 hover:text-secondary hover:bg-secondary-50 p-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3 relative">
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      <NotificationBadge count={link.badge} className="-top-2 rounded-full left-2 w-3 h-3" />
                    </div>
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Auth Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {isLoggedIn ? (
              <Button variant="danger" fullWidth onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            ) : (
              <Link to="/lucid/signin" onClick={handleLinkClick}>
                <Button variant="secondary" fullWidth>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;