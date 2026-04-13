import { matchSegmentsToRoute } from '../services/routeMatching';
import { Segment } from '../store/segmentStore';

// Helper to make a minimal segment
function makeSegment(overrides: Partial<Segment> & { id: string; name: string; startLat: number; startLng: number; endLat: number; endLng: number }): Segment {
  return {
    stravaSegmentId: overrides.id,
    distanceM: 1000,
    elevationM: 50,
    polyline: null,
    isStarred: true,
    effortCount: 0,
    bestTimeSec: null,
    avgTimeSec: null,
    pacingTendency: 'unknown',
    ...overrides,
  };
}

// A simple route polyline along a line from (37.77, -122.42) to (37.79, -122.40)
// Encoded using Google's polyline algorithm
// We'll use the raw decode by providing real coordinates
const routePolyline = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

describe('matchSegmentsToRoute', () => {
  // Use a straight-ish route we can reason about
  // Route from (37.770, -122.420) → (37.775, -122.415) → (37.780, -122.410)
  // We need to encode this. Let's use a known polyline for these points.

  it('returns empty for empty segments list', () => {
    const result = matchSegmentsToRoute(routePolyline, []);
    expect(result).toEqual([]);
  });

  it('returns empty for empty polyline', () => {
    const seg = makeSegment({
      id: 's1', name: 'Test', startLat: 37.77, startLng: -122.42, endLat: 37.78, endLng: -122.41,
    });
    const result = matchSegmentsToRoute('', [seg]);
    expect(result).toEqual([]);
  });

  it('matches a segment whose start and end are near the route', () => {
    // The polyline decodes to ~(38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const seg = makeSegment({
      id: 's1', name: 'Near Route',
      startLat: 38.5, startLng: -120.2,
      endLat: 40.7, endLng: -120.95,
    });
    const result = matchSegmentsToRoute(routePolyline, [seg]);
    expect(result).toHaveLength(1);
    expect(result[0].segment.id).toBe('s1');
  });

  it('excludes a segment far from the route', () => {
    const seg = makeSegment({
      id: 's1', name: 'Far Away',
      startLat: 10.0, startLng: -80.0,
      endLat: 10.1, endLng: -80.1,
    });
    const result = matchSegmentsToRoute(routePolyline, [seg]);
    expect(result).toHaveLength(0);
  });

  it('excludes segment where only start is near route (end is far)', () => {
    const seg = makeSegment({
      id: 's1', name: 'Half Match',
      startLat: 38.5, startLng: -120.2,
      endLat: 10.0, endLng: -80.0, // far from route
    });
    const result = matchSegmentsToRoute(routePolyline, [seg]);
    expect(result).toHaveLength(0);
  });

  it('sorts matched segments by distance along route', () => {
    // seg2 start is closer to beginning of route than seg1
    const seg1 = makeSegment({
      id: 's1', name: 'Later',
      startLat: 40.7, startLng: -120.95,
      endLat: 43.252, endLng: -126.453,
    });
    const seg2 = makeSegment({
      id: 's2', name: 'Earlier',
      startLat: 38.5, startLng: -120.2,
      endLat: 40.7, endLng: -120.95,
    });
    const result = matchSegmentsToRoute(routePolyline, [seg1, seg2]);
    expect(result).toHaveLength(2);
    expect(result[0].segment.id).toBe('s2'); // earlier on route
    expect(result[1].segment.id).toBe('s1');
    expect(result[0].distanceAlongRouteKm).toBeLessThan(result[1].distanceAlongRouteKm);
  });
});
