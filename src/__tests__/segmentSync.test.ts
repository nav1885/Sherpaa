/**
 * Tests for segment sync — global lock, listOnly option, and orchestrator behavior.
 */

// Mock the Strava API module
jest.mock('../services/stravaApi', () => ({
  getStarredSegments: jest.fn().mockResolvedValue([]),
  getSegmentDetail: jest.fn().mockResolvedValue({ map: { polyline: 'encoded_polyline' } }),
}));

// Mock ulid
jest.mock('../utils/ulid', () => ({
  ulid: () => `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
}));

import { syncStarredSegments, syncSegmentList, syncSegmentDetails } from '../services/segmentSync';
import { getStarredSegments, getSegmentDetail } from '../services/stravaApi';

const mockGetStarred = getStarredSegments as jest.MockedFunction<typeof getStarredSegments>;
const mockGetDetail = getSegmentDetail as jest.MockedFunction<typeof getSegmentDetail>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncStarredSegments', () => {
  describe('listOnly option', () => {
    it('does not fetch details when listOnly is true', async () => {
      mockGetStarred.mockResolvedValueOnce([
        {
          id: 12345, name: 'Test Segment', distance: 1000,
          total_elevation_gain: 50,
          start_latlng: [37.77, -122.42], end_latlng: [37.78, -122.41],
        } as any,
      ]);

      await syncStarredSegments('fake-token', undefined, { listOnly: true });

      expect(mockGetStarred).toHaveBeenCalledTimes(1);
      expect(mockGetDetail).not.toHaveBeenCalled();
    });
  });

  describe('global sync lock', () => {
    it('joins an existing sync instead of starting a new one', async () => {
      // Slow API response
      mockGetStarred.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      // Fire two syncs concurrently
      const p1 = syncStarredSegments('token1', undefined, { listOnly: true });
      const p2 = syncStarredSegments('token2', undefined, { listOnly: true });

      const [r1, r2] = await Promise.all([p1, p2]);

      // Both should return the same result
      expect(r1).toBe(r2);
      // API should only be called ONCE (second sync joined the first)
      expect(mockGetStarred).toHaveBeenCalledTimes(1);
    });
  });

  describe('progress callback', () => {
    it('reports list phase then complete for listOnly', async () => {
      mockGetStarred.mockResolvedValueOnce([]);
      const progress = jest.fn();

      await syncStarredSegments('token', progress, { listOnly: true });

      expect(progress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'list' }),
      );
      expect(progress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'complete' }),
      );
    });
  });
});

describe('syncSegmentDetails', () => {
  describe('429 rate limit handling', () => {
    it('stops fetching after receiving a 429 error', async () => {
      mockGetDetail
        .mockResolvedValueOnce({ map: { polyline: 'poly1' } } as any)
        .mockRejectedValueOnce(new Error('HTTP 429 Too Many Requests'))
        .mockResolvedValueOnce({ map: { polyline: 'poly3' } } as any);

      const result = await syncSegmentDetails('token', [1, 2, 3]);

      // Should have attempted 2 (first success, second 429, then stop)
      // The done counter increments after each attempt, and breaks after 429
      expect(mockGetDetail).toHaveBeenCalledTimes(2);
      // Third segment should NOT have been attempted
      expect(mockGetDetail).not.toHaveBeenCalledWith(3, 'token');
    });
  });

  describe('non-fatal errors', () => {
    it('continues after a non-429 error', async () => {
      mockGetDetail
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ map: { polyline: 'poly2' } } as any);

      const result = await syncSegmentDetails('token', [1, 2]);

      // Both should be attempted
      expect(mockGetDetail).toHaveBeenCalledTimes(2);
    });
  });

  describe('throttling', () => {
    it('adds delay between detail fetches', async () => {
      mockGetDetail.mockResolvedValue({ map: { polyline: 'p' } } as any);
      const start = Date.now();

      await syncSegmentDetails('token', [1, 2]);

      const elapsed = Date.now() - start;
      // Should have at least 1 throttle delay (2000ms) between the two calls
      expect(elapsed).toBeGreaterThanOrEqual(1500); // allow some margin
    }, 10000);
  });
});
