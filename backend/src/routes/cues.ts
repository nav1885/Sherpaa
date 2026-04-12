/**
 * Cue generation route.
 *
 * POST /cues/generate
 *   Auth: Bearer JWT
 *   Body: { segments: SegmentInput[], goalMode: 'pr' | 'training' | 'recovery' }
 *
 * For each segment, calls Anthropic's Claude Haiku with an anonymized stats
 * payload and returns three coaching cue variants (aggressive / moderate /
 * recovery). Calls run in parallel; a single segment failure falls back to
 * generic template cues rather than failing the whole batch.
 *
 * Strava data compliance (product spec Risk 1): the prompt receives the
 * segment NAME (public) plus anonymized stats (distance, elevation, best
 * time, effort count, tendency tag). No Strava IDs, no athlete IDs, no raw
 * activity data — nothing that could identify a Strava user.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/auth';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

type GoalMode = 'pr' | 'training' | 'recovery';
type PacingTendency = 'fade' | 'strongStart' | 'consistent' | 'unknown';

interface SegmentInput {
  name: string;
  distanceM: number;
  elevationM: number;
  bestTimeSec: number | null;
  effortCount: number;
  pacingTendency: PacingTendency;
}

interface CueVariants {
  aggressive: string;
  moderate: string;
  recovery: string;
}

interface CueResult extends CueVariants {
  segmentIndex: number;
  fallback: boolean;
}

interface GenerateRequestBody {
  segments: SegmentInput[];
  goalMode: GoalMode;
}

// ─── Prompt construction ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a concise cycling coach writing spoken audio cues for a rider who is about to ride a Strava segment.

You will receive anonymized statistics about ONE segment and the rider's goal for today's ride. Return THREE short coaching cues for that segment — one per effort tone (aggressive, moderate, recovery).

Rules:
- Each cue is 1–2 sentences, spoken aloud, under 25 words.
- Use ONLY the statistics provided. Do not invent data, PR times, or rider history.
- If effortCount < 3, do not reference pacing tendency or past attempts — use generic encouragement framed by the goal mode.
- If pacingTendency is "unknown", do not mention tendency.
- Reference the segment by name naturally. Do not use Strava jargon ("KOM", "leaderboard").
- The "aggressive" cue should push for a PR attempt. "Moderate" is steady effort. "Recovery" is conservative — protect effort for later.
- Output STRICT JSON: { "aggressive": "...", "moderate": "...", "recovery": "..." } — no prose, no markdown.`;

function buildUserPrompt(seg: SegmentInput, goalMode: GoalMode): string {
  const distanceKm = (seg.distanceM / 1000).toFixed(2);
  const bestTime = seg.bestTimeSec !== null
    ? `${Math.floor(seg.bestTimeSec / 60)}:${(seg.bestTimeSec % 60).toString().padStart(2, '0')}`
    : 'none recorded';

  return JSON.stringify({
    segment: {
      name: seg.name,
      distanceKm: Number(distanceKm),
      elevationM: seg.elevationM,
      bestTime,
      effortCount: seg.effortCount,
      pacingTendency: seg.pacingTendency,
    },
    goalMode,
  });
}

function genericFallback(seg: SegmentInput, goalMode: GoalMode): CueVariants {
  const distanceKm = (seg.distanceM / 1000).toFixed(1);
  const base = `${seg.name} coming up — ${distanceKm} km.`;
  switch (goalMode) {
    case 'pr':
      return {
        aggressive: `${base} Commit from the start and hold effort through the top.`,
        moderate: `${base} Ride strong but even — save a kick for the final quarter.`,
        recovery: `${base} Stay smooth. Don't spike the heart rate today.`,
      };
    case 'recovery':
      return {
        aggressive: `${base} Keep it light even if you feel good.`,
        moderate: `${base} Conversational pace only.`,
        recovery: `${base} Spin easy. Protect the legs.`,
      };
    default:
      return {
        aggressive: `${base} Push the first half, assess at halfway.`,
        moderate: `${base} Sustained tempo — repeatable effort.`,
        recovery: `${base} Easy rhythm, focus on form.`,
      };
  }
}

// ─── Anthropic call ───────────────────────────────────────────────────────────

interface AnthropicMessagesResponse {
  content: Array<{ type: string; text?: string }>;
}

async function callClaudeForSegment(
  seg: SegmentInput,
  goalMode: GoalMode,
  log: FastifyInstance['log'],
): Promise<CueVariants | null> {
  if (!ANTHROPIC_API_KEY) {
    log.error('ANTHROPIC_API_KEY not set — falling back to generic cues');
    return null;
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(seg, goalMode) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    log.error({ status: res.status, body }, 'anthropic call failed');
    return null;
  }

  const data = (await res.json()) as AnthropicMessagesResponse;
  const text = data.content.find(c => c.type === 'text')?.text?.trim();
  if (!text) return null;

  // Strip markdown fences if the model ignored instructions
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<CueVariants>;
    if (
      typeof parsed.aggressive === 'string' &&
      typeof parsed.moderate === 'string' &&
      typeof parsed.recovery === 'string'
    ) {
      return {
        aggressive: parsed.aggressive,
        moderate: parsed.moderate,
        recovery: parsed.recovery,
      };
    }
    log.error({ parsed }, 'anthropic response missing variants');
    return null;
  } catch (err) {
    log.error({ err, text: cleaned }, 'anthropic response not valid JSON');
    return null;
  }
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export default async function cueRoutes(app: FastifyInstance) {
  app.post<{ Body: GenerateRequestBody }>(
    '/cues/generate',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { segments, goalMode } = req.body ?? {};

      if (!Array.isArray(segments) || segments.length === 0) {
        return reply.status(400).send({ error: 'segments array is required' });
      }
      if (goalMode !== 'pr' && goalMode !== 'training' && goalMode !== 'recovery') {
        return reply.status(400).send({ error: 'goalMode must be pr | training | recovery' });
      }
      if (segments.length > 20) {
        return reply.status(400).send({ error: 'max 20 segments per request' });
      }

      app.log.info(
        { riderId: req.auth?.riderId, count: segments.length, goalMode },
        'cues.generate',
      );

      const results = await Promise.all(
        segments.map(async (seg, i): Promise<CueResult> => {
          try {
            const variants = await callClaudeForSegment(seg, goalMode, app.log);
            if (variants) {
              return { segmentIndex: i, ...variants, fallback: false };
            }
          } catch (err) {
            app.log.error({ err, segmentIndex: i }, 'callClaudeForSegment threw');
          }
          return { segmentIndex: i, ...genericFallback(seg, goalMode), fallback: true };
        }),
      );

      return reply.send({ cues: results });
    },
  );
}
