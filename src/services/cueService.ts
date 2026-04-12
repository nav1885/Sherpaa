/**
 * SQLite persistence for generated cues.
 *
 * Cues are keyed on (segmentId, goalMode). Re-generating for the same pair
 * replaces the existing row via delete-then-insert (Drizzle's sync SQLite
 * driver doesn't expose ON CONFLICT through `.insert().onConflict(...)` in
 * a way that works cleanly with three text columns, so the delete-first
 * pattern is simpler and the index makes both operations cheap).
 */

import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { cues, Cue } from '../db/schema';

type GoalMode = 'pr' | 'training' | 'recovery';

export interface SaveCueInput {
  segmentId: string;
  goalMode: GoalMode;
  aggressive: string;
  moderate: string;
  recovery: string;
}

function genId(): string {
  return `cue_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function saveCues(inputs: SaveCueInput[]): void {
  const now = Math.floor(Date.now() / 1000);
  for (const c of inputs) {
    db.delete(cues)
      .where(and(eq(cues.segmentId, c.segmentId), eq(cues.goalMode, c.goalMode)))
      .run();

    db.insert(cues)
      .values({
        id: genId(),
        segmentId: c.segmentId,
        goalMode: c.goalMode,
        aggressive: c.aggressive,
        moderate: c.moderate,
        recovery: c.recovery,
        generatedAt: now,
      })
      .run();
  }
}

export function getCueForSegment(segmentId: string, goalMode: GoalMode): Cue | null {
  const row = db
    .select()
    .from(cues)
    .where(and(eq(cues.segmentId, segmentId), eq(cues.goalMode, goalMode)))
    .get();
  return row ?? null;
}
