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

export default function HomeTab() {
  const navigation = useNavigation<Nav>();
  const rider = useAuthStore((s) => s.rider);
  const jwt = useAuthStore((s) => s.jwt);
  const stravaAccessToken = useAuthStore((s) => s.stravaAccessToken);
  const stravaRefreshToken = useAuthStore((s) => s.stravaRefreshToken);
  const stravaTokenExpiresAt = useAuthStore((s) => s.stravaTokenExpiresAt);
  const setStravaToken = useAuthStore((s) => s.setStravaToken);
  const setStarredSegments = useSegmentStore((s) => s.setStarredSegments);
  const starredSegments = useSegmentStore((s) => s.starredSegments);

  const [segmentCount, setSegmentCount] = useState(0);
  const [lastSynced, setLastSynced] = useState('—');

  // Load segments from DB, or sync from Strava if DB is empty
  useEffect(() => {
    async function loadOrSync() {
      const count = getStarredSegmentCount();

      if (count > 0) {
        setSegmentCount(count);
        const segs = await loadStarredSegments();
        setStarredSegments(segs);
        setLastSynced('Just now');
        return;
      }

      // DB empty — try to sync from Strava
      if (!stravaAccessToken || !stravaRefreshToken || !jwt) return;

      let token = stravaAccessToken;
      const nowSec = Math.floor(Date.now() / 1000);
      if (stravaTokenExpiresAt && stravaTokenExpiresAt < nowSec + 60) {
        try {
          const refreshed = await refreshStravaToken(stravaRefreshToken, jwt);
          token = refreshed.accessToken;
          setStravaToken(refreshed.accessToken, refreshed.expiresAt);
        } catch {
          return; // Can't refresh — give up silently
        }
      }

      try {
        setLastSynced('Syncing…');
        await syncStarredSegments(token);
        const segs = await loadStarredSegments();
        setStarredSegments(segs);
        setSegmentCount(segs.length);
        setLastSynced('Just now');
      } catch {
        setLastSynced('Sync failed');
      }
    }

    loadOrSync();
  }, []);

  // Keep count in sync with store
  useEffect(() => {
    setSegmentCount(starredSegments.length);
  }, [starredSegments.length]);

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
