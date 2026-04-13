/**
 * Persists ride data and segment efforts to SQLite after a ride ends.
 * Reads from rideStore state (passed in, not subscribed).
 */

import { db } from '../db/client';
import { rides, segmentEfforts } from '../db/schema';
import { CompletedSegmentResult } from '../store/rideStore';

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface SaveRideInput {
  riderId: string;
  goalMode: 'pr' | 'training' | 'recovery';
  startedAt: number;       // ms timestamp
  endedAt: number;         // ms timestamp
  distanceKm: number;
  elevationM: number;
  completedSegments: CompletedSegmentResult[];
  gpxTrackPoints: Array<{ lat: number; lng: number; timestamp: number }>;
}

export function saveRide(input: SaveRideInput): string {
  const rideId = genId();
  const nowSec = Math.floor(Date.now() / 1000);

  // Insert ride
  db.insert(rides)
    .values({
      id: rideId,
      riderId: input.riderId,
      name: formatRideName(),
      startedAt: Math.floor(input.startedAt / 1000),
      endedAt: Math.floor(input.endedAt / 1000),
      distanceM: input.distanceKm * 1000,
      elevationM: input.elevationM,
      gpxTrack: JSON.stringify(input.gpxTrackPoints),
      goalMode: input.goalMode,
      createdAt: nowSec,
    })
    .run();

  // Insert segment efforts
  for (const seg of input.completedSegments) {
    if (seg.wasSkipped) continue;

    db.insert(segmentEfforts)
      .values({
        id: genId(),
        segmentId: seg.segmentId,
        rideId,
        riderId: input.riderId,
        timeSec: seg.timeSec,
        wasSkipped: false,
        isNewPR: seg.isNewPR,
        gapToPreSeconds: seg.gapToPreSeconds,
        createdAt: nowSec,
      })
      .run();
  }

  return rideId;
}

function formatRideName(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning Ride';
  if (hour < 17) return 'Afternoon Ride';
  return 'Evening Ride';
}

/**
 * Generate a spoken debrief summary from completed segments.
 */
export function generateDebrief(
  completedSegments: CompletedSegmentResult[],
  durationSec: number,
  distanceKm: number,
): string {
  const hit = completedSegments.filter(s => !s.wasSkipped);
  const prs = hit.filter(s => s.isNewPR);
  const total = completedSegments.length;

  const parts: string[] = [];

  // Opening
  parts.push(`Ride complete. You hit ${hit.length} of ${total} segment${total !== 1 ? 's' : ''}.`);

  // PR callouts
  for (const pr of prs) {
    const time = formatTimeSec(pr.timeSec);
    parts.push(`New PR on ${pr.name}: ${time}, ${Math.abs(pr.gapToPreSeconds)} seconds faster.`);
  }

  // Non-PR callouts (worst gap only, to keep it brief)
  const nonPR = hit.filter(s => !s.isNewPR && s.prTimeSec);
  if (nonPR.length > 0) {
    const worst = nonPR.reduce((a, b) => a.gapToPreSeconds > b.gapToPreSeconds ? a : b);
    parts.push(`${worst.name} was ${worst.gapToPreSeconds} seconds off PR.`);
  }

  // Closing
  if (prs.length > 0) {
    parts.push('Strong effort today.');
  } else if (hit.length > 0) {
    parts.push('Solid ride. Keep building.');
  }

  return parts.join(' ');
}

function formatTimeSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s} seconds`;
}
