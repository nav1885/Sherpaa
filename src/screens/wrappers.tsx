/**
 * Screen wrappers connect navigator route params to component props.
 * Mock data is used in Phase 0. Each wrapper is replaced with real
 * data hookups in the corresponding phase (1–5).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSegmentStore } from '../store/segmentStore';
import { useAuthStore } from '../store/authStore';
import { useRideStore } from '../store/rideStore';
import { loadStarredSegments } from '../services/segmentService';
import { TTL } from '../constants/ttl';
import { GoalMode } from '../components/RouteSetupScreen';
import { StravaActivitySummary } from '../services/stravaApi';
import { matchSegmentsToRoute, MatchedSegment } from '../services/routeMatching';
import { decodePolyline, LatLng, haversineMetres } from '../utils/polyline';
import { generateCuesForSegments } from '../services/cueGeneration';
import { saveCues, getExistingCueSegmentIds } from '../services/cueService';
import { getCachedActivities, refreshActivities } from '../services/activityService';
import { syncSegmentDetails } from '../services/segmentSync';
import { startRideEngine, stopRideEngine, getRideStartTime } from '../services/rideEngine';
import { saveRide, generateDebrief } from '../services/rideService';
import { loadRideDetail } from '../services/rideHistoryService';
import { speak } from '../services/ttsService';
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
  const lastActivityFetchAt = useAuthStore((s) => s.lastActivityFetchAt);
  const setLastActivityFetchAt = useAuthStore((s) => s.setLastActivityFetchAt);
  const lastRideEndedAt = useRideStore((s) => s.lastRideEndedAt);

  // Activity picker state — show cached immediately
  const [recentActivities, setRecentActivities] = useState<StravaActivitySummary[]>(
    () => getCachedActivities(),
  );
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isRefreshingActivities, setIsRefreshingActivities] = useState(false);
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

  // Staleness-gated activity refresh
  useEffect(() => {
    console.log('[RouteSetup] activity effect — token:', stravaAccessToken ? 'yes' : 'null',
      'lastFetch:', lastActivityFetchAt, 'cached:', recentActivities.length);
    if (!stravaAccessToken) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const isStale = !lastActivityFetchAt || (nowSec - lastActivityFetchAt) > TTL.ACTIVITY_SEC;
    const justRode = lastRideEndedAt && (!lastActivityFetchAt || lastRideEndedAt / 1000 > lastActivityFetchAt);

    if (!isStale && !justRode && recentActivities.length > 0) {
      console.log('[RouteSetup] cache fresh, skipping');
      return;
    }

    console.log('[RouteSetup] fetching activities...');
    if (recentActivities.length === 0) setIsLoadingActivities(true);
    refreshActivities(stravaAccessToken)
      .then(activities => {
        console.log('[RouteSetup] got', activities.length, 'activities');
        setRecentActivities(activities);
        setLastActivityFetchAt(Math.floor(Date.now() / 1000));
      })
      .catch(err => console.error('[RouteSetup] activity refresh failed:', err))
      .finally(() => setIsLoadingActivities(false));
  }, [stravaAccessToken]);

  // Compute staleness label for UI
  const activitiesStalenessLabel = useMemo(() => {
    if (!lastActivityFetchAt) return null;
    const ageSec = Math.floor(Date.now() / 1000) - lastActivityFetchAt;
    if (ageSec < 30 * 60) return null; // Hide if < 30 min old
    if (ageSec < 3600) return `Updated ${Math.floor(ageSec / 60)}m ago`;
    if (ageSec < 86400) return `Updated ${Math.floor(ageSec / 3600)}h ago`;
    return `Updated ${Math.floor(ageSec / 86400)}d ago`;
  }, [lastActivityFetchAt]);

  // Pull-to-refresh handler — bypasses TTL
  function handleRefreshActivities() {
    if (!stravaAccessToken) return;
    setIsRefreshingActivities(true);
    refreshActivities(stravaAccessToken)
      .then(activities => {
        setRecentActivities(activities);
        setLastActivityFetchAt(Math.floor(Date.now() / 1000));
      })
      .catch(err => console.error('[RouteSetup] manual refresh failed:', err))
      .finally(() => setIsRefreshingActivities(false));
  }

  function handleActivityPreview(activity: StravaActivitySummary) {
    setPreviewedActivity(activity);
    const decoded = decodePolyline(activity.map.summary_polyline);
    setRoutePolyline(decoded);
    const matched = matchSegmentsToRoute(activity.map.summary_polyline, starredSegments);
    setMatchedSegments(matched);

    // Lazy-fetch polylines for matched segments that don't have them yet
    if (stravaAccessToken) {
      const needPolyline = matched
        .filter(ms => !ms.segment.polyline)
        .map(ms => Number(ms.segment.stravaSegmentId));
      if (needPolyline.length > 0) {
        syncSegmentDetails(stravaAccessToken, needPolyline).then(() => {
          // Reload segments from DB to pick up new polylines
          loadStarredSegments().then(segs => setStarredSegments(segs));
        });
      }
    }
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
      isRefreshingActivities={isRefreshingActivities}
      onRefreshActivities={handleRefreshActivities}
      activitiesStalenessLabel={activitiesStalenessLabel}
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
      onStartRide={() => navigation.navigate('InRide', { segmentIds, goalMode })}
      onChangeGoalMode={() => navigation.goBack()}
      onBack={() => navigation.goBack()}
    />
  );
}

// ─── InRide ───────────────────────────────────────────────────────────────────

export function InRideScreenWrapper() {
  const navigation = useNavigation<RideNav>();
  const route = useRoute<RouteProp<RideStackParamList, 'InRide'>>();
  const { segmentIds, goalMode } = route.params;

  const currentPosition = useRideStore((s) => s.currentPosition);
  const gpsLocked = useRideStore((s) => s.gpsLocked);
  const distanceKm = useRideStore((s) => s.distanceKm);
  const audioActive = useRideStore((s) => s.audioActive);
  const nextSegmentId = useRideStore((s) => s.nextSegmentId);
  const rideStartedAt = useRideStore((s) => s.rideStartedAt);
  const starredSegments = useSegmentStore((s) => s.starredSegments);

  const [elapsedTime, setElapsedTime] = useState('0:00:00');
  const engineStartedRef = useRef(false);

  // Start ride engine on mount
  useEffect(() => {
    if (engineStartedRef.current) return;
    engineStartedRef.current = true;

    console.log('[InRide] starting engine with', segmentIds.length, 'segments');
    startRideEngine(segmentIds, goalMode).then(ok => {
      if (!ok) console.warn('[InRide] GPS permission denied');
      else console.log('[InRide] engine started');
    });

    return () => {
      stopRideEngine();
    };
  }, []);

  // Elapsed time ticker — fires when rideStartedAt is set by the engine
  useEffect(() => {
    if (!rideStartedAt) return;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - rideStartedAt) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setElapsedTime(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(tick);
  }, [rideStartedAt]);

  // Derive next segment info for UI
  const nextSegment = useMemo(() => {
    if (!nextSegmentId) return undefined;
    const seg = starredSegments.find(s => s.id === nextSegmentId);
    if (!seg || !currentPosition) return seg ? { name: seg.name, distanceKm: 0 } : undefined;
    const distM = haversineMetres(currentPosition, { lat: seg.startLat, lng: seg.startLng });
    return { name: seg.name, distanceKm: Math.round(distM / 100) / 10 };
  }, [nextSegmentId, currentPosition, starredSegments]);

  function handleEndRide() {
    stopRideEngine();
    const store = useRideStore.getState();
    store.endRide();
    // Generate a ride ID for the summary
    const rideId = `ride_${Date.now()}`;
    navigation.navigate('PostRideSummary', { rideId });
  }

  return (
    <InRideScreen
      elapsedTime={elapsedTime}
      speedKmh={currentPosition?.speedKmh ?? 0}
      distanceKm={distanceKm}
      gpsLocked={gpsLocked}
      audioActive={audioActive}
      nextSegment={nextSegment}
      onEndRide={handleEndRide}
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
  const route = useRoute<RouteProp<RideStackParamList, 'PostRideSummary'>>();
  const rider = useAuthStore((s) => s.rider);
  const completedSegments = useRideStore((s) => s.completedSegments);
  const rideStartedAt = useRideStore((s) => s.rideStartedAt);
  const distanceKm = useRideStore((s) => s.distanceKm);
  const goalMode = useRideStore((s) => s.goalMode);
  const routeSegmentIds = useRideStore((s) => s.routeSegmentIds);
  const gpxTrackPoints = useRideStore((s) => s.gpxTrackPoints);
  const starredSegments = useSegmentStore((s) => s.starredSegments);

  // History mode: ride was navigated to from History list — load from SQLite.
  // Detected when rideStore is empty (no live ride data) but a rideId was passed.
  const isHistoryMode = completedSegments.length === 0 && !rideStartedAt;
  const persisted = useMemo(
    () => (isHistoryMode ? loadRideDetail(route.params.rideId) : null),
    [isHistoryMode, route.params.rideId],
  );

  const liveEndedAt = useRideStore((s) => s.lastRideEndedAt);
  const endedAt = isHistoryMode
    ? (persisted?.ride.endedAt ?? 0) * 1000
    : (liveEndedAt ?? Date.now());
  const effectiveStartedAt = isHistoryMode
    ? (persisted?.ride.startedAt ?? 0) * 1000
    : (rideStartedAt ?? Date.now());
  const durationSec = isHistoryMode
    ? (persisted ? persisted.ride.endedAt - persisted.ride.startedAt : 0)
    : (rideStartedAt ? Math.floor((endedAt - rideStartedAt) / 1000) : 0);
  const effectiveDistanceKm = isHistoryMode
    ? (persisted ? persisted.ride.distanceM / 1000 : 0)
    : distanceKm;

  // Save ride to DB on mount (once) — skip in history mode (already persisted)
  const savedRef = useRef(false);
  useEffect(() => {
    if (isHistoryMode || savedRef.current || !rider) return;
    savedRef.current = true;
    try {
      saveRide({
        riderId: rider.id,
        goalMode,
        startedAt: rideStartedAt ?? Date.now(),
        endedAt,
        distanceKm,
        elevationM: 0,
        completedSegments,
        gpxTrackPoints,
      });
      console.log('[PostRide] ride saved to DB');
    } catch (err) {
      console.error('[PostRide] save failed:', err);
    }
  }, []);

  // Build segment results — include skipped segments
  const segmentResults = useMemo(() => {
    if (isHistoryMode && persisted) {
      return persisted.efforts.map(e => ({
        id: e.segmentId,
        name: e.segmentName,
        timeSec: e.timeSec,
        isNewPR: e.isNewPR,
        gapToPreSeconds: e.gapToPreSeconds,
        prTimeSec: undefined,
        wasSkipped: false,
        cueTextPlayed: e.cueTextPlayed ?? undefined,
      }));
    }
    const completedIds = new Set(completedSegments.map(c => c.segmentId));
    const results: Array<{
      id: string; name: string; timeSec: number; isNewPR: boolean;
      gapToPreSeconds: number; prTimeSec?: number; wasSkipped: boolean;
      cueTextPlayed?: string;
    }> = [];

    // Add completed segments
    for (const c of completedSegments) {
      results.push({
        id: c.segmentId,
        name: c.name,
        timeSec: c.timeSec,
        isNewPR: c.isNewPR,
        gapToPreSeconds: c.gapToPreSeconds,
        prTimeSec: c.prTimeSec,
        wasSkipped: false,
        cueTextPlayed: c.cueTextPlayed,
      });
    }

    // Add skipped segments (on route but not completed)
    for (const segId of routeSegmentIds) {
      if (completedIds.has(segId)) continue;
      const seg = starredSegments.find(s => s.id === segId);
      results.push({
        id: segId,
        name: seg?.name ?? 'Unknown segment',
        timeSec: 0,
        isNewPR: false,
        gapToPreSeconds: 0,
        wasSkipped: true,
      });
    }

    return results;
  }, [completedSegments, routeSegmentIds, starredSegments]);

  // Generate debrief text — use persisted text in history mode if present
  const debriefText = useMemo(() => {
    if (isHistoryMode) {
      if (persisted?.ride.debriefText) return persisted.ride.debriefText;
      const fakeCompleted = (persisted?.efforts ?? []).map(e => ({
        segmentId: e.segmentId,
        name: e.segmentName,
        timeSec: e.timeSec,
        isNewPR: e.isNewPR,
        gapToPreSeconds: e.gapToPreSeconds,
        prTimeSec: undefined,
        wasSkipped: false,
      }));
      return generateDebrief(fakeCompleted, durationSec, effectiveDistanceKm);
    }
    return generateDebrief(completedSegments, durationSec, distanceKm);
  }, [isHistoryMode, persisted, completedSegments, durationSec, distanceKm, effectiveDistanceKm]);

  // Speak debrief on mount — only for live post-ride, not history viewing
  const spokenRef = useRef(false);
  useEffect(() => {
    if (isHistoryMode || spokenRef.current || !debriefText) return;
    spokenRef.current = true;
    speak(debriefText);
  }, [debriefText, isHistoryMode]);

  const rideName = useMemo(() => {
    if (isHistoryMode && persisted) return persisted.ride.name;
    const hour = new Date(rideStartedAt ?? Date.now()).getHours();
    if (hour < 12) return 'Morning Ride';
    if (hour < 17) return 'Afternoon Ride';
    return 'Evening Ride';
  }, [rideStartedAt, isHistoryMode, persisted]);

  const rideDate = useMemo(() => {
    const d = new Date(effectiveStartedAt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [effectiveStartedAt]);

  function handleDone() {
    if (!isHistoryMode) useRideStore.getState().resetRide();
    navigation.getParent()?.navigate('Main');
  }

  const stravaSynced = isHistoryMode ? (persisted?.ride.stravaSynced ?? false) : false;

  return (
    <PostRideSummaryScreen
      rideName={rideName}
      rideDate={rideDate}
      distanceKm={effectiveDistanceKm}
      durationSec={durationSec}
      elevationM={isHistoryMode ? (persisted?.ride.elevationM ?? 0) : 0}
      segmentResults={segmentResults}
      stravaSynced={stravaSynced}
      debriefText={debriefText}
      onListenDebrief={() => speak(debriefText)}
      onShare={() => {}}
      onDone={handleDone}
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
