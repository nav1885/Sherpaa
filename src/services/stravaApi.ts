/**
 * Typed client for the Strava V3 REST API.
 * The app calls Strava directly with the stored access_token for reads.
 * Writes (create activity, etc.) may also be added here later.
 */

const BASE = 'https://www.strava.com/api/v3';

// ─── Strava response types (subset we actually use) ──────────────────────────

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string; // avatar URL (large)
  profile_medium: string;
  city: string;
  country: string;
}

export interface StravaSummarySegment {
  id: number;
  name: string;
  distance: number; // metres
  average_grade: number;
  maximum_grade: number;
  elevation_high: number;
  elevation_low: number;
  start_latlng: [number, number]; // [lat, lng]
  end_latlng: [number, number];
  total_elevation_gain: number;
  effort_count: number;
  athlete_count: number;
  starred: boolean;
  athlete_segment_stats?: {
    pr_activity_id: number | null;
    pr_date: string | null;
    pr_elapsed_time: number | null;
    effort_count: number;
  };
}

export interface StravaDetailedSegment extends StravaSummarySegment {
  map: {
    id: string;
    polyline: string; // encoded polyline
    resource_state: number;
  };
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function stravaGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw new Error('STRAVA_TOKEN_EXPIRED');
  }
  if (!res.ok) {
    throw new Error(`Strava API error ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

// ─── API methods ──────────────────────────────────────────────────────────────

/** Fetch the authenticated athlete's profile. */
export async function getAthlete(accessToken: string): Promise<StravaAthlete> {
  return stravaGet<StravaAthlete>('/athlete', accessToken);
}

/**
 * Fetch all starred segments for the authenticated athlete.
 * Strava paginates at 200/page; we loop until exhausted.
 */
export async function getStarredSegments(accessToken: string): Promise<StravaSummarySegment[]> {
  const all: StravaSummarySegment[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const page_results = await stravaGet<StravaSummarySegment[]>(
      `/segments/starred?page=${page}&per_page=${perPage}`,
      accessToken,
    );
    all.push(...page_results);
    if (page_results.length < perPage) break;
    page++;
  }

  return all;
}

/**
 * Fetch the full segment detail (includes encoded polyline).
 * Call this for each starred segment that doesn't have a polyline cached.
 */
export async function getSegmentDetail(
  segmentId: number,
  accessToken: string,
): Promise<StravaDetailedSegment> {
  return stravaGet<StravaDetailedSegment>(`/segments/${segmentId}`, accessToken);
}

// ─── Activity types ───────────────────────────────────────────────────────────

export interface StravaActivitySummary {
  id: number;
  name: string;
  distance: number;        // metres
  moving_time: number;     // seconds
  start_date: string;      // ISO 8601
  map: {
    summary_polyline: string; // encoded polyline, may be empty string for private activities
  };
}

/** Fetch the athlete's most recent activities that have a route (non-empty polyline). */
export async function getRecentActivities(
  accessToken: string,
  maxResults = 10,
): Promise<StravaActivitySummary[]> {
  const all = await stravaGet<StravaActivitySummary[]>(
    `/athlete/activities?per_page=30&page=1`,
    accessToken,
  );
  return all
    .filter(a => a.map?.summary_polyline)
    .slice(0, maxResults);
}
