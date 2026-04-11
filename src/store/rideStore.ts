import { create } from 'zustand';

export type SegmentState = 'approaching' | 'active' | 'complete' | 'skipped';

export interface ActiveSegment {
  id: string;
  name: string;
  state: SegmentState;
  elapsedTimeSec: number;
  progressPercent: number;
  gapToPreSeconds: number;
  startedAt: number | null; // timestamp ms
  finalTimeSec: number | null;
  isNewPR: boolean;
  cueVariantPlayed: 'aggressive' | 'moderate' | 'recovery' | null;
  cueTextPlayed: string | null;
}

export interface GpsPosition {
  lat: number;
  lng: number;
  speedKmh: number;
  accuracyM: number;
  timestamp: number;
}

export interface CompletedSegmentResult {
  segmentId: string;
  name: string;
  timeSec: number;
  isNewPR: boolean;
  gapToPreSeconds: number;
  prTimeSec?: number;
  wasSkipped: boolean;
  cueTextPlayed?: string;
}

interface RideState {
  // Ride lifecycle
  isRideActive: boolean;
  rideStartedAt: number | null;
  goalMode: 'pr' | 'training' | 'recovery';
  routeSegmentIds: string[]; // ordered list of segments on route

  // Live GPS
  currentPosition: GpsPosition | null;
  gpsLocked: boolean;
  distanceKm: number;
  gpxTrackPoints: GpsPosition[]; // buffered for post-ride

  // Segment tracking
  currentSegment: ActiveSegment | null;
  completedSegments: CompletedSegmentResult[];
  nextSegmentId: string | null;

  // Audio
  audioActive: boolean;

  // Paywall gate
  coachedSegmentCount: number; // increments on each coached completion

  // Actions
  startRide: (goalMode: 'pr' | 'training' | 'recovery', segmentIds: string[]) => void;
  updatePosition: (pos: GpsPosition) => void;
  setSegmentState: (segmentId: string, state: SegmentState) => void;
  setActiveSegmentMetrics: (elapsed: number, progress: number, gap: number) => void;
  completeSegment: (result: CompletedSegmentResult) => void;
  setCuePlayback: (variant: 'aggressive' | 'moderate' | 'recovery', text: string) => void;
  setAudioActive: (active: boolean) => void;
  endRide: () => void;
  resetRide: () => void;
}

export const useRideStore = create<RideState>()((set, get) => ({
  isRideActive: false,
  rideStartedAt: null,
  goalMode: 'pr',
  routeSegmentIds: [],
  currentPosition: null,
  gpsLocked: false,
  distanceKm: 0,
  gpxTrackPoints: [],
  currentSegment: null,
  completedSegments: [],
  nextSegmentId: null,
  audioActive: false,
  coachedSegmentCount: 0,

  startRide: (goalMode, segmentIds) =>
    set({
      isRideActive: true,
      rideStartedAt: Date.now(),
      goalMode,
      routeSegmentIds: segmentIds,
      currentSegment: null,
      completedSegments: [],
      distanceKm: 0,
      gpxTrackPoints: [],
      coachedSegmentCount: 0,
      nextSegmentId: segmentIds[0] ?? null,
    }),

  updatePosition: (pos) =>
    set((state) => {
      const points = [...state.gpxTrackPoints, pos];
      // Buffer every 5th point to limit memory (~1 point per 5 seconds at 1Hz)
      const shouldBuffer = points.length % 5 === 0;
      return {
        currentPosition: pos,
        gpsLocked: pos.accuracyM < 20,
        gpxTrackPoints: shouldBuffer ? points : state.gpxTrackPoints,
      };
    }),

  setSegmentState: (segmentId, segState) =>
    set((state) => {
      if (segState === 'active') {
        return {
          currentSegment: {
            id: segmentId,
            name: '', // populated by detection service which has segment data
            state: 'active',
            elapsedTimeSec: 0,
            progressPercent: 0,
            gapToPreSeconds: 0,
            startedAt: Date.now(),
            finalTimeSec: null,
            isNewPR: false,
            cueVariantPlayed: null,
            cueTextPlayed: null,
          },
        };
      }
      if (!state.currentSegment) return {};
      return {
        currentSegment: { ...state.currentSegment, state: segState },
      };
    }),

  setActiveSegmentMetrics: (elapsed, progress, gap) =>
    set((state) => {
      if (!state.currentSegment) return {};
      return {
        currentSegment: {
          ...state.currentSegment,
          elapsedTimeSec: elapsed,
          progressPercent: progress,
          gapToPreSeconds: gap,
        },
      };
    }),

  completeSegment: (result) =>
    set((state) => {
      const routeIds = state.routeSegmentIds;
      const doneIdx = routeIds.indexOf(result.segmentId);
      const nextId = doneIdx >= 0 ? (routeIds[doneIdx + 1] ?? null) : state.nextSegmentId;
      return {
        currentSegment: null,
        completedSegments: [...state.completedSegments, result],
        nextSegmentId: nextId,
        coachedSegmentCount: result.wasSkipped
          ? state.coachedSegmentCount
          : state.coachedSegmentCount + 1,
      };
    }),

  setCuePlayback: (variant, text) =>
    set((state) => {
      if (!state.currentSegment) return {};
      return {
        currentSegment: {
          ...state.currentSegment,
          cueVariantPlayed: variant,
          cueTextPlayed: text,
        },
        audioActive: true,
      };
    }),

  setAudioActive: (active) => set({ audioActive: active }),

  endRide: () => set({ isRideActive: false }),

  resetRide: () =>
    set({
      isRideActive: false,
      rideStartedAt: null,
      routeSegmentIds: [],
      currentPosition: null,
      gpsLocked: false,
      distanceKm: 0,
      gpxTrackPoints: [],
      currentSegment: null,
      completedSegments: [],
      nextSegmentId: null,
      audioActive: false,
      coachedSegmentCount: 0,
    }),
}));
