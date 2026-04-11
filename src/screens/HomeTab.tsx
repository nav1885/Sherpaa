/**
 * HomeTab wraps HomeScreen for Phase 0 with mock data.
 * Real data hookup happens in Phase 1 (auth store + DB queries).
 */
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

import HomeScreen from '../components/HomeScreen';

type Nav = StackNavigationProp<RootStackParamList>;

const MOCK_RIDES = [
  { id: '1', title: 'Morning Loop', date: 'Apr 10', distanceKm: 24.5, segmentCount: 3, prCount: 1 },
  { id: '2', title: 'Saturday Long Ride', date: 'Apr 8', distanceKm: 68.2, segmentCount: 7, prCount: 0 },
];

export default function HomeTab() {
  const navigation = useNavigation<Nav>();

  return (
    <HomeScreen
      athleteName="Nav"
      starredSegmentCount={0}
      lastSyncedAt="—"
      recentRides={MOCK_RIDES}
      canStartRideDirectly={false}
      onPlanRide={() => navigation.navigate('Ride', { screen: 'RouteSetup' })}
      onStartRide={() => navigation.navigate('Ride', { screen: 'InRide' })}
      onRideTap={(_rideId) => navigation.navigate('Ride', { screen: 'PostRideSummary', params: { rideId: _rideId } })}
    />
  );
}
