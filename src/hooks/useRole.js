import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRole() {
  const [role, setRole] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('profiles').select('role').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setRole(data.role); });
    });
  }, []);
  return role;
}
