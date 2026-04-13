import { decodePolyline, haversineMetres, isNearRoute, LatLng } from '../utils/polyline';

describe('decodePolyline', () => {
  it('decodes a simple encoded polyline', () => {
    // This encodes roughly (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const points = decodePolyline(encoded);

    expect(points).toHaveLength(3);
    expect(points[0].lat).toBeCloseTo(38.5, 1);
    expect(points[0].lng).toBeCloseTo(-120.2, 1);
    expect(points[1].lat).toBeCloseTo(40.7, 1);
    expect(points[1].lng).toBeCloseTo(-120.95, 1);
    expect(points[2].lat).toBeCloseTo(43.252, 1);
    expect(points[2].lng).toBeCloseTo(-126.453, 1);
  });

  it('returns empty array for empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });

  it('handles single-point polyline', () => {
    // Encode (0, 0)
    const encoded = '??';
    const points = decodePolyline(encoded);
    expect(points).toHaveLength(1);
    expect(points[0].lat).toBeCloseTo(0, 3);
    expect(points[0].lng).toBeCloseTo(0, 3);
  });
});

describe('haversineMetres', () => {
  it('returns 0 for same point', () => {
    const p: LatLng = { lat: 37.7749, lng: -122.4194 };
    expect(haversineMetres(p, p)).toBeCloseTo(0, 1);
  });

  it('computes known distance (SF to Oakland ~13km)', () => {
    const sf: LatLng = { lat: 37.7749, lng: -122.4194 };
    const oakland: LatLng = { lat: 37.8044, lng: -122.2712 };
    const dist = haversineMetres(sf, oakland);
    expect(dist).toBeGreaterThan(12000);
    expect(dist).toBeLessThan(15000);
  });

  it('computes short distance accurately (< 100m)', () => {
    const a: LatLng = { lat: 37.7749, lng: -122.4194 };
    // ~50m north
    const b: LatLng = { lat: 37.77535, lng: -122.4194 };
    const dist = haversineMetres(a, b);
    expect(dist).toBeGreaterThan(40);
    expect(dist).toBeLessThan(60);
  });

  it('handles antipodal points (~20,000km)', () => {
    const a: LatLng = { lat: 0, lng: 0 };
    const b: LatLng = { lat: 0, lng: 180 };
    const dist = haversineMetres(a, b);
    // Half circumference of Earth
    expect(dist).toBeGreaterThan(20_000_000);
    expect(dist).toBeLessThan(20_100_000);
  });
});

describe('isNearRoute', () => {
  const route: LatLng[] = [
    { lat: 37.77, lng: -122.42 },
    { lat: 37.775, lng: -122.415 },
    { lat: 37.78, lng: -122.41 },
  ];

  it('returns true for point on the route', () => {
    expect(isNearRoute({ lat: 37.775, lng: -122.415 }, route, 50)).toBe(true);
  });

  it('returns true for point within threshold', () => {
    // Slightly off route (~30m)
    expect(isNearRoute({ lat: 37.7753, lng: -122.415 }, route, 100)).toBe(true);
  });

  it('returns false for distant point', () => {
    // ~5km away
    expect(isNearRoute({ lat: 37.82, lng: -122.42 }, route, 100)).toBe(false);
  });

  it('uses default threshold of 100m', () => {
    // Point ~50m from route
    expect(isNearRoute({ lat: 37.7754, lng: -122.415 }, route)).toBe(true);
  });

  it('returns false for empty route', () => {
    expect(isNearRoute({ lat: 37.77, lng: -122.42 }, [])).toBe(false);
  });
});
