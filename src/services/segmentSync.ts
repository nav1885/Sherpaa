/**
 * Staleness-gated segment sync.
 *
 * Phase 1 — syncSegmentList: fetch starred list (1 API call), diff against
 *   SQLite, upsert summary data, soft-delete unstarred segments.
 * Phase 2 — syncSegmentDetails: fetch polylines only for new or stale segments.
 * Orchestrator — syncStarredSegments: runs both phases, respects TTLs.
 */

import { eq, sql } from 'drizzle-orm';
import { ulid } from '../utils/ulid';
import { db } from '../db/client';
import { segments } from '../db/schema';
import { getStarredSegments, getSegmentDetail } from './stravaApi';
import { TTL } from '../constants/ttl';

// ─── Progress callback ────────────────────────────────────────────────────────

export interface SyncProgress {
  total: number;
  done: number;
  phase: 'list' | 'details' | 'complete' | 'error';
  error?: string;
}

type ProgressCallback = (progress: SyncProgress) => void;

// ─── Phase 1: List sync ──────────────────────────────────────────────────────

export interface ListSyncResult {
  total: number;
  newStravaIds: number[];
}

/**
 * Fetch the starred segment LIST from Strava (1 API call).
 * Upserts summary data (name, distance, elevation, coords).
 * Does NOT fetch polylines or touch detailFetchedAt on existing rows.
 * Returns the set of Strava segment IDs that are NEW (not previously in DB).
 */
export async function syncSegmentList(
  accessToken: string,
): Promise<ListSyncResult> {
  const starred = await getStarredSegments(accessToken);
  console.log(`[segmentSync] API returned ${starred.length} starred segments`);
  const now = Math.floor(Date.now() / 1000);

  // Get all known strava_segment_ids from DB
  let knownIds: Set<string>;
  try {
    const knownRows = db
      .select({ stravaSegmentId: segments.stravaSegmentId })
      .from(segments)
      .all();
    knownIds = new Set(knownRows.map(r => r.stravaSegmentId));
  } catch (err) {
    console.error('[segmentSync] DB query for known segments failed:', err);
    throw err;
  }
  console.log(`[segmentSync] ${starred.length} starred from Strava, ${knownIds.size} known in DB`);

  const newStravaIds: number[] = [];

  for (const seg of starred) {
    const sid = String(seg.id);

    try {
      if (knownIds.has(sid)) {
        db.update(segments)
          .set({
            name: seg.name,
            distanceM: seg.distance,
            elevationM: seg.total_elevation_gain,
            startLat: seg.start_latlng[0],
            startLng: seg.start_latlng[1],
            endLat: seg.end_latlng[0],
            endLng: seg.end_latlng[1],
            isStarred: true,
            lastFetchedAt: now,
          })
          .where(eq(segments.stravaSegmentId, sid))
          .run();
      } else {
        db.insert(segments)
          .values({
            id: ulid(),
            stravaSegmentId: sid,
            name: seg.name,
            distanceM: seg.distance,
            elevationM: seg.total_elevation_gain,
            startLat: seg.start_latlng[0],
            startLng: seg.start_latlng[1],
            endLat: seg.end_latlng[0],
            endLng: seg.end_latlng[1],
            polyline: null,
            isStarred: true,
            lastFetchedAt: now,
            detailFetchedAt: null,
          })
          .run();
        newStravaIds.push(seg.id);
      }
    } catch (err) {
      console.error(`[segmentSync] upsert failed for ${sid}:`, err);
      throw err;
    }
  }

  // Soft-delete: mark segments NOT in the starred list as unstarred
  const starredIds = starred.map(s => String(s.id));
  if (starredIds.length > 0) {
    db.update(segments)
      .set({ isStarred: false })
      .where(
        sql`${segments.isStarred} = 1 AND ${segments.stravaSegmentId} NOT IN (${sql.join(starredIds.map(id => sql`${id}`), sql`, `)})`
      )
      .run();
  }

  return { total: starred.length, newStravaIds };
}

// ─── Phase 2: Detail fetch ───────────────────────────────────────────────────

/**
 * Fetch detail (polyline) for specific segments by their Strava IDs.
 * Updates polyline + detailFetchedAt in DB.
 * Non-fatal: skips segments that fail.
 */
