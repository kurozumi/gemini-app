'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useMaintenanceMode() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkMaintenance() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'is_maintenance')
          .single();

        if (!error && data) {
          setIsMaintenance(data.value === 'true');
        }
      } catch (err) {
        console.error('Failed to check maintenance mode:', err);
      } finally {
        setLoading(false);
      }
    }

    checkMaintenance();
  }, []);

  return { isMaintenance, loading };
}
