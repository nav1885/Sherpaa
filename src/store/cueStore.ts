import { create } from 'zustand';

export type CueVariant = 'aggressive' | 'moderate' | 'recovery';
export type GoalMode = 'pr' | 'training' | 'recovery';

export interface CueSet {
  segmentId: string;
  goalMode: GoalMode;
  aggressive: string;
  moderate: string;
  recovery: string;
  generatedAt: number; // timestamp ms
}

const CUE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CueState {
  // In-memory cue cache keyed by `${segmentId}:${goalMode}`
  cues: Record<string, CueSet>;

  // Actions
  setCues: (cueSet: CueSet) => void;
  getCue: (segmentId: string, goalMode: GoalMode, variant: CueVariant) => string | null;
  hasFreshCues: (segmentId: string, goalMode: GoalMode) => boolean;
  selectVariant: (segmentId: string, goalMode: GoalMode, variant: CueVariant) => string | null;
  clearAll: () => void;
}

export const useCueStore = create<CueState>()((set, get) => ({
  cues: {},

  setCues: (cueSet) =>
    set((state) => ({
      cues: {
        ...state.cues,
        [`${cueSet.segmentId}:${cueSet.goalMode}`]: cueSet,
      },
    })),

  getCue: (segmentId, goalMode, variant) => {
    const key = `${segmentId}:${goalMode}`;
    const cueSet = get().cues[key];
    if (!cueSet) return null;
    return cueSet[variant];
  },

  hasFreshCues: (segmentId, goalMode) => {
    const key = `${segmentId}:${goalMode}`;
    const cueSet = get().cues[key];
    if (!cueSet) return false;
    return Date.now() - cueSet.generatedAt < CUE_TTL_MS;
  },

  selectVariant: (segmentId, goalMode, variant) => {
    return get().getCue(segmentId, goalMode, variant);
  },

  clearAll: () => set({ cues: {} }),
}));
