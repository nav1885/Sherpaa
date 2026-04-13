import { useRideStore, CompletedSegmentResult } from '../store/rideStore';

// Reset store between tests
beforeEach(() => {
  useRideStore.getState().resetRide();
  // Also clear lastRideEndedAt
  useRideStore.setState({ lastRideEndedAt: null });
});

describe('rideStore', () => {
  describe('startRide', () => {
    it('sets ride as active with correct state', () => {
      useRideStore.getState().startRide('training', ['seg1', 'seg2']);
      const state = useRideStore.getState();

      expect(state.isRideActive).toBe(true);
      expect(state.goalMode).toBe('training');
      expect(state.routeSegmentIds).toEqual(['seg1', 'seg2']);
      expect(state.rideStartedAt).toBeGreaterThan(0);
      expect(state.nextSegmentId).toBe('seg1');
      expect(state.completedSegments).toEqual([]);
      expect(state.distanceKm).toBe(0);
      expect(state.coachedSegmentCount).toBe(0);
    });

    it('sets first segment as next', () => {
      useRideStore.getState().startRide('pr', ['a', 'b', 'c']);
      expect(useRideStore.getState().nextSegmentId).toBe('a');
    });

    it('handles empty segment list', () => {
      useRideStore.getState().startRide('recovery', []);
      expect(useRideStore.getState().nextSegmentId).toBeNull();
    });
  });

  describe('updatePosition', () => {
    it('updates current position and GPS lock', () => {
      useRideStore.getState().updatePosition({
        lat: 37.77, lng: -122.42, speedKmh: 25, accuracyM: 5, timestamp: Date.now(),
      });
      const state = useRideStore.getState();
      expect(state.currentPosition?.lat).toBe(37.77);
      expect(state.gpsLocked).toBe(true); // accuracy < 20m
    });

    it('marks GPS as unlocked when accuracy is poor', () => {
      useRideStore.getState().updatePosition({
        lat: 37.77, lng: -122.42, speedKmh: 25, accuracyM: 50, timestamp: Date.now(),
      });
      expect(useRideStore.getState().gpsLocked).toBe(false);
    });
  });

  describe('completeSegment', () => {
    it('adds to completed list and advances nextSegmentId', () => {
      useRideStore.getState().startRide('pr', ['seg1', 'seg2', 'seg3']);

      const result: CompletedSegmentResult = {
        segmentId: 'seg1', name: 'Test Seg', timeSec: 120,
        isNewPR: true, gapToPreSeconds: -5, wasSkipped: false,
      };
      useRideStore.getState().completeSegment(result);

      const state = useRideStore.getState();
      expect(state.completedSegments).toHaveLength(1);
      expect(state.completedSegments[0].segmentId).toBe('seg1');
      expect(state.nextSegmentId).toBe('seg2');
      expect(state.currentSegment).toBeNull();
      expect(state.coachedSegmentCount).toBe(1);
    });

    it('sets nextSegmentId to null when last segment completed', () => {
      useRideStore.getState().startRide('pr', ['seg1']);

      useRideStore.getState().completeSegment({
        segmentId: 'seg1', name: 'Only Seg', timeSec: 100,
        isNewPR: false, gapToPreSeconds: 10, wasSkipped: false,
      });

      expect(useRideStore.getState().nextSegmentId).toBeNull();
    });

    it('does not increment coachedSegmentCount for skipped segments', () => {
      useRideStore.getState().startRide('pr', ['seg1']);

      useRideStore.getState().completeSegment({
        segmentId: 'seg1', name: 'Skipped', timeSec: 0,
        isNewPR: false, gapToPreSeconds: 0, wasSkipped: true,
      });

      expect(useRideStore.getState().coachedSegmentCount).toBe(0);
    });
  });

  describe('endRide', () => {
    it('sets isRideActive to false and records end time', () => {
      useRideStore.getState().startRide('training', ['seg1']);
      useRideStore.getState().endRide();

      const state = useRideStore.getState();
      expect(state.isRideActive).toBe(false);
      expect(state.lastRideEndedAt).toBeGreaterThan(0);
    });

    it('preserves completed segments after end (for post-ride screen)', () => {
      useRideStore.getState().startRide('pr', ['seg1']);
      useRideStore.getState().completeSegment({
        segmentId: 'seg1', name: 'Test', timeSec: 200,
        isNewPR: true, gapToPreSeconds: -3, wasSkipped: false,
      });
      useRideStore.getState().endRide();

      expect(useRideStore.getState().completedSegments).toHaveLength(1);
    });
  });

  describe('resetRide', () => {
    it('clears all ride state except lastRideEndedAt', () => {
      useRideStore.getState().startRide('pr', ['seg1']);
      useRideStore.getState().endRide();
      const endTime = useRideStore.getState().lastRideEndedAt;

      useRideStore.getState().resetRide();

      const state = useRideStore.getState();
      expect(state.isRideActive).toBe(false);
      expect(state.routeSegmentIds).toEqual([]);
      expect(state.completedSegments).toEqual([]);
      expect(state.currentPosition).toBeNull();
      expect(state.distanceKm).toBe(0);
      // lastRideEndedAt should persist (not cleared by resetRide)
      expect(state.lastRideEndedAt).toBe(endTime);
    });
  });

  describe('setActiveSegmentMetrics', () => {
    it('updates current segment metrics', () => {
      useRideStore.getState().startRide('pr', ['seg1']);
      useRideStore.getState().setSegmentState('seg1', 'active');
      useRideStore.getState().setActiveSegmentMetrics(45, 50, -3);

      const seg = useRideStore.getState().currentSegment;
      expect(seg?.elapsedTimeSec).toBe(45);
      expect(seg?.progressPercent).toBe(50);
      expect(seg?.gapToPreSeconds).toBe(-3);
    });

    it('no-ops when no current segment', () => {
      useRideStore.getState().setActiveSegmentMetrics(10, 20, 5);
      expect(useRideStore.getState().currentSegment).toBeNull();
    });
  });
});
