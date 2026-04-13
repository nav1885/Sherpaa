/** Staleness TTLs for Strava API caching (all values in seconds unless noted) */
export const TTL = {
  /** Starred segment list (/segments/starred) */
  SEGMENT_LIST_SEC: 24 * 60 * 60, // 24 hours

  /** Segment detail incl. polyline (/segments/{id}) */
  SEGMENT_DETAIL_SEC: 7 * 24 * 60 * 60, // 7 days

  /** Activity list (/athlete/activities) */
  ACTIVITY_SEC: 4 * 60 * 60, // 4 hours

  /** Delay between background detail API calls (milliseconds) */
  DETAIL_THROTTLE_MS: 2000,
} as const;
