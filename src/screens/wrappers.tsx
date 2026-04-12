/**
 * Screen wrappers connect navigator route params to component props.
 * Mock data is used in Phase 0. Each wrapper is replaced with real
 * data hookups in the corresponding phase (1–5).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSegmentStore } from '../store/segmentStore';
import { useAuthStore } from '../store/authStore';
import { loadStarredSegments } from '../services/segmentService';
import { GoalMode } from '../components/RouteSetupScreen';
import { StravaActivitySummary } from '../services/stravaApi';
import { matchSegmentsToRoute, MatchedSegment } from '../services/routeMatching';
import { decodePolyline, LatLng } from '../utils/polyline';
import { generateCuesForSegments } from '../services/cueGeneration';
import { saveCues, getExistingCueSegmentIds } from '../services/cueService';
import { getCachedActivities, refreshActivities } from '../services/activityService';
import { CueStatus } from '../components/CueGenerationScreen';

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
  const [goalMode, setGoalMode] = useState<GoalMode>('training');

  // Segment store
  const starredSegments = useSegmentStore((s) => s.starredSegments);
  const setStarredSegments = useSegmentStore((s) => s.setStarredSegments);

  // Auth
  const stravaAccessToken = useAuthStore((s) => s.stravaAccessToken);

  // Activity picker state — show cached immediately
  const [recentActivities, setRecentActivities] = useState<StravaActivitySummary[]>(
    () => getCachedActivities(),
  );
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [previewedActivity, setPreviewedActivity] = useState<StravaActivitySummary | null>(null);
  const [confirmedActivityId, setConfirmedActivityId] = useState<number | null>(null);

  // Route state
  const [routePolyline, setRoutePolyline] = useState<LatLng[] | null>(null);
  const [matchedSegments, setMatchedSegments] = useState<MatchedSegment[]>([]);

  // Load segments from SQLite if store is empty (fallback — normally hydrated in App.tsx)
  useEffect(() => {
    if (starredSegments.length > 0) return;
    loadStarredSegments()
      .then(segs => setStarredSegments(segs))
      .catch(() => {});
  }, []);

  // Background refresh activities from Strava
  useEffect(() => {
    if (!stravaAccessToken) return;
    if (recentActivities.length === 0) setIsLoadingActivities(true);
    refreshActivities(stravaAccessToken)
      .then(activities => setRecentActivities(activities))
      .catch(() => {})
      .finally(() => setIsLoadingActivities(false));
  }, [stravaAccessToken]);

  function handleActivityPreview(activity: StravaActivitySummary) {
    setPreviewedActivity(activity);
    const decoded = decodePolyline(activity.map.summary_polyline);
    setRoutePolyline(decoded);
    const matched = matchSegmentsToRoute(activity.map.summary_polyline, starredSegments);
    setMatchedSegments(matched);
  }

  function handleConfirmActivity() {
    if (!previewedActivity) return;
    setConfirmedActivityId(previewedActivity.id);
    setPreviewedActivity(null);
  }

  function handleClearPreview() {
    setPreviewedActivity(null);
    setRoutePolyline(null);
    setMatchedSegments([]);
  }

  function handleClearActivity() {
    setConfirmedActivityId(null);
    setPreviewedActivity(null);
    setRoutePolyline(null);
    setMatchedSegments([]);
  }

  function handleGenerateCues() {
    // If no activity selected (Skip mode), use all starred segments
    const segmentIds = matchedSegments.length > 0
      ? matchedSegments.map(ms => ms.segment.id)
      : starredSegments.map(s => s.id);
    navigation.navigate('CueGeneration', { segmentIds, goalMode });
  }

  return (
    <RouteSetupScreen
      routePolyline={routePolyline}
      matchedSegments={matchedSegments}
      recentActivities={recentActivities}
      isLoadingActivities={isLoadingActivities}
      previewedActivity={previewedActivity}
      confirmedActivityId={confirmedActivityId}
      onActivityPreview={handleActivityPreview}
      onConfirmActivity={handleConfirmActivity}
      onClearActivity={handleClearActivity}
      selectedGoalMode={goalMode}
      onGoalModeSelect={setGoalMode}
      onGenerateCues={handleGenerateCues}
      onBack={() => navigation.goBack()}
    />
  );
}

// ─── CueGeneration ────────────────────────────────────────────────────────────

export function CueGenerationScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  const route = useRoute<RouteProp<RideStackParamList, 'CueGeneration'>>();
  const { segmentIds, goalMode } = route.params;
  const starredSegments = useSegmentStore((s) => s.starredSegments);
  const jwt = useAuthStore((s) => s.jwt);

  const segmentsForRide = segmentIds
    .map(id => starredSegments.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  // Check which segments already have fresh cached cues
  const cachedIds = getExistingCueSegmentIds(segmentIds, goalMode);
  const segmentsToGenerate = segmentsForRide.filter(s => !cachedIds.has(s.id));

  const [statuses, setStatuses] = useState<Record<string, CueStatus>>(() =>
    Object.fromEntries(segmentsForRide.map(s => [
      s.id,
      cachedIds.has(s.id) ? 'done' as CueStatus : 'pending' as CueStatus,
    ])),
  );
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // All cues already cached — skip straight to PreRideBrief
    if (segmentsToGenerate.length === 0) {
      setTimeout(() => {
        navigation.navigate('PreRideBrief', { segmentIds, goalMode });
      }, 300);
      return;
    }

    if (!jwt) return;

    setStatuses(prev => {
      const next: Record<string, CueStatus> = { ...prev };
      for (const s of segmentsToGenerate) next[s.id] = 'active';
      return next;
    });

    (async () => {
      try {
        const cues = await generateCuesForSegments(segmentsToGenerate, goalMode, jwt);

        saveCues(
          cues.map(c => ({
            segmentId: segmentsToGenerate[c.segmentIndex].id,
            goalMode,
            aggressive: c.aggressive,
            moderate: c.moderate,
            recovery: c.recovery,
          })),
        );

        const done: Record<string, CueStatus> = {};
        for (const s of segmentsForRide) done[s.id] = 'done';
        setStatuses(done);

        setTimeout(() => {
          navigation.navigate('PreRideBrief', { segmentIds, goalMode });
        }, 450);
      } catch (err) {
        console.error('[cueGen] failed', err);
        navigation.navigate('PreRideBrief', { segmentIds, goalMode });
      }
    })();
  }, [jwt, segmentsToGenerate.length, goalMode, segmentIds, navigation]);

  const progressSegments = segmentsForRide.map(s => ({
    id: s.id,
    name: s.name,
    status: statuses[s.id] ?? 'pending',
  }));

  const uncachedCount = segmentsToGenerate.length;

  return (
    <CueGenerationScreen
      segments={progressSegments}
      estimatedSecondsRemaining={uncachedCount * 4}
      onSkip={() => navigation.navigate('PreRideBrief', { segmentIds, goalMode })}
    />
  );
}

// ─── PreRideBrief ─────────────────────────────────────────────────────────────

export function PreRideBriefScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  const route = useRoute<RouteProp<RideStackParamList, 'PreRideBrief'>>();
  const { segmentIds, goalMode } = route.params;
  const starredSegments = useSegmentStore((s) => s.starredSegments);

  const segments = segmentIds.map(id => {
    const seg = starredSegments.find(s => s.id === id);
    const hasHistory = (seg?.effortCount ?? 0) > 0;
    return {
      id,
      name: seg?.name ?? id,
      distanceKm: seg ? Math.round((seg.distanceM / 1000) * 10) / 10 : 0,
      cuesReady: hasHistory ? 3 : 0,
      bestTimeSec: seg?.bestTimeSec ?? undefined,
      isPRTarget: hasHistory,
      hasHistory,
    };
  });

  const prTargetCount = segments.filter(s => s.isPRTarget).length;
  const routeKm = Math.round(segments.reduce((sum, s) => sum + s.distanceKm, 0) * 10) / 10;

  const prNames = segments.filter(s => s.isPRTarget).map(s => s.name);
  const spokenBriefText = prTargetCount > 0
    ? `${segments.length} segment${segments.length !== 1 ? 's' : ''} ahead. ${prNames.join(' and ')} ${prTargetCount === 1 ? 'is your PR target' : 'are your PR targets'} today.`
    : `${segments.length} segment${segments.length !== 1 ? 's' : ''} on your route. No PR targets — ride at your ${goalMode} pace.`;

  return (
    <PreRideBriefScreen
      goalMode={goalMode}
      segmentCount={segments.length}
      prTargetCount={prTargetCount}
      routeKm={routeKm}
      spokenBriefText={spokenBriefText}
      isAudioPlaying={false}
      segments={segments}
      onStartRide={() => navigation.navigate('InRide')}
      onChangeGoalMode={() => navigation.goBack()}
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
      onDone={() => navigation.getParent()?.navigate('Main')}
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
