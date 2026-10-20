export const PROFILE_SETUP_KEY = 'lucid_provider_profile_complete';

export const markProfileComplete = () => {
  localStorage.setItem(PROFILE_SETUP_KEY, 'true');
};

export const isProviderProfileComplete = (profile) => Boolean(profile)
  && Boolean(String(profile.first_name ?? '').trim())
  && Boolean(String(profile.last_name ?? '').trim())
  && Boolean(String(profile.occupation ?? '').trim())
  && Boolean(String(profile.location ?? '').trim())
  && Array.isArray(profile.categories)
  && profile.categories.length > 0
  && (
    (Array.isArray(profile.selected_days) && profile.selected_days.length > 0)
    || Boolean(profile.weekdays_time)
    || Boolean(profile.weekend_time)
    || (
      profile.custom_days
      && typeof profile.custom_days === 'object'
      && Object.values(profile.custom_days).some(day => day && day.selected)
    )
  );
