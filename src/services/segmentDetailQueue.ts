/**
 * Background queue for fetching segment details (polylines).
 * Throttled to 1 request per 2 seconds to stay under Strava rate limits.
 * Used during onboarding when a user has many starred segments, and
 * for lazy-loading polylines when matched segments are missing them.
 */

import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { segments } from '../db/schema';
import { getSegmentDetail } from './stravaApi';
import { TTL } from '../constants/ttl';

export interface DetailQueueCallbacks {
  onSegmentReady?: (stravaSegmentId: number) => void;
  onProgress?: (done: number, total: number) => void;
  onComplete?: () => void;
}

export class SegmentDetailQueue {
  private queue: number[] = [];
  private isRunning = false;
  private isCancelled = false;
  private done = 0;

  constructor(
    private accessToken: string,
    private callbacks: DetailQueueCallbacks = {},
  ) {}

  /** Enqueue Strava segment IDs for background fetching. */
  enqueue(stravaSegmentIds: number[]): void {
    this.queue.push(...stravaSegmentIds);
  }

  /** Promote specific IDs to the front of the queue (for on-demand polyline loads). */
  prioritize(stravaSegmentIds: number[]): void {
    const prioritySet = new Set(stravaSegmentIds);
    const promoted = this.queue.filter(id => prioritySet.has(id));
    const rest = this.queue.filter(id => !prioritySet.has(id));
    // Also add any that weren't already queued
    const newIds = stravaSegmentIds.filter(id => !this.queue.includes(id));
    this.queue = [...promoted, ...newIds, ...rest];
  }

  /** Start processing. Idempotent — calling twice is a no-op. */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isCancelled = false;

    while (this.queue.length > 0 && !this.isCancelled) {
      const stravaId = this.queue.shift()!;

      try {
        const detail = await getSegmentDetail(stravaId, this.accessToken);
        const polyline = detail.map?.polyline ?? null;
        const now = Math.floor(Date.now() / 1000);

        db.update(segments)
          .set({ polyline, detailFetchedAt: now })
          .where(eq(segments.stravaSegmentId, String(stravaId)))
          .run();

        this.callbacks.onSegmentReady?.(stravaId);
      } catch (err) {
        console.warn(`[detailQueue] failed for ${stravaId}:`, err);
        // Non-fatal — skip, don't re-queue
      }

      this.done++;
      this.callbacks.onProgress?.(this.done, this.done + this.queue.length);

      // Throttle: wait before next request
      if (this.queue.length > 0 && !this.isCancelled) {
        await new Promise(resolve => setTimeout(resolve, TTL.DETAIL_THROTTLE_MS));
      }
    }

    if (!this.isCancelled) {
      this.callbacks.onComplete?.();
    }

    this.isRunning = false;
  }

  /** Cancel all pending fetches. */
  cancel(): void {
    this.isCancelled = true;
  }

  get remaining(): number {
    return this.queue.length;
  }

  get running(): boolean {
    return this.isRunning;
  }
}
