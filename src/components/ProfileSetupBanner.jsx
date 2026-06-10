import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useRole } from '../hooks/useRole';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabaseClient';
import { PROFILE_SETUP_KEY, markProfileComplete, isProviderProfileComplete } from '../pages/provider_profile_setup';

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

  const flagComplete = localStorage.getItem(PROFILE_SETUP_KEY) === 'true';
  const [isComplete, setIsComplete] = useState(flagComplete);
  // `verified` gates rendering/toast until completeness is confirmed (flag OR DB),
  // so a provider whose profile is complete in Supabase never sees a wrong flash.
  const [verified, setVerified] = useState(flagComplete);

  // Re-read localStorage on every route change so banner hides as soon as setup completes
  useEffect(() => {
    if (localStorage.getItem(PROFILE_SETUP_KEY) === 'true') {
      setIsComplete(true);
      setVerified(true);
    }
  }, [pathname]);

  // Authoritative check: the localStorage flag is only set by the setup flow, so a
  // provider who completed their profile another way (or on another device) still
  // has first_name in provider_profiles. Mirror sign_in's check and self-heal the flag.
  useEffect(() => {
    if (role !== 'service_provider' || isComplete) return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) return;
      const { data } = await supabase
        .from('provider_profiles')
        .select('first_name, last_name, occupation, location, categories, selected_days, weekdays_time, weekend_time, custom_days')
        .eq('user_id', session.user.id)
        .single();
      if (cancelled) return;
      if (isProviderProfileComplete(data)) {
        markProfileComplete();
        setIsComplete(true);
      }
      setVerified(true);
    })();
    return () => { cancelled = true; };
  }, [role, isComplete]);

  // Show one toast per browser session — only once completeness is verified as incomplete
  useEffect(() => {
    if (role !== 'service_provider' || isComplete || !verified) return;
    if (sessionStorage.getItem('lucid_profile_reminder_shown')) return;
    sessionStorage.setItem('lucid_profile_reminder_shown', 'true');
    showNotification(
      'Complete your provider profile to start receiving bookings.',
      'warning',
      6000
    );
  }, [role, isComplete, verified]);

  if (
    role !== 'service_provider' ||
    isComplete ||
    !verified ||
    EXCLUDED_PATHS.some(p => pathname.startsWith(p))
  ) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/40 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 min-w-0">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          Your provider profile is incomplete — clients can't find you yet.
        </span>
      </div>
      <button
        onClick={() => navigate('/lucid/account/profile/setup')}
        className="flex-shrink-0 text-sm font-semibold text-amber-900 dark:text-amber-200 bg-amber-200 dark:bg-amber-700/40 hover:bg-amber-300 dark:hover:bg-amber-700/60 px-3 py-1 rounded-lg transition-colors"
      >
        Set Up Profile
      </button>
    </div>
  );
};

export default ProfileSetupBanner;
