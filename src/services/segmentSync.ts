/**
 * Fetch the athlete's starred Strava segments and upsert them into the local
 * SQLite database via Drizzle ORM.
 *
 * A full sync fetches all starred segments + their polylines.
 * A fast sync only re-fetches segments whose polyline is missing.
 */

import { eq } from 'drizzle-orm';
import { ulid } from '../utils/ulid';
import { db } from '../db/client';
import { segments } from '../db/schema';
import { getStarredSegments, getSegmentDetail } from './stravaApi';

// ─── Progress callback ────────────────────────────────────────────────────────

export interface SyncProgress {
  total: number;
  done: number;
  phase: 'fetching' | 'saving' | 'complete' | 'error';
  error?: string;
}

type ProgressCallback = (progress: SyncProgress) => void;

// ─── Main sync function ───────────────────────────────────────────────────────

/**
 * Full sync: fetches all starred segments from Strava, upserts to SQLite.
 * Calls onProgress so the UI can show a status line updating in real time.
 */
export async function syncStarredSegments(
  accessToken: string,
  onProgress?: ProgressCallback,
): Promise<number> {
  onProgress?.({ total: 0, done: 0, phase: 'fetching' });

  const starred = await getStarredSegments(accessToken);
  const total = starred.length;

  onProgress?.({ total, done: 0, phase: 'saving' });

  let done = 0;
  const now = Math.floor(Date.now() / 1000);

  for (const seg of starred) {
    // Fetch detail only if we need the polyline
    let polyline: string | null = null;
    try {
      const detail = await getSegmentDetail(seg.id, accessToken);
      polyline = detail.map?.polyline ?? null;
    } catch {
      // Non-fatal: store segment without polyline, refetch later
    }

    const existing = await db
      .select({ id: segments.id })
      .from(segments)
      .where(eq(segments.stravaSegmentId, String(seg.id)))
      .get();

    if (existing) {
      await db
        .update(segments)
        .set({
          name: seg.name,
          distanceM: seg.distance,
          elevationM: seg.total_elevation_gain,
          startLat: seg.start_latlng[0],
          startLng: seg.start_latlng[1],
          endLat: seg.end_latlng[0],
          endLng: seg.end_latlng[1],
          polyline,
          isStarred: true,
          lastFetchedAt: now,
        })
        .where(eq(segments.stravaSegmentId, String(seg.id)));
    } else {
      await db.insert(segments).values({
        id: ulid(),
        stravaSegmentId: String(seg.id),
        name: seg.name,
        distanceM: seg.distance,
        elevationM: seg.total_elevation_gain,
        startLat: seg.start_latlng[0],
        startLng: seg.start_latlng[1],
        endLat: seg.end_latlng[0],
        endLng: seg.end_latlng[1],
        polyline,
        isStarred: true,
        lastFetchedAt: now,
      });
    }

    done++;
    onProgress?.({ total, done, phase: 'saving' });
  }

  onProgress?.({ total, done, phase: 'complete' });
  return done;
}
