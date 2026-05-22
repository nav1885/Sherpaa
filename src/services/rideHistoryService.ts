/**
 * Reads completed rides from SQLite for the History screens.
 * Aggregates segment effort counts and PR counts per ride for the list view,
 * and joins efforts with segment names for the detail view.
 */

import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { rides, segmentEfforts, segments, type Ride, type SegmentEffort } from '../db/schema';

export interface RideHistoryRow {
  id: string;
  name: string;
  startedAt: number; // unix sec
  endedAt: number;
  distanceM: number;
  elevationM: number;
  goalMode: 'pr' | 'training' | 'recovery';
  segmentCount: number;
  prCount: number;
  stravaSynced: boolean;
}

export interface RideEffortRow {
  effortId: string;
  segmentId: string;
  segmentName: string;
  segmentDistanceM: number;
  timeSec: number;
  isNewPR: boolean;
  gapToPreSeconds: number;
  cueVariantPlayed: 'aggressive' | 'moderate' | 'recovery' | null;
  cueTextPlayed: string | null;
  avgHrBpm: number | null;
  avgWatts: number | null;
}

export interface RideDetail {
  ride: Ride;
  efforts: RideEffortRow[];
}

export function loadRideHistory(riderId: string): RideHistoryRow[] {
  const rideRows = db
    .select()
    .from(rides)
    .where(eq(rides.riderId, riderId))
    .orderBy(desc(rides.startedAt))
    .all();

  return rideRows.map((r) => {
    const efforts = db
      .select()
      .from(segmentEfforts)
      .where(eq(segmentEfforts.rideId, r.id))
      .all();
    return {
      id: r.id,
      name: r.name,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      distanceM: r.distanceM,
      elevationM: r.elevationM,
      goalMode: r.goalMode,
      segmentCount: efforts.length,
      prCount: efforts.filter((e) => e.isNewPR).length,
      stravaSynced: r.stravaSynced,
    };
  });
}

export function loadRideDetail(rideId: string): RideDetail | null {
  const ride = db.select().from(rides).where(eq(rides.id, rideId)).get();
  if (!ride) return null;

  const effortRows: SegmentEffort[] = db
    .select()
    .from(segmentEfforts)
    .where(eq(segmentEfforts.rideId, rideId))
    .all();

  const efforts: RideEffortRow[] = effortRows.map((e) => {
    const seg = db.select().from(segments).where(eq(segments.id, e.segmentId)).get();
    return {
      effortId: e.id,
      segmentId: e.segmentId,
      segmentName: seg?.name ?? 'Unknown segment',
      segmentDistanceM: seg?.distanceM ?? 0,
      timeSec: e.timeSec,
      isNewPR: e.isNewPR,
      gapToPreSeconds: e.gapToPreSeconds,
      cueVariantPlayed: e.cueVariantPlayed,
      cueTextPlayed: e.cueTextPlayed,
      avgHrBpm: e.avgHrBpm,
      avgWatts: e.avgWatts,
    };
  });

  return { ride, efforts };
}

export function formatDistanceKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTimeSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatRelativeDate(unixSec: number): string {
  const now = Date.now() / 1000;
  const ageSec = now - unixSec;
  if (ageSec < 60) return 'Just now';
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
  if (ageSec < 86400) return `${Math.floor(ageSec / 3600)}h ago`;
  if (ageSec < 604800) return `${Math.floor(ageSec / 86400)}d ago`;
  const d = new Date(unixSec * 1000);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
