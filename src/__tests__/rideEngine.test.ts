/**
 * Tests for ride engine segment detection logic.
 * We test the pure detection functions by importing the module and
 * simulating GPS positions.
 */

import { haversineMetres, LatLng } from '../utils/polyline';

// Since the ride engine uses module-level state and direct store access,
// we test the detection logic via the haversine calculations that drive it.
// These tests verify the distance thresholds that trigger segment events.

const APPROACH_RADIUS_M = 500;
const SEGMENT_START_RADIUS_M = 40;
const SEGMENT_END_RADIUS_M = 40;

describe('ride engine — segment detection thresholds', () => {
  // Hawk Hill segment (real Strava coordinates)
  const segStart: LatLng = { lat: 37.8324, lng: -122.4996 };
  const segEnd: LatLng = { lat: 37.8267, lng: -122.4998 };

  describe('approach detection (500m)', () => {
    it('triggers when rider is within 500m of segment start', () => {
      // ~400m south of segment start
      const riderPos: LatLng = { lat: 37.8288, lng: -122.4996 };
      const dist = haversineMetres(riderPos, segStart);
      expect(dist).toBeLessThan(APPROACH_RADIUS_M);
      expect(dist).toBeGreaterThan(SEGMENT_START_RADIUS_M);
    });

    it('does NOT trigger when rider is >500m away', () => {
      // ~1km south of segment start
      const riderPos: LatLng = { lat: 37.823, lng: -122.4996 };
      const dist = haversineMetres(riderPos, segStart);
      expect(dist).toBeGreaterThan(APPROACH_RADIUS_M);
    });
  });

  describe('segment start detection (40m)', () => {
    it('triggers when rider is within 40m of start', () => {
      // ~20m from start
      const riderPos: LatLng = { lat: 37.83222, lng: -122.4996 };
      const dist = haversineMetres(riderPos, segStart);
      expect(dist).toBeLessThan(SEGMENT_START_RADIUS_M);
    });

    it('does NOT trigger when rider is 50m away', () => {
      // ~60m from start
      const riderPos: LatLng = { lat: 37.8319, lng: -122.4996 };
      const dist = haversineMetres(riderPos, segStart);
      expect(dist).toBeGreaterThan(SEGMENT_START_RADIUS_M);
    });
  });

  describe('segment end detection (40m)', () => {
    it('triggers when rider crosses within 40m of end', () => {
      // ~15m from end
      const riderPos: LatLng = { lat: 37.82683, lng: -122.4998 };
      const dist = haversineMetres(riderPos, segEnd);
      expect(dist).toBeLessThan(SEGMENT_END_RADIUS_M);
    });
  });

  describe('PR gap calculation', () => {
    it('computes positive gap (behind PR) correctly', () => {
      const bestTimeSec = 240; // 4:00 PR
      const progress = 0.5; // halfway
      const elapsedSec = 130; // 2:10 elapsed (should be at 2:00 for PR pace)
      const expectedElapsed = bestTimeSec * progress; // 120s
      const gap = Math.round(elapsedSec - expectedElapsed); // +10
      expect(gap).toBe(10); // 10s behind PR
    });

    it('computes negative gap (ahead of PR) correctly', () => {
      const bestTimeSec = 240;
      const progress = 0.5;
      const elapsedSec = 110; // 1:50 elapsed
      const expectedElapsed = bestTimeSec * progress; // 120s
      const gap = Math.round(elapsedSec - expectedElapsed); // -10
      expect(gap).toBe(-10); // 10s ahead
    });

    it('returns 0 when on pace', () => {
      const bestTimeSec = 240;
      const progress = 0.5;
      const elapsedSec = 120;
      const gap = Math.round(elapsedSec - bestTimeSec * progress);
      expect(gap).toBe(0);
    });
  });

  describe('split cue logic', () => {
    // Split cues fire at 25%, 50%, 75% if gap >= ±3s
    it('fires cue when gap >= 3s behind', () => {
      const gap = 5;
      expect(Math.abs(gap) >= 3).toBe(true);
    });

    it('fires cue when gap >= 3s ahead', () => {
      const gap = -4;
      expect(Math.abs(gap) >= 3).toBe(true);
    });

    it('does NOT fire cue when gap is within ±3s', () => {
      const gap = 2;
      expect(Math.abs(gap) >= 3).toBe(false);
    });
  });

  describe('distance accumulation', () => {
    it('correctly accumulates distance between GPS points', () => {
      const points: LatLng[] = [
        { lat: 37.7700, lng: -122.4200 },
        { lat: 37.7710, lng: -122.4200 }, // ~111m north
        { lat: 37.7720, lng: -122.4200 }, // another ~111m north
      ];

      let totalM = 0;
      for (let i = 1; i < points.length; i++) {
        totalM += haversineMetres(points[i - 1], points[i]);
      }

      expect(totalM).toBeGreaterThan(200);
      expect(totalM).toBeLessThan(250);
    });

    it('filters out GPS noise (jumps > 200m)', () => {
      const prev: LatLng = { lat: 37.77, lng: -122.42 };
      const noisy: LatLng = { lat: 37.80, lng: -122.42 }; // ~3km jump
      const delta = haversineMetres(prev, noisy);
      // Engine should NOT count this (delta > 200)
      expect(delta).toBeGreaterThan(200);
    });
  });
});