export async function syncSegmentDetails(
  accessToken: string,
  stravaSegmentIds: number[],
  onProgress?: ProgressCallback,
): Promise<number> {
  const total = stravaSegmentIds.length;
  let done = 0;

  for (const stravaId of stravaSegmentIds) {
    // Throttle: wait between calls to avoid hitting rate limits
    if (done > 0) {
      await new Promise(r => setTimeout(r, TTL.DETAIL_THROTTLE_MS));
    }

    try {
      const detail = await getSegmentDetail(stravaId, accessToken);
      const polyline = detail.map?.polyline ?? null;
      const now = Math.floor(Date.now() / 1000);

      db.update(segments)
        .set({ polyline, detailFetchedAt: now })
        .where(eq(segments.stravaSegmentId, String(stravaId)))
        .run();
    } catch (err: any) {
      const is429 = err?.message?.includes('429');
      console.warn(`[segmentSync] detail fetch failed for ${stravaId}:`, err);
      if (is429) {
        console.warn(`[segmentSync] rate limited — stopping detail fetches (${done}/${total} done)`);
        break; // Stop burning API calls; remaining will be fetched next sync
      }
    }

    done++;
    onProgress?.({ total, done, phase: 'details' });
  }

  return done;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

interface SyncOptions {
  /** If true, re-fetch details regardless of TTL */
  forceDetails?: boolean;
  /** If true, skip detail fetches entirely (list-only sync) */
  listOnly?: boolean;
}

// Global lock: prevents concurrent syncs from racing on SQLite
let _syncInProgress: Promise<number> | null = null;

/**
 * Full sync: list + details for new/stale segments.
 * Serialized: if a sync is already running, callers await the same promise.
 */
export async function syncStarredSegments(
  accessToken: string,
  onProgress?: ProgressCallback,
  options?: SyncOptions,
): Promise<number> {
  if (_syncInProgress) {
    console.log('[segmentSync] sync already in progress, joining existing...');
    return _syncInProgress;
  }

  _syncInProgress = _doSyncStarredSegments(accessToken, onProgress, options);
  try {
    return await _syncInProgress;
  } finally {
    _syncInProgress = null;
  }
}

/** Internal implementation — never call directly, use syncStarredSegments. */
async function _doSyncStarredSegments(
  accessToken: string,
  onProgress?: ProgressCallback,
  options?: SyncOptions,
): Promise<number> {
  onProgress?.({ total: 0, done: 0, phase: 'list' });

  // Phase 1: list sync
  console.log('[segmentSync] starting list sync...');
  const { total, newStravaIds } = await syncSegmentList(accessToken);
  console.log(`[segmentSync] list sync done: ${total} starred, ${newStravaIds.length} new`);

  // Skip details unless explicitly requested
  if (options?.listOnly) {
    console.log('[segmentSync] list-only mode — skipping detail fetches');
    onProgress?.({ total, done: 0, phase: 'complete' });
    return total;
  }

  // Determine which segments need detail fetches
  const now = Math.floor(Date.now() / 1000);
  const staleThreshold = now - TTL.SEGMENT_DETAIL_SEC;

  let idsToFetch: number[];

  if (options?.forceDetails) {
    const allStarred = db
      .select({ stravaSegmentId: segments.stravaSegmentId })
      .from(segments)
      .where(eq(segments.isStarred, true))
      .all();
    idsToFetch = allStarred.map(r => Number(r.stravaSegmentId));
  } else {
    // Backfill detailFetchedAt for segments that already have polylines (migrated data)
    db.update(segments)
      .set({ detailFetchedAt: now })
      .where(
        sql`${segments.detailFetchedAt} IS NULL AND ${segments.polyline} IS NOT NULL`
      )
      .run();

    const staleRows = db
      .select({ stravaSegmentId: segments.stravaSegmentId })
      .from(segments)
      .where(
        sql`${segments.isStarred} = 1 AND (${segments.detailFetchedAt} IS NULL OR ${segments.detailFetchedAt} < ${staleThreshold})`
      )
      .all();
    idsToFetch = staleRows.map(r => Number(r.stravaSegmentId));
  }

  console.log(`[segmentSync] ${idsToFetch.length} segments need detail fetches`);
  onProgress?.({ total, done: 0, phase: 'details' });

  // Phase 2: fetch details (throttled)
  const done = idsToFetch.length > 0
    ? await syncSegmentDetails(accessToken, idsToFetch, onProgress)
    : 0;

  console.log(`[segmentSync] complete: ${total} starred, ${done} details fetched`);
  onProgress?.({ total, done, phase: 'complete' });
  return total;
}
