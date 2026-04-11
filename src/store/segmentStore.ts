import { create } from 'zustand';

export interface Segment {
  id: string;
  stravaSegmentId: string;
  name: string;
  distanceM: number;
  elevationM: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  polyline: string | null;
  isStarred: boolean;
  // Effort summary (derived from segment_efforts)
  effortCount: number;
  bestTimeSec: number | null;
  avgTimeSec: number | null;
  pacingTendency: 'fade' | 'strongStart' | 'consistent' | 'unknown';
}

export interface RouteSegment extends Segment {
  isMatchedToRoute: boolean;
  distanceAlongRouteM: number; // position on the route
}

interface SegmentState {
  // All starred segments from Strava
  starredSegments: Segment[];
  // Segments matched to current route (set at route setup time)
  routeSegments: RouteSegment[];
  // Cue generation status per segment
  cueStatus: Record<string, 'pending' | 'generating' | 'ready' | 'failed'>;
  // Current cue generation job
  cueJobId: string | null;
  cueJobProgress: { completed: number; total: number } | null;

  // Actions
  setStarredSegments: (segments: Segment[]) => void;
  setRouteSegments: (segments: RouteSegment[]) => void;
  setCueJobId: (jobId: string) => void;
  updateCueProgress: (completed: number, total: number, statuses: Record<string, 'pending' | 'generating' | 'ready' | 'failed'>) => void;
  clearCueJob: () => void;
  clearRoute: () => void;
}

export const useSegmentStore = create<SegmentState>()((set) => ({
  starredSegments: [],
  routeSegments: [],
  cueStatus: {},
  cueJobId: null,
  cueJobProgress: null,

  setStarredSegments: (segments) => set({ starredSegments: segments }),

  setRouteSegments: (segments) => set({ routeSegments: segments }),

  setCueJobId: (jobId) => set({ cueJobId: jobId }),

  updateCueProgress: (completed, total, statuses) =>
    set({ cueJobProgress: { completed, total }, cueStatus: statuses }),

  clearCueJob: () =>
    set({ cueJobId: null, cueJobProgress: null }),

  clearRoute: () =>
    set({ routeSegments: [], cueStatus: {}, cueJobId: null, cueJobProgress: null }),
}));
