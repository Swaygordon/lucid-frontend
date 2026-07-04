import React, { useState, useCallback, useEffect } from "react";
import BackToTop from '../components/back_the_top_btn.jsx';
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext.jsx";
import { useImageUpload } from "../hooks/useImageUpload.js";
import { ImageUploadModal, LogoutConfirmModal } from "../components/shared";
import { PageHeader } from "../components/ui";
import { useNavigateBack } from "../hooks/useNavigateBack.js";
import { supabase } from '../lib/supabaseClient';
import { useProviderProfile } from '../hooks/useProviderProfile';
import {
  Upload,
  Camera,
  MapPin,
  Settings,
  Bell,
  LogOut,
  History,
  ClipboardList,
  DollarSign,
  HelpCircle,
  ChevronRight
} from "lucide-react";

function ProviderAccountOverview() {
  const handleBackClick = useNavigateBack('/lucid/dashboard', 600);
  const upload = useImageUpload();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    showNotification('Logged out successfully', 'success');
    setShowLogoutConfirm(false);
    navigate('/lucid/', { replace: true });
  };

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setCurrentUserEmail(session.user.email || '');
      }
    });
  }, []);
  const { profile } = useProviderProfile(currentUserId);
  const displayName     = profile?.name || '';
  const displayInitials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const displayLocation = profile?.location || '';
  const providerStats   = { completed: 0, active: 0 };

  // Navigation items configuration
  const navigationItems = [
    {
      to: "/lucid/account/settings",
      icon: Settings,
      label: "Account Settings",
      description: "Manage your personal information"
    },
    {
      to: "/lucid/bookings",
      icon: ClipboardList,
      label: "Tasks",
      description: "View and manage bookings"
    },
    {
      to: "/lucid/earnings",
      icon: DollarSign,
      label: "Earnings & Payments",
      description: "Track earnings and withdrawals"
    },
    {
      to: "/lucid/bookings/history",
      icon: History,
      label: "History",
      description: "View past jobs and transactions"
    },
    {
      to: "/lucid/notifications/settings",
      icon: Bell,
      label: "Notification Settings",
      description: "Customize your notifications"
    },
    {
      to: "/lucid/help",
      icon: HelpCircle,
      label: "Help & Support",
      description: "Get help and contact support"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] font-sans">
      <PageHeader
        title="My Account"
        subtitle="Manage your account details, bookings,history and earnings"
        onBack={handleBackClick}
      />

      <div className="flex items-center justify-center p-5 pb-20 md:pb-5">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
        {/* Profile Card */}
        <div 
          className="md:col-span-2 max-h-[30rem] lg:mt-24 bg-white dark:bg-[#1a1f2e] rounded-3xl p-8 shadow-custom border dark:border-[#1e293b] text-center backdrop-blur-sm animate-fade-in"
        >
          {/* Profile Picture with Hover Effect */}
          <div 
            className="relative w-24 h-24 mx-auto mb-4 cursor-pointer transition-transform duration-300 hover:scale-105 group"
            onClick={upload.openModal}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-full h-full rounded-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {displayInitials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Upload Button */}
          <button 
            onClick={upload.openModal}
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 mx-auto mb-5 shadow-md hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>

          {/* User Info */}
          {/* [MOCK] Replace with GET /users/:id/overview — {name, email, location, completedProjects, activeProjects} */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-1">{displayName}</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-2 text-base">{currentUserEmail}</p>
          {displayLocation && (
            <p className="text-gray-600 dark:text-slate-400 text-sm flex items-center justify-center gap-2 mb-6">
              <MapPin className="w-4 h-4" />
              {displayLocation}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-around items-center bg-slate-50 dark:bg-[#252b3b] rounded-2xl p-5 mt-4 border border-slate-200 dark:border-[#1e293b]">
            <div className="text-center flex-1">
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Completed Projects</p>
              <p className="text-indigo-500 text-2xl font-bold">{providerStats.completed}</p>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div className="text-center flex-1">
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Active Projects</p>
              <p className="text-indigo-500 text-2xl font-bold">{providerStats.active}</p>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div 
          className="md:col-span-3 lg:mt-24 flex flex-col gap-4 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link 
                key={index}
                to={item.to} 
                className="bg-white dark:bg-[#1a1f2e] w-full border-2 border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 cursor-pointer transition-all duration-300 flex items-center justify-between text-left hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-xl group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-gray-800 dark:text-slate-200 font-semibold text-base block mb-1">
                      {item.label}
                    </span>
                    <span className="text-gray-500 dark:text-slate-400 text-sm">
                      {item.description}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-indigo-500 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            );
          })}

          {/* Logout Button */}
          <div className="mt-2">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-gradient-to-r w-full from-red-600 to-red-700 text-white px-6 py-4 rounded-2xl font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 hover:shadow-xl"
            >
              <LogOut size={20} />
              Log out
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={upload.open}
        onClose={upload.closeModal}
        onUpload={() => {}}
        title="Upload Image"
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />

      <BackToTop />
    </div>
  );
}

export default ProviderAccountOverview;