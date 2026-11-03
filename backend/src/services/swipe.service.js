const prisma = require('../config/prisma');
const userRepository = require('../repositories/user.repository');
const swipeRepository = require('../repositories/swipe.repository');
const matchRepository = require('../repositories/match.repository');
const HttpError = require('../utils/httpError');

/**
 * Record a swipe. If LIKE and the target has already LIKEd back, also create
 * the Match row (atomically, inside an interactive PostgreSQL transaction with advisory lock).
 *
 * Returns: { swipe, match | null, isNewMatch: boolean }
 */
async function recordSwipe(fromUserId, { toUserId, direction }) {
  const fromId = Number(fromUserId);
  const toId = Number(toUserId);

  if (fromId === toId) {
    throw new HttpError(400, 'You cannot swipe on yourself');
  }

  const target = await userRepository.findById(toId);
  if (!target) throw new HttpError(404, 'Target user not found');

  const [minId, maxId] = matchRepository.canonicalPair(fromId, toId);

  return prisma.$transaction(
    async (tx) => {
      // Database-level safeguard: PostgreSQL transaction advisory lock on canonical user pair.
      // Serializes concurrent reciprocal swipes so neither thread reads a stale snapshot.
      await tx.$executeRawUnsafe(
        'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
        minId,
        maxId
      );

      const swipe = await swipeRepository.recordSwipe(tx, {
        fromUserId: fromId,
        toUserId: toId,
        direction,
      });

      let match = null;
      let isNewMatch = false;

      if (direction === 'LIKE') {
        const reciprocal = await swipeRepository.findReciprocalSwipe(tx, fromId, toId);

        if (reciprocal && reciprocal.direction === 'LIKE') {
          const existing = await matchRepository.findMatch(fromId, toId, tx);

          match = await matchRepository.createMatch(tx, fromId, toId);
          isNewMatch = !existing;
        }
      }

      return { swipe, match, isNewMatch };
    },
    {
      maxWait: 15000,
      timeout: 25000,
    }
  );
}

module.exports = { recordSwipe };
