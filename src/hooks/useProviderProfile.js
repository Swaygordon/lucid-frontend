import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Fetches a provider's profile from the Supabase `profiles` table (already integrated).
 * Reviews and booking stats are NOT fetched here — those tables are pending backend
 * implementation. The calling component keeps its own mock reviews/stats as simulation.
 *
 * @param {string|null} userId  Supabase auth UUID of the provider
 * @returns {{ profile, loading }}
 */
export const useProviderProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setProfile(data);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  // Map DB row → shape expected by both profile pages
  const mapped = profile
    ? {
        id:             profile.id,
        name:           [profile.first_name, profile.other_name, profile.last_name].filter(Boolean).join(' ') || 'Provider',
        role:           profile.occupation   || 'Service Provider',
        phone:          profile.phone_number || '',
        avatar_url:     profile.avatar_url   ?? null,
        isVerified:     profile.is_verified  ?? false,
        location:       [profile.address, profile.city].filter(Boolean).join(', ') || 'Accra, Ghana',
        bio:            profile.bio              || '',
        skills:         profile.skills          || [],
        certifications: profile.certifications  || [],
        languages:      profile.languages       || [],
        paymentMethods: profile.payment_methods || 'Cash, Mobile Money',
        workingHours:   profile.working_hours   || { weekdays: 'Mon – Fri', weekends: 'By appointment' },
        employees:      profile.employees_count ?? 0,
        experience:     profile.years_experience ?? 0,
        availability:   profile.availability_status || 'Available',
      }
    : null;

  return { profile: mapped, loading };
};
