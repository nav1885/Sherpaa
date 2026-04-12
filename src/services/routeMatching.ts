import { LatLng, decodePolyline, isNearRoute, haversineMetres } from '../utils/polyline';
import { Segment } from '../store/segmentStore';

export interface MatchedSegment {
  segment: Segment;
  distanceAlongRouteKm: number; // approximate km along route where segment starts
}

/**
 * Given an encoded polyline and a list of starred segments,
 * return only the segments whose start AND end latlng fall within 150m of the route.
 * Results are sorted by approximate position along the route.
 */
export function matchSegmentsToRoute(
  encodedPolyline: string,
  segments: Segment[],
): MatchedSegment[] {
  const routePoints = decodePolyline(encodedPolyline);
  if (routePoints.length === 0) return [];

  // Precompute cumulative distances along the route for position estimation
  const cumulativeKm: number[] = [0];
  for (let i = 1; i < routePoints.length; i++) {
    const d = haversineMetres(routePoints[i - 1], routePoints[i]);
    cumulativeKm.push(cumulativeKm[i - 1] + d / 1000);
  }

  const matched: MatchedSegment[] = [];

  for (const segment of segments) {
    const startPoint: LatLng = { lat: segment.startLat, lng: segment.startLng };
    const endPoint: LatLng = { lat: segment.endLat, lng: segment.endLng };

    const startOnRoute = isNearRoute(startPoint, routePoints, 150);
    const endOnRoute = isNearRoute(endPoint, routePoints, 150);

    if (!startOnRoute || !endOnRoute) continue;

    // Find the closest route point index to the segment start for ordering
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < routePoints.length; i++) {
      const d = haversineMetres(startPoint, routePoints[i]);
      if (d < closestDist) {
        closestDist = d;
        closestIdx = i;
      }
    }

    matched.push({
      segment,
      distanceAlongRouteKm: cumulativeKm[closestIdx],
    });
  }

  // Sort by position along the route
  matched.sort((a, b) => a.distanceAlongRouteKm - b.distanceAlongRouteKm);

  return matched;
}
