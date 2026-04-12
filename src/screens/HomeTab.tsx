import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

import HomeScreen from '../components/HomeScreen';
import { useAuthStore } from '../store/authStore';
import { useSegmentStore } from '../store/segmentStore';
import { loadStarredSegments, getStarredSegmentCount } from '../services/segmentService';
import { syncStarredSegments } from '../services/segmentSync';
import { refreshStravaToken } from '../services/stravaAuth';

type Nav = StackNavigationProp<RootStackParamList>;

const SYNC_STALE_SEC = 60 * 60; // re-sync segments if > 1 hour old

export default function HomeTab() {
  const navigation = useNavigation<Nav>();
  const rider = useAuthStore((s) => s.rider);
  const jwt = useAuthStore((s) => s.jwt);
  const stravaAccessToken = useAuthStore((s) => s.stravaAccessToken);
  const stravaRefreshToken = useAuthStore((s) => s.stravaRefreshToken);
  const stravaTokenExpiresAt = useAuthStore((s) => s.stravaTokenExpiresAt);
  const lastSegmentSyncAt = useAuthStore((s) => s.lastSegmentSyncAt);
  const setStravaToken = useAuthStore((s) => s.setStravaToken);
  const setLastSegmentSyncAt = useAuthStore((s) => s.setLastSegmentSyncAt);
  const setStarredSegments = useSegmentStore((s) => s.setStarredSegments);
  const starredSegments = useSegmentStore((s) => s.starredSegments);

  const [segmentCount, setSegmentCount] = useState(() => getStarredSegmentCount());
  const [lastSynced, setLastSynced] = useState('—');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Store already hydrated from App.tsx — update count
    if (starredSegments.length > 0) {
      setSegmentCount(starredSegments.length);
      setLastSynced(formatSyncAge(lastSegmentSyncAt));
    }
  }, [starredSegments.length, lastSegmentSyncAt]);

  // Background sync: fetch from Strava if stale or empty
  useEffect(() => {
    if (!stravaAccessToken || !stravaRefreshToken || !jwt) return;
    if (isSyncing) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const isStale = !lastSegmentSyncAt || (nowSec - lastSegmentSyncAt) > SYNC_STALE_SEC;
    const isEmpty = getStarredSegmentCount() === 0;

    if (!isStale && !isEmpty) return;

    let cancelled = false;

    (async () => {
      setIsSyncing(true);
      setLastSynced('Syncing…');

      let token = stravaAccessToken;
      if (stravaTokenExpiresAt && stravaTokenExpiresAt < nowSec + 60) {
        try {
          const refreshed = await refreshStravaToken(stravaRefreshToken, jwt);
          token = refreshed.accessToken;
          setStravaToken(refreshed.accessToken, refreshed.expiresAt);
        } catch {
          setIsSyncing(false);
          setLastSynced('Sync failed');
          return;
        }
      }

      try {
        await syncStarredSegments(token);
        if (cancelled) return;
        const segs = await loadStarredSegments();
        setStarredSegments(segs);
        setSegmentCount(segs.length);
        const ts = Math.floor(Date.now() / 1000);
        setLastSegmentSyncAt(ts);
        setLastSynced('Just now');
      } catch {
        if (!cancelled) setLastSynced('Sync failed');
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => { cancelled = true; };
  }, [stravaAccessToken]);

  const firstName = rider?.name.split(' ')[0] ?? 'Rider';

  return (
    <HomeScreen
      athleteName={firstName}
      starredSegmentCount={segmentCount}
      lastSyncedAt={lastSynced}
      recentRides={[]}
      canStartRideDirectly={segmentCount > 0}
      onPlanRide={() => navigation.navigate('Ride', { screen: 'RouteSetup' })}
      onStartRide={() => navigation.navigate('Ride', { screen: 'InRide' })}
      onRideTap={(_rideId) => navigation.navigate('Ride', { screen: 'PostRideSummary', params: { rideId: _rideId } })}
    />
  );
}

function formatSyncAge(ts: number | null): string {
  if (!ts) return '—';
  const ageSec = Math.floor(Date.now() / 1000) - ts;
  if (ageSec < 60) return 'Just now';
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
  if (ageSec < 86400) return `${Math.floor(ageSec / 3600)}h ago`;
  return `${Math.floor(ageSec / 86400)}d ago`;
}
