import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Hammer, BriefcaseBusiness, ArrowLeft, MapPin, LogOut, MessageCircle, Bell, Settings, Info, LogIn, User } from "lucide-react";
import { Button } from './ui/Button.jsx';
import { Avatar } from './ui/Avatar.jsx';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import Logo from "../assets/Lucid.png";

// Notification Badge Component
const NotificationBadge = ({ count = 0, className = "" }) => {
  if (!count || count <= 0) return null;

  return (
    <motion.span
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px]
        px-1 text-xs font-bold text-white bg-red-600
        rounded-full flex items-center justify-center
        ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
};

// Animation variants (same as before)
const fadeInUp = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

const slideIn = {
  hidden: { x: -300, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { 
    x: -300, 
    opacity: 0,
    transition: { duration: 0.1, ease: "easeIn" }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.1 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }
  }
};

const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAreaSubmenu, setShowAreaSubmenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [locations, setLocations] = useState([
    "Spintex", "Osu", "North-Ridge", "Madina",
    "Labadi", "Achimota", "Circle", "Tema"
  ]);
  
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchNotificationCounts(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchNotificationCounts(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setUserProfile(null);
        setNotificationCount(0);
        setMessageCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchNotificationCounts = async (userId) => {
    try {
      // Fetch unread notifications count
      const { count: notifCount, error: notifError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!notifError) setNotificationCount(notifCount || 0);

      // Fetch unread messages count
      const { count: msgCount, error: msgError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (!msgError) setMessageCount(msgCount || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setShowAreaSubmenu(false);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    setShowAreaSubmenu(false);
  };

  const handleAreaClick = () => {
    setShowAreaSubmenu(true);
  };

  const handleBackClick = () => {
    setShowAreaSubmenu(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showNotification('Logged out successfully', 'success');
      navigate('/lucid/');
      handleLinkClick();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const totalNotifications = notificationCount + messageCount;

  // Navigation configuration
  const navLinks = [
    { to: "/lucid/become-provider", label: "Join as a worker", icon: BriefcaseBusiness},
    { to: "/lucid/services", label: "Services", icon: Hammer },
    { to: "/lucid/about", label: "About", icon: Info },
  ];

  const userMenuLinks = [
    { to: "/lucid/profile", label: "My Profile" },
    { to: userProfile?.role === 'service_provider' ? "/lucid/provider-dashboard" : "/lucid/dashboard", label: "Dashboard" },
    { to: "/lucid/messages", label: "Messages", badge: messageCount },
    { to: "/lucid/notifications", label: "Notifications", badge: notificationCount },
  ];

  const mobileUserLinks = [
    { to: "/lucid/messages", label: "Messages", icon: MessageCircle, badge: messageCount },
    { to: "/lucid/notifications", label: "Notifications", icon: Bell, badge: notificationCount },
    { to: userProfile?.role === 'service_provider' ? "/lucid/provider-dashboard" : "/lucid/dashboard", label: "Dashboard", icon: Settings },
    { to: "/lucid/profile", label: "Profile", icon: User },
  ];

  const getUserDisplayName = () => {
    if (userProfile) {
      return `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user?.email?.split('@')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <>
      <nav className="navbar bg-white h-20 shadow-lg sticky top-0 z-30">
        {/* Logo */}
        <div className="navbar-start ml-4 md:ml-12">
          <Link to="/lucid/" className="flex items-center">
            <img
              src={Logo}
              alt="Lucid Logo"
              className="h-5 w-20 object-cover"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-end mr-4">
          <motion.div 
            className="hidden lg:flex items-center gap-2"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Area Dropdown */}
            <motion.div 
              className="dropdown dropdown-bottom"
              variants={fadeInUp}
            >
              <motion.div
                tabIndex={0}
                role="button"
                className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer rounded-lg hover:bg-orange-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Area</span>
                <ChevronDown className="w-4 h-4" />
              </motion.div>

              <ul
                tabIndex={0}
                className="dropdown-content menu bg-white rounded-lg z-50 w-52 p-2 shadow-lg border border-gray-200 max-h-64 overflow-y-auto"
              >
                {locations.map((location, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link 
                      to={`/lucid/services?location=${encodeURIComponent(location)}`} 
                      className="text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-colors"
                      onClick={handleLinkClick}
                    >
                      {location}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Navigation Links */}
            {navLinks.map((link, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
              >
                <Link
                  to={link.to}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 font-medium transition-colors rounded-lg hover:bg-orange-50"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

          </motion.div>

          {/* User Profile / Sign In */}
          {isLoggedIn ? (
            <motion.div 
              className="dropdown dropdown-end ml-4 hidden lg:block relative"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              {/* Avatar Button */}
              <motion.div
                tabIndex={0}
                role="button"
                className="relative flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <NotificationBadge
                  count={totalNotifications}
                  className="top-1 right-20"
                />

                <Avatar 
                  name={getUserDisplayName()} 
                  size="md" 
                  src={userProfile?.avatar_url}
                />
                <span className="font-medium text-gray-800">{getUserDisplayName().split(' ')[0]}</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </motion.div>

              {/* Dropdown Menu */}
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-white rounded-lg z-50 w-52 p-2 shadow-lg border border-gray-200 mt-2"
              >
                {userMenuLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      to={link.to} 
                      className="text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-colors relative flex items-center justify-between"
                      onClick={handleLinkClick}
                    >
                      <span>{link.label}</span>
                      {link.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {link.badge > 99 ? '99+' : link.badge}
                        </span>
                      )}
                    </Link>
                  </motion.li>
                ))}

                <li className="border-t border-gray-200 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:bg-red-50 rounded-md transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Logout
                  </button>
                </li>
              </ul>
            </motion.div>
          ) : (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Link to="/lucid/signin">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="ml-4 hidden lg:block"
                >
                  Sign In
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Mobile Menu Button */}
          <motion.button
            onClick={toggleMenu}
            className="lg:hidden z-50 p-2 ml-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md relative"
            aria-label="Toggle menu"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isLoggedIn && totalNotifications > 0 && (
              <NotificationBadge count={totalNotifications} />
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </nav>

      {/* Overlay and Mobile Menu (same as before) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            onClick={toggleMenu}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50"
            variants={slideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="p-6 h-full flex flex-col">
              {/* Logo */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <img src={Logo} alt="Lucid Logo" className="h-5 w-28 object-cover m-1" />
              </motion.div>

              {/* User Profile (Mobile) */}
              {isLoggedIn && !showAreaSubmenu && (
                <motion.div 
                  className="mb-6 pb-6 border-b border-gray-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      name={getUserDisplayName()} 
                      size="lg"
                      src={userProfile?.avatar_url}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{getUserDisplayName()}</p>
                      <Link 
                        to="/lucid/profile" 
                        onClick={handleLinkClick} 
                        className="text-sm text-blue-600 hover:text-orange-600 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Menu Items */}
              <motion.nav 
                className="space-y-2 flex-1 overflow-y-auto"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {!showAreaSubmenu ? (
                  <>
                    {/* Area Button */}
                    <motion.button
                      onClick={handleAreaClick}
                      className="w-full flex items-center justify-between text-gray-700 hover:text-orange-600 hover:bg-orange-50 p-3 rounded-lg transition-colors"
                      variants={fadeInUp}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">Area</span>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>

                    {/* Navigation Links */}
                    {navLinks.map((link, index) => {
                      const Icon = link.icon;
                      return (
                        <motion.div key={index} variants={fadeInUp}>
                          <Link
                            to={link.to}
                            onClick={handleLinkClick}
                            className="flex items-center space-x-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 p-3 rounded-lg transition-colors"
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}

                    {/* User Links with Badges */}
                    {isLoggedIn && mobileUserLinks.map((link, index) => {
                      const Icon = link.icon;
                      return (
                        <motion.div key={index} variants={fadeInUp}>
                          <Link
                            to={link.to}
                            onClick={handleLinkClick}
                            className="flex items-center justify-between text-gray-700 hover:text-orange-600 hover:bg-orange-50 p-3 rounded-lg transition-colors"
                          >
                            <div className="flex items-center space-x-3 relative">
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{link.label}</span>
                            </div>
                            {link.badge > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                {link.badge > 99 ? '99+' : link.badge}
                              </span>
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Back Button */}
                    <motion.button
                      onClick={handleBackClick}
                      className="w-full flex items-center space-x-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 p-3 rounded-lg transition-colors mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: -5 }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="font-medium">Back</span>
                    </motion.button>

                    <motion.div 
                      className="px-3 py-2 mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900">Select Area</h3>
                    </motion.div>

                    {locations.map((location, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={`/lucid/services?location=${encodeURIComponent(location)}`}
                          onClick={handleLinkClick}
                          className="flex items-center space-x-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 p-3 rounded-lg transition-colors"
                        >
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">{location}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.nav>

              {/* Auth Button */}
              {!showAreaSubmenu && (
                <motion.div 
                  className="mt-4 pt-4 border-t border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {isLoggedIn ? (
                    <Button  
                      variant="danger" 
                      fullWidth
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  ) : (
                    <Link to="/lucid/signin" onClick={handleLinkClick}>
                      <Button variant="secondary" fullWidth>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;