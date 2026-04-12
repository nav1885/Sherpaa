/**
 * JWT auth preHandler — verifies `Authorization: Bearer <jwt>` and attaches
 * the decoded `riderId` / `stravaAthleteId` to the request for downstream handlers.
 *
 * Route handlers that need authentication should register this preHandler:
 *
 *   app.post('/cues/generate', { preHandler: requireAuth }, handler);
 *
 * Requests without a valid token are rejected with 401 before they reach the handler.
 */

import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';

export interface AuthPayload {
  riderId: string;
  stravaAthleteId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthPayload;
  }
}

export const requireAuth: preHandlerHookHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'missing_bearer_token' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return reply.status(401).send({ error: 'empty_bearer_token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string; stravaAthleteId?: string };
    if (!decoded.sub || !decoded.stravaAthleteId) {
      return reply.status(401).send({ error: 'malformed_token' });
    }
    req.auth = { riderId: decoded.sub, stravaAthleteId: decoded.stravaAthleteId };
  } catch {
    return reply.status(401).send({ error: 'invalid_token' });
  }
};
