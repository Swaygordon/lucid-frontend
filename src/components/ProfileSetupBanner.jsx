import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useRole } from '../hooks/useRole';
import { useNotification } from '../contexts/NotificationContext';
import { PROFILE_SETUP_KEY } from '../pages/provider_profile_setup';

// Pages where this banner should never render
const EXCLUDED_PATHS = [
  '/lucid/account/profile/setup',
  '/lucid/signin',
  '/lucid/signup',
  '/lucid/become-provider',
];

const ProfileSetupBanner = () => {
  const role = useRole();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showNotification } = useNotification();

  // Re-read localStorage on every route change so banner hides as soon as setup completes
  const [isComplete, setIsComplete] = useState(
    () => localStorage.getItem(PROFILE_SETUP_KEY) === 'true'
  );

  useEffect(() => {
    setIsComplete(localStorage.getItem(PROFILE_SETUP_KEY) === 'true');
  }, [pathname]);

  // Show one toast per browser session — fires when role resolves and profile is incomplete
  useEffect(() => {
    if (role !== 'service_provider' || isComplete) return;
    if (sessionStorage.getItem('lucid_profile_reminder_shown')) return;
    sessionStorage.setItem('lucid_profile_reminder_shown', 'true');
    showNotification(
      'Complete your provider profile to start receiving bookings.',
      'warning',
      6000
    );
  }, [role, isComplete]);

  if (
    role !== 'service_provider' ||
    isComplete ||
    EXCLUDED_PATHS.some(p => pathname.startsWith(p))
  ) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-amber-800 min-w-0">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          Your provider profile is incomplete — clients can't find you yet.
        </span>
      </div>
      <button
        onClick={() => navigate('/lucid/account/profile/setup')}
        className="flex-shrink-0 text-sm font-semibold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors"
      >
        Set Up Profile
      </button>
    </div>
  );
};

export default ProfileSetupBanner;
