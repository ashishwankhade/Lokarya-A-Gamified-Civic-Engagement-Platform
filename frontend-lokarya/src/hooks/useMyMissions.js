/**
 * useMyMissions.js
 * Shared hook — fetches all missions owned by the authenticated NGO.
 * Replaces the duplicated GET /activities + client-side filter pattern
 * that existed in MissionManager, NGOAnalytics, and NGOOverview.
 *
 * Path: src/hooks/useMyMissions.js
 */

import { useState, useEffect, useCallback } from 'react';
import api       from '../api/axios';
import { useAuth } from '../context/AuthContext';

/**
 * @returns {{ missions: Activity[], loading: boolean, reload: () => void }}
 */
const useMyMissions = () => {
  const { user }                    = useAuth();
  const [missions, setMissions]     = useState([]);
  const [loading,  setLoading]      = useState(true);

  const load = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      /**
       * Preferred: dedicated NGO-scoped endpoint that returns ALL statuses.
       *   GET /api/activities/my
       *
       * Fallback (if backend not yet updated): fetch all and filter client-side.
       * Replace the fallback once the backend route exists.
       */
      let data;
      try {
        const res = await api.get('/activities/my');
        data = res.data;
      } catch (err) {
        // 404 → backend route not yet deployed; fall back to public list + filter
        if (err.response?.status === 404) {
          const res = await api.get('/activities');
          const all = Array.isArray(res.data) ? res.data : [];
          data = all.filter(m => {
            const ngoId = typeof m.ngo === 'object' ? m.ngo._id : m.ngo;
            return ngoId?.toString() === user._id?.toString();
          });
        } else {
          throw err;
        }
      }
      setMissions(Array.isArray(data) ? data : []);
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => { load(); }, [load]);

  return { missions, loading, reload: load };
};

export default useMyMissions;
