/**
 * Screen wrappers connect navigator route params to component props.
 * Mock data is used in Phase 0. Each wrapper is replaced with real
 * data hookups in the corresponding phase (1–5).
 */
import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import RouteSetupScreen from '../components/RouteSetupScreen';
import CueGenerationScreen from '../components/CueGenerationScreen';
import PreRideBriefScreen from '../components/PreRideBriefScreen';
import InRideScreen from '../components/InRideScreen';
import SegmentResultScreen from '../components/SegmentResultScreen';
import PostRideSummaryScreen from '../components/PostRideSummaryScreen';
import PaywallScreen from '../components/PaywallScreen';

import { RideStackParamList } from '../navigation/types';

type RideNav = StackNavigationProp<RideStackParamList>;

// ─── RouteSetup ───────────────────────────────────────────────────────────────

export function RouteSetupScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  const mockSegments = [
    { id: '1', name: 'Marin Ave Wall', distanceKm: 1.2, estimatedTimeSec: 272, isPRTarget: true, hasHistory: true },
    { id: '2', name: 'Grizzly Peak Climb', distanceKm: 3.1, estimatedTimeSec: 612, isPRTarget: true, hasHistory: true },
    { id: '3', name: 'Wildcat Canyon Sprint', distanceKm: 0.8, estimatedTimeSec: 0, isPRTarget: false, hasHistory: false },
  ];
  return (
    <RouteSetupScreen
      segmentsOnRoute={mockSegments}
      onRouteMethodSelect={() => {}}
      onGoalModeSelect={() => {}}
      onGenerateCues={() =>
        navigation.navigate('CueGeneration', { segmentIds: ['1', '2', '3'], goalMode: 'pr' })
      }
      onBack={() => navigation.goBack()}
    />
  );
}

// ─── CueGeneration ────────────────────────────────────────────────────────────

export function CueGenerationScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  // Mock segments for Phase 0
  const mockSegments = [
    { id: '1', name: 'Marin Ave Wall', status: 'done' as const },
    { id: '2', name: 'Grizzly Peak Climb', status: 'active' as const },
    { id: '3', name: 'Wildcat Canyon Sprint', status: 'pending' as const },
  ];
  return (
    <CueGenerationScreen
      segments={mockSegments}
      estimatedSecondsRemaining={12}
      onSkip={() => navigation.navigate('PreRideBrief', { segmentIds: ['1', '2', '3'], goalMode: 'pr' })}
    />
  );
}

// ─── PreRideBrief ─────────────────────────────────────────────────────────────

export function PreRideBriefScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  const mockSegments = [
    { id: '1', name: 'Marin Ave Wall', distanceKm: 1.2, cuesReady: 3, bestTimeSec: 272, isPRTarget: true, hasHistory: true },
    { id: '2', name: 'Grizzly Peak Climb', distanceKm: 3.1, cuesReady: 3, bestTimeSec: 612, isPRTarget: true, hasHistory: true },
    { id: '3', name: 'Wildcat Canyon Sprint', distanceKm: 0.8, cuesReady: 0, isPRTarget: false, hasHistory: false },
  ];
  return (
    <PreRideBriefScreen
      goalMode="pr"
      segmentCount={3}
      prTargetCount={2}
      routeKm={24.5}
      spokenBriefText="3 segments ahead. Marin Ave Wall and Grizzly Peak are your PR targets today. You tend to fade on Marin — go out conservative."
      isAudioPlaying={false}
      segments={mockSegments}
      onStartRide={() => navigation.navigate('InRide')}
      onChangeGoalMode={() => {}}
      onBack={() => navigation.goBack()}
    />
  );
}

// ─── InRide ───────────────────────────────────────────────────────────────────

export function InRideScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  return (
    <InRideScreen
      elapsedTime="0:00:00"
      speedKmh={0}
      distanceKm={0}
      gpsLocked={false}
      audioActive={false}
      nextSegment={{ name: 'Marin Ave Wall', distanceKm: 1.2 }}
      onEndRide={() => navigation.navigate('PostRideSummary', { rideId: 'mock-ride-id' })}
    />
  );
}

// ─── SegmentResult ────────────────────────────────────────────────────────────

export function SegmentResultScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  const route = useRoute<RouteProp<RideStackParamList, 'SegmentResult'>>();
  const { segmentName, finalTimeSec, isNewPR, gapToPreSeconds } = route.params;
  return (
    <SegmentResultScreen
      segmentName={segmentName}
      finalTimeSec={finalTimeSec}
      isNewPR={isNewPR}
      gapToPreSeconds={gapToPreSeconds}
      onDismiss={() => navigation.goBack()}
    />
  );
}

// ─── PostRideSummary ──────────────────────────────────────────────────────────

export function PostRideSummaryScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  const mockResults = [
    {
      id: '1', name: 'Marin Ave Wall', timeSec: 268, isNewPR: true,
      gapToPreSeconds: -4, prTimeSec: 272, wasSkipped: false,
      cueTextPlayed: "You tend to fade on the back half — go out 5% easier than feels right.",
    },
    {
      id: '2', name: 'Grizzly Peak Climb', timeSec: 631, isNewPR: false,
      gapToPreSeconds: 19, prTimeSec: 612, wasSkipped: false,
    },
    {
      id: '3', name: 'Wildcat Canyon Sprint', timeSec: 0, isNewPR: false,
      gapToPreSeconds: 0, wasSkipped: true,
    },
  ];
  return (
    <PostRideSummaryScreen
      rideName="Morning Ride"
      rideDate="Apr 11"
      distanceKm={24.5}
      durationSec={5400}
      elevationM={610}
      segmentResults={mockResults}
      stravaSynced={false}
      debriefText="Strong ride today — you set a new PR on Marin Ave Wall, beating your best by 4 seconds. You lost time on Grizzly in the final third. Next time, hold back 5% on the lower slopes."
      onListenDebrief={() => {}}
      onShare={() => {}}
      onDone={() => navigation.navigate('InRide')}
    />
  );
}

// ─── Paywall ──────────────────────────────────────────────────────────────────

export function PaywallScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  return (
    <PaywallScreen
      onClose={() => navigation.goBack()}
      onSelectPlan={(planId) => {
        console.log('Selected plan:', planId);
        navigation.goBack();
      }}
      onRestorePurchases={() => {}}
      trialEligible={true}
    />
  );
}
